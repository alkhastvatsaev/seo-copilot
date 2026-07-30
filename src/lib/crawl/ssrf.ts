import { assertPublicHostname } from "./ssrf-host";
import {
  assertHostnameResolvesPublic,
  type ResolveAddresses,
} from "./ssrf-resolve";

export { assertPublicHostname, isBlockedHostname } from "./ssrf-host";
export {
  assertHostnameResolvesPublic,
  type ResolveAddresses,
} from "./ssrf-resolve";

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

export async function assertPublicHttpUrlResolved(
  urlString: string,
  resolveAddresses?: ResolveAddresses,
): Promise<void> {
  assertPublicHttpUrl(urlString);
  const url = new URL(urlString);
  await assertHostnameResolvesPublic(url.hostname, resolveAddresses);
}
