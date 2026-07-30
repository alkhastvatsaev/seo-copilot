import { lookup } from "node:dns/promises";
import {
  assertPublicHostname,
  isBlockedIpAddress,
  isIpv4Literal,
} from "./ssrf-host";

export type ResolveAddresses = (hostname: string) => Promise<string[]>;

async function defaultResolveAddresses(hostname: string): Promise<string[]> {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((entry) => entry.address);
}

/**
 * Hostname string check + DNS resolution: every A/AAAA must be public.
 * Mitigates DNS rebinding to private/metadata IPs.
 */
export async function assertHostnameResolvesPublic(
  hostname: string,
  resolveAddresses: ResolveAddresses = defaultResolveAddresses,
): Promise<void> {
  assertPublicHostname(hostname);

  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  const bare =
    host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;

  if (isIpv4Literal(bare) || bare.includes(":")) {
    return;
  }

  let addresses: string[];
  try {
    addresses = await resolveAddresses(bare);
  } catch {
    throw new Error("Impossible de résoudre ce domaine.");
  }

  if (addresses.length === 0) {
    throw new Error("Impossible de résoudre ce domaine.");
  }

  for (const address of addresses) {
    if (isBlockedIpAddress(address)) {
      throw new Error("Ce domaine n'est pas autorisé pour un audit.");
    }
  }
}
