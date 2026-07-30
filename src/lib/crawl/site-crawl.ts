import {
  CRAWL_CONCURRENCY,
  MAX_PAGES_PER_AUDIT,
} from "./constants";
import {
  fetchWithSafeRedirects,
  SafeFetchError,
} from "./safe-fetch";
import type { ResolveAddresses } from "@/lib/crawl/ssrf";
import { assertHostnameResolvesPublic, assertPublicHostname } from "@/lib/crawl/ssrf";
import { isUrlAllowedByRobots } from "./robots";
import { CrawlError } from "./fetch-page";
import { extractPageSignals, type PageExtract } from "@/lib/ai/pipeline/extract";
import { logger } from "@/lib/logger";

export type CrawledPage = {
  extract: PageExtract;
  html: string;
};

function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  const u = new URL(url);
  u.hash = "";
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.slice(0, -1);
  }
  return u.toString();
}

async function fetchHtmlPage(
  url: string,
  fetchImpl: typeof fetch,
  resolveAddresses?: ResolveAddresses,
): Promise<{ html: string; finalUrl: string; status: number } | null> {
  try {
    const origin = new URL(url).origin;
    const allowed = await isUrlAllowedByRobots(
      origin,
      url,
      fetchImpl,
      resolveAddresses,
    );
    if (!allowed) return null;

    const { response, finalUrl } = await fetchWithSafeRedirects(url, {
      fetchImpl,
      resolveAddresses,
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      return null;
    }
    const html = await response.text();
    if (response.status >= 400) return null;
    return { html, finalUrl, status: response.status };
  } catch (error) {
    if (error instanceof SafeFetchError && error.code === "SSRF_BLOCKED") {
      throw new CrawlError(error.message, "SSRF_BLOCKED");
    }
    logger.info({ err: error, url }, "skip page fetch");
    return null;
  }
}

async function discoverFromSitemap(
  origin: string,
  fetchImpl: typeof fetch,
  resolveAddresses?: ResolveAddresses,
): Promise<string[]> {
  const sitemapUrl = `${origin}/sitemap.xml`;
  try {
    const { response, finalUrl } = await fetchWithSafeRedirects(sitemapUrl, {
      fetchImpl,
      resolveAddresses,
      headers: { Accept: "application/xml,text/xml,*/*" },
    });
    if (!response.ok) return [];
    const body = await response.text();
    const locs = [...body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(
      (m) => m[1]!.trim(),
    );
    return locs.filter((loc) => sameHost(loc, finalUrl)).slice(0, MAX_PAGES_PER_AUDIT * 3);
  } catch {
    return [];
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current]!);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run()),
  );
  return results;
}

/**
 * Crawl homepage + up to MAX_PAGES_PER_AUDIT-1 internal URLs (sitemap or links).
 */
export async function crawlSite(
  domain: string,
  fetchImpl: typeof fetch = fetch,
  resolveAddresses?: ResolveAddresses,
): Promise<CrawledPage[]> {
  try {
    assertPublicHostname(domain);
    await assertHostnameResolvesPublic(domain, resolveAddresses);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ce domaine n'est pas autorisé pour un audit.";
    throw new CrawlError(message, "SSRF_BLOCKED");
  }

  const httpsHome = `https://${domain}/`;
  const home = await fetchHtmlPage(httpsHome, fetchImpl, resolveAddresses);
  if (!home) {
    const httpHome = `http://${domain}/`;
    const fallback = await fetchHtmlPage(httpHome, fetchImpl, resolveAddresses);
    if (!fallback) {
      throw new CrawlError("Impossible de récupérer la page.", "FETCH_FAILED");
    }
    return crawlFromHome(fallback, httpsHome, fetchImpl, resolveAddresses);
  }
  return crawlFromHome(home, httpsHome, fetchImpl, resolveAddresses);
}

async function crawlFromHome(
  home: { html: string; finalUrl: string; status: number },
  requestedUrl: string,
  fetchImpl: typeof fetch,
  resolveAddresses?: ResolveAddresses,
): Promise<CrawledPage[]> {
  const homeExtract = extractPageSignals({
    html: home.html,
    url: requestedUrl,
    finalUrl: home.finalUrl,
    status: home.status,
  });

  const pages: CrawledPage[] = [
    { extract: homeExtract, html: home.html },
  ];

  if (MAX_PAGES_PER_AUDIT <= 1) return pages;

  const origin = new URL(home.finalUrl).origin;
  const fromSitemap = await discoverFromSitemap(
    origin,
    fetchImpl,
    resolveAddresses,
  );
  const candidates = new Set<string>();
  // Prefer homepage links (user-facing IA) over raw sitemap order.
  for (const link of homeExtract.internalLinks) {
    candidates.add(normalizeUrl(link));
  }
  for (const loc of fromSitemap) {
    candidates.add(normalizeUrl(loc));
  }
  candidates.delete(normalizeUrl(home.finalUrl));

  const queue = [...candidates].slice(0, MAX_PAGES_PER_AUDIT * 2);
  const fetched = await mapPool(queue, CRAWL_CONCURRENCY, async (url) => {
    if (pages.length >= MAX_PAGES_PER_AUDIT) return null;
    const page = await fetchHtmlPage(url, fetchImpl, resolveAddresses);
    if (!page) return null;
    if (!sameHost(page.finalUrl, home.finalUrl)) return null;
    const extract = extractPageSignals({
      html: page.html,
      url,
      finalUrl: page.finalUrl,
      status: page.status,
    });
    const robots = extract.robotsMeta?.toLowerCase() ?? "";
    // Extra pages marked noindex pollute the sample without representing the site UX.
    if (robots.includes("noindex")) return null;
    return { extract, html: page.html } satisfies CrawledPage;
  });

  const seen = new Set([normalizeUrl(home.finalUrl)]);
  for (const page of fetched) {
    if (!page) continue;
    const key = normalizeUrl(page.extract.finalUrl);
    if (seen.has(key)) continue;
    seen.add(key);
    pages.push(page);
    if (pages.length >= MAX_PAGES_PER_AUDIT) break;
  }

  return pages;
}
