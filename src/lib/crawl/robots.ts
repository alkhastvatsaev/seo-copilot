import robotsParser from "robots-parser";
import { CRAWLER_USER_AGENT } from "./constants";
import { fetchWithSafeRedirects, SafeFetchError } from "./safe-fetch";
import type { ResolveAddresses } from "./ssrf";

export async function isUrlAllowedByRobots(
  origin: string,
  targetUrl: string,
  fetchImpl: typeof fetch = fetch,
  resolveAddresses?: ResolveAddresses,
): Promise<boolean> {
  const robotsUrl = new URL("/robots.txt", origin).toString();

  try {
    const { response } = await fetchWithSafeRedirects(robotsUrl, {
      fetchImpl,
      resolveAddresses,
      headers: {
        Accept: "text/plain,*/*",
      },
    });

    if (response.status === 404) {
      return true;
    }

    if (!response.ok) {
      return true;
    }

    const body = await response.text();
    const robots = robotsParser(robotsUrl, body);
    const allowed = robots.isAllowed(targetUrl, CRAWLER_USER_AGENT);
    return allowed !== false;
  } catch (error) {
    if (error instanceof SafeFetchError && error.code === "SSRF_BLOCKED") {
      return false;
    }
    return true;
  }
}
