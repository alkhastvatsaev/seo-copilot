/** Browser-safe hostname / IP SSRF checks (no Node builtins). */

const BLOCKED_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".lan",
  ".home",
  ".corp",
  ".localdomain",
];

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
]);

export function isIpv4Literal(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

export function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  const [a, b] = parts as [number, number, number, number];
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe80:")) return true;
  if (normalized.startsWith(":ffff:")) {
    const v4 = normalized.slice(7);
    if (isIpv4Literal(v4)) return isPrivateIpv4(v4);
  }
  // IPv4-mapped :ffff:a.b.c.d
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1] && isIpv4Literal(mapped[1])) {
    return isPrivateIpv4(mapped[1]);
  }
  return false;
}

function looksLikeIpv6(host: string): boolean {
  return host.includes(":");
}

/** True if a resolved address must not be contacted. */
export function isBlockedIpAddress(ip: string): boolean {
  const address = ip.trim().toLowerCase();
  if (!address) return true;
  if (isIpv4Literal(address)) return isPrivateIpv4(address);
  if (looksLikeIpv6(address)) return isPrivateIpv6(address);
  return true;
}

/** Returns true if hostname must not be crawled (SSRF). */
export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (BLOCKED_HOSTS.has(host)) return true;
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (host.endsWith(".nip.io") || host.endsWith(".sslip.io")) return true;

  if (host.startsWith("[") && host.endsWith("]")) {
    return isBlockedHostname(host.slice(1, -1));
  }

  if (isIpv4Literal(host)) return isPrivateIpv4(host);
  if (looksLikeIpv6(host)) return isPrivateIpv6(host);

  return false;
}

export function assertPublicHostname(hostname: string): void {
  if (isBlockedHostname(hostname)) {
    throw new Error("Ce domaine n'est pas autorisé pour un audit.");
  }
}
