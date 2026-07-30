import { MAX_HTML_BYTES } from "./constants";
import { isUrlAllowedByRobots } from "./robots";
import {
  fetchWithSafeRedirects,
  SafeFetchError,
} from "./safe-fetch";
import {
  assertHostnameResolvesPublic,
  assertPublicHostname,
  type ResolveAddresses,
} from "./ssrf";

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

function mapSafeFetchError(error: unknown): CrawlError {
  if (error instanceof SafeFetchError) {
    if (error.code === "SSRF_BLOCKED") {
      return new CrawlError(error.message, "SSRF_BLOCKED");
    }
    if (error.code === "TIMEOUT") {
      return new CrawlError(error.message, "TIMEOUT");
    }
    return new CrawlError(error.message, "FETCH_FAILED");
  }
  return new CrawlError("Impossible de récupérer la page.", "FETCH_FAILED");
}

export async function fetchHomepage(
  domain: string,
  fetchImpl: typeof fetch = fetch,
  resolveAddresses?: ResolveAddresses,
): Promise<FetchedPage> {
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

  const httpsOrigin = `https://${domain}`;
  const httpOrigin = `http://${domain}`;
  const httpsUrl = `${httpsOrigin}/`;
  const httpUrl = `${httpOrigin}/`;

  const httpsAllowed = await isUrlAllowedByRobots(
    httpsOrigin,
    httpsUrl,
    fetchImpl,
    resolveAddresses,
  );
  if (!httpsAllowed) {
    throw new CrawlError(
      "robots.txt interdit le crawl de la page d'accueil.",
      "ROBOTS_DISALLOWED",
    );
  }

  let result: Awaited<ReturnType<typeof fetchWithSafeRedirects>>;
  try {
    result = await fetchWithSafeRedirects(httpsUrl, {
      fetchImpl,
      resolveAddresses,
    });
  } catch (httpsError) {
    const httpAllowed = await isUrlAllowedByRobots(
      httpOrigin,
      httpUrl,
      fetchImpl,
      resolveAddresses,
    );
    if (!httpAllowed) {
      throw new CrawlError(
        "robots.txt interdit le crawl de la page d'accueil.",
        "ROBOTS_DISALLOWED",
      );
    }
    try {
      result = await fetchWithSafeRedirects(httpUrl, {
        fetchImpl,
        resolveAddresses,
      });
    } catch {
      throw mapSafeFetchError(httpsError);
    }
  }

  const { response, finalUrl } = result;

  const contentType = response.headers.get("content-type") ?? "";
  if (
    contentType &&
    !contentType.includes("text/html") &&
    !contentType.includes("application/xhtml")
  ) {
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

  return {
    url: httpsUrl,
    finalUrl,
    status: response.status,
    html,
    fetchedAt: new Date().toISOString(),
  };
}
