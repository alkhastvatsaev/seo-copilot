import robotsParser from "robots-parser";
import { CRAWLER_USER_AGENT, PAGE_FETCH_TIMEOUT_MS } from "./constants";

export async function isUrlAllowedByRobots(
  origin: string,
  targetUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const robotsUrl = new URL("/robots.txt", origin).toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PAGE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetchImpl(robotsUrl, {
      signal: controller.signal,
      headers: { "User-Agent": CRAWLER_USER_AGENT },
      redirect: "follow",
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
  } catch {
    return true;
  } finally {
    clearTimeout(timer);
  }
}
