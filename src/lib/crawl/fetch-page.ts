import {
  CRAWLER_USER_AGENT,
  MAX_HTML_BYTES,
  PAGE_FETCH_TIMEOUT_MS,
} from "./constants";
import { isUrlAllowedByRobots } from "./robots";
import { assertPublicHostname, assertPublicHttpUrl } from "./ssrf";

export type FetchedPage = {
  url: string;
  finalUrl: string;
  status: number;
  html: string;
  fetchedAt: string;
};

export class CrawlError extends Error {
  constructor(
    message: string,
    readonly code:
      | "ROBOTS_DISALLOWED"
      | "FETCH_FAILED"
      | "TIMEOUT"
      | "TOO_LARGE"
      | "INVALID_CONTENT"
      | "SSRF_BLOCKED",
  ) {
    super(message);
    this.name = "CrawlError";
  }
}

async function fetchWithTimeout(
  url: string,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PAGE_FETCH_TIMEOUT_MS);

  try {
    return await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": CRAWLER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new CrawlError("Timeout lors du fetch de la page.", "TIMEOUT");
    }
    throw new CrawlError("Impossible de récupérer la page.", "FETCH_FAILED");
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchHomepage(
  domain: string,
  fetchImpl: typeof fetch = fetch,
): Promise<FetchedPage> {
  try {
    assertPublicHostname(domain);
  } catch {
    throw new CrawlError(
      "Ce domaine n'est pas autorisé pour un audit.",
      "SSRF_BLOCKED",
    );
  }

  const httpsOrigin = `https://${domain}`;
  const httpOrigin = `http://${domain}`;
  const httpsUrl = `${httpsOrigin}/`;
  const httpUrl = `${httpOrigin}/`;

  const httpsAllowed = await isUrlAllowedByRobots(
    httpsOrigin,
    httpsUrl,
    fetchImpl,
  );
  if (!httpsAllowed) {
    throw new CrawlError(
      "robots.txt interdit le crawl de la page d'accueil.",
      "ROBOTS_DISALLOWED",
    );
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(httpsUrl, fetchImpl);
  } catch (httpsError) {
    const httpAllowed = await isUrlAllowedByRobots(
      httpOrigin,
      httpUrl,
      fetchImpl,
    );
    if (!httpAllowed) {
      throw new CrawlError(
        "robots.txt interdit le crawl de la page d'accueil.",
        "ROBOTS_DISALLOWED",
      );
    }
    try {
      response = await fetchWithTimeout(httpUrl, fetchImpl);
    } catch {
      throw httpsError;
    }
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    throw new CrawlError(
      "La réponse n'est pas du HTML.",
      "INVALID_CONTENT",
    );
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_HTML_BYTES) {
    throw new CrawlError("Page trop volumineuse.", "TOO_LARGE");
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_HTML_BYTES) {
    throw new CrawlError("Page trop volumineuse.", "TOO_LARGE");
  }

  const html = new TextDecoder("utf-8").decode(buffer);
  const finalUrl = response.url || httpsUrl;
  try {
    assertPublicHttpUrl(finalUrl);
  } catch {
    throw new CrawlError(
      "La redirection mène vers une cible non autorisée.",
      "SSRF_BLOCKED",
    );
  }

  return {
    url: httpsUrl,
    finalUrl,
    status: response.status,
    html,
    fetchedAt: new Date().toISOString(),
  };
}
