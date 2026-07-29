import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createAuditAccessToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashAuditAccessToken(token) };
}

export function hashAuditAccessToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function verifyAuditAccessToken(
  token: string | null | undefined,
  hash: string | null | undefined,
): boolean {
  if (!token || !hash) return false;
  const candidate = hashAuditAccessToken(token);
  if (candidate.length !== hash.length) return false;
  try {
    return timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
  } catch {
    return false;
  }
}

export function auditAccessCookieName(auditId: string): string {
  return `seo_aat_${auditId}`;
}

export function parseAuditAccessCookie(
  cookieHeader: string | null,
  auditId: string,
): string | null {
  if (!cookieHeader) return null;
  const name = auditAccessCookieName(auditId);
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export function buildAuditAccessSetCookie(
  auditId: string,
  token: string,
): string {
  const name = auditAccessCookieName(auditId);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`;
}
