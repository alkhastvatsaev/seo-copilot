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
  imagesWithoutAlt: number;
  imageCount: number;
  hasViewport: boolean;
  isHttps: boolean;
  visibleWordCount: number;
  isRootHomepage: boolean;
  isUtilityHomepage: boolean;
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

export function extractPageSignals(input: {
  html: string;
  url: string;
  finalUrl: string;
  status: number;
}): PageExtract {
  const root = parse(input.html);
  const title = root.querySelector("title")?.text.trim() || null;
  const metaDescription =
    root
      .querySelector('meta[name="description"]')
      ?.getAttribute("content")
      ?.trim() || null;
  const canonical =
    root.querySelector('link[rel="canonical"]')?.getAttribute("href")?.trim() ||
    null;
  const h1Nodes = root.querySelectorAll("h1");
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
  const utilityHomepage =
    hasSearchForm(root) && h1Nodes.length === 0 && rootHomepage;

  return {
    url: input.url,
    finalUrl: input.finalUrl,
    status: input.status,
    title,
    metaDescription,
    canonical,
    h1Count: h1Nodes.length,
    h1Texts: h1Nodes.map((node) => node.text.trim()).filter(Boolean),
    imagesWithoutAlt,
    imageCount: images.length,
    hasViewport,
    isHttps,
    visibleWordCount,
    isRootHomepage: rootHomepage,
    isUtilityHomepage: utilityHomepage,
  };
}
