import { CRAWLER_USER_AGENT, PAGE_FETCH_TIMEOUT_MS } from "./constants";
import {
  assertPublicHttpUrlResolved,
  type ResolveAddresses,
} from "./ssrf";

export const MAX_REDIRECTS = 5;

export type SafeFetchResult = {
  response: Response;
  finalUrl: string;
};

export class SafeFetchError extends Error {
  constructor(
    message: string,
    readonly code: "TIMEOUT" | "FETCH_FAILED" | "SSRF_BLOCKED" | "TOO_MANY_REDIRECTS",
  ) {
    super(message);
    this.name = "SafeFetchError";
  }
}

type SafeFetchOptions = {
  fetchImpl?: typeof fetch;
  resolveAddresses?: ResolveAddresses;
  headers?: HeadersInit;
  timeoutMs?: number;
};

/**
 * Fetch with redirect:manual — every hop is SSRF-checked (hostname + DNS).
 */
export async function fetchWithSafeRedirects(
  startUrl: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? PAGE_FETCH_TIMEOUT_MS;
  let currentUrl = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    try {
      await assertPublicHttpUrlResolved(currentUrl, options.resolveAddresses);
    } catch {
      throw new SafeFetchError(
        "Ce domaine n'est pas autorisé pour un audit.",
        "SSRF_BLOCKED",
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetchImpl(currentUrl, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": CRAWLER_USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          ...options.headers,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new SafeFetchError("Timeout lors du fetch de la page.", "TIMEOUT");
      }
      throw new SafeFetchError(
        "Impossible de récupérer la page.",
        "FETCH_FAILED",
      );
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new SafeFetchError(
          "Impossible de récupérer la page.",
          "FETCH_FAILED",
        );
      }
      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch {
        throw new SafeFetchError(
          "Impossible de récupérer la page.",
          "FETCH_FAILED",
        );
      }
      continue;
    }

    return { response, finalUrl: currentUrl };
  }

  throw new SafeFetchError(
    "Trop de redirections lors du crawl.",
    "TOO_MANY_REDIRECTS",
  );
}
