import { parse } from "node-html-parser";

export type PageExtract = {
  url: string;
  finalUrl: string;
  status: number;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  h1Count: number;
  h1Texts: string[];
  h2Count: number;
  imagesWithoutAlt: number;
  imageCount: number;
  hasViewport: boolean;
  isHttps: boolean;
  visibleWordCount: number;
  isRootHomepage: boolean;
  isUtilityHomepage: boolean;
  /** Thin JS shell: little text, scripts present — SPA-like. */
  isLikelySpaShell: boolean;
  htmlLang: string | null;
  robotsMeta: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  jsonLdBlockCount: number;
  jsonLdTypes: string[];
  internalLinkCount: number;
  externalLinkCount: number;
  internalLinks: string[];
};

function visibleWordCountFromHtml(root: ReturnType<typeof parse>): number {
  const body = root.querySelector("body");
  if (!body) return 0;
  body.querySelectorAll("script, style, noscript").forEach((node) => {
    node.remove();
  });
  const text = body.text.replace(/\s+/g, " ").trim();
  if (!text) return 0;
  return text.split(" ").filter(Boolean).length;
}

function isRootHomepage(finalUrl: string): boolean {
  try {
    const path = new URL(finalUrl).pathname;
    return path === "/" || path === "";
  } catch {
    return false;
  }
}

function hasSearchForm(root: ReturnType<typeof parse>): boolean {
  const inputs = root.querySelectorAll("input, textarea");
  return inputs.some((input) => {
    const name = input.getAttribute("name")?.toLowerCase();
    const type = input.getAttribute("type")?.toLowerCase();
    return name === "q" || type === "search";
  });
}

function metaContent(
  root: ReturnType<typeof parse>,
  selector: string,
): string | null {
  return root.querySelector(selector)?.getAttribute("content")?.trim() || null;
}

function parseJsonLdTypes(root: ReturnType<typeof parse>): {
  count: number;
  types: string[];
} {
  const scripts = root.querySelectorAll('script[type="application/ld+json"]');
  const types: string[] = [];
  for (const script of scripts) {
    const raw = script.text.trim();
    if (!raw) continue;
    try {
      const data: unknown = JSON.parse(raw);
      const stack = Array.isArray(data) ? data : [data];
      for (const item of stack) {
        if (!item || typeof item !== "object") continue;
        const record = item as Record<string, unknown>;
        const graph = record["@graph"];
        if (Array.isArray(graph)) {
          for (const node of graph) {
            if (node && typeof node === "object" && "@type" in node) {
              const t = (node as Record<string, unknown>)["@type"];
              if (typeof t === "string") types.push(t);
              if (Array.isArray(t)) {
                for (const x of t) if (typeof x === "string") types.push(x);
              }
            }
          }
        }
        const t = record["@type"];
        if (typeof t === "string") types.push(t);
        if (Array.isArray(t)) {
          for (const x of t) if (typeof x === "string") types.push(x);
        }
      }
    } catch {
      // invalid JSON-LD ignored for typing
    }
  }
  return { count: scripts.length, types: [...new Set(types)] };
}

function collectLinks(
  root: ReturnType<typeof parse>,
  finalUrl: string,
): { internal: string[]; externalCount: number } {
  let host: string;
  try {
    host = new URL(finalUrl).host;
  } catch {
    return { internal: [], externalCount: 0 };
  }

  const internal = new Set<string>();
  let externalCount = 0;

  for (const anchor of root.querySelectorAll("a[href]")) {
    const href = anchor.getAttribute("href")?.trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }
    try {
      const resolved = new URL(href, finalUrl);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") continue;
      if (resolved.host === host) {
        resolved.hash = "";
        internal.add(resolved.toString());
      } else {
        externalCount += 1;
      }
    } catch {
      // skip bad hrefs
    }
  }

  return { internal: [...internal], externalCount };
}

export function extractPageSignals(input: {
  html: string;
  url: string;
  finalUrl: string;
  status: number;
}): PageExtract {
  const root = parse(input.html);
  const title = root.querySelector("title")?.text.trim() || null;
  const metaDescription =
    metaContent(root, 'meta[name="description"]') ||
    metaContent(root, 'meta[name="Description"]');
  const canonical =
    root.querySelector('link[rel="canonical"]')?.getAttribute("href")?.trim() ||
    null;
  const h1Nodes = root.querySelectorAll("h1");
  const h2Count = root.querySelectorAll("h2").length;
  const images = root.querySelectorAll("img");
  const imagesWithoutAlt = images.filter((img) => {
    const alt = img.getAttribute("alt");
    return alt === null || alt === undefined;
  }).length;
  const hasViewport = Boolean(
    root.querySelector('meta[name="viewport"]')?.getAttribute("content"),
  );

  let isHttps = false;
  try {
    isHttps = new URL(input.finalUrl).protocol === "https:";
  } catch {
    isHttps = false;
  }

  const visibleWordCount = visibleWordCountFromHtml(root);
  const rootHomepage = isRootHomepage(input.finalUrl);
  const scriptCount = root.querySelectorAll("script").length;
  const links = collectLinks(root, input.finalUrl);
  const utilityHomepage =
    hasSearchForm(root) && h1Nodes.length === 0 && rootHomepage;
  const isLikelySpaShell =
    visibleWordCount < 80 &&
    scriptCount >= 2 &&
    links.internal.length <= 3 &&
    !utilityHomepage;

  const jsonLd = parseJsonLdTypes(root);
  const htmlLang =
    root.querySelector("html")?.getAttribute("lang")?.trim() || null;

  return {
    url: input.url,
    finalUrl: input.finalUrl,
    status: input.status,
    title,
    metaDescription,
    canonical,
    h1Count: h1Nodes.length,
    h1Texts: h1Nodes.map((node) => node.text.trim()).filter(Boolean),
    h2Count,
    imagesWithoutAlt,
    imageCount: images.length,
    hasViewport,
    isHttps,
    visibleWordCount,
    isRootHomepage: rootHomepage,
    isUtilityHomepage: utilityHomepage,
    isLikelySpaShell,
    htmlLang,
    robotsMeta: metaContent(root, 'meta[name="robots"]'),
    ogTitle: metaContent(root, 'meta[property="og:title"]'),
    ogDescription: metaContent(root, 'meta[property="og:description"]'),
    ogImage: metaContent(root, 'meta[property="og:image"]'),
    twitterCard: metaContent(root, 'meta[name="twitter:card"]'),
    jsonLdBlockCount: jsonLd.count,
    jsonLdTypes: jsonLd.types,
    internalLinkCount: links.internal.length,
    externalLinkCount: links.externalCount,
    internalLinks: links.internal,
  };
}
