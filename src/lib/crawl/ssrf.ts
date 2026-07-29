import { assertPublicHostname } from "./ssrf-host";

export { assertPublicHostname, isBlockedHostname } from "./ssrf-host";

export function assertPublicHttpUrl(urlString: string): void {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error("URL de crawl invalide.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Protocole de crawl non autorisé.");
  }
  assertPublicHostname(url.hostname);
}
