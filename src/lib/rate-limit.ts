export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

type Bucket = {
  hits: number[];
};

const buckets = new Map<string, Bucket>();

/** Sliding-window rate limiter (in-memory). Suitable for single-instance MVP. */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
  now = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key) ?? { hits: [] };
  const windowStart = now - options.windowMs;
  bucket.hits = bucket.hits.filter((timestamp) => timestamp > windowStart);

  if (bucket.hits.length >= options.limit) {
    const oldest = bucket.hits[0] ?? now;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + options.windowMs - now) / 1000),
    );
    buckets.set(key, bucket);
    return { ok: false, retryAfterSec };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: options.limit - bucket.hits.length };
}

/** Test helper — clears all buckets. */
export function resetRateLimitStore() {
  buckets.clear();
}

/**
 * Client IP for rate limiting.
 * Only trusts proxy headers when TRUST_PROXY=1 (set behind a trusted reverse proxy).
 */
export function getClientIp(request: Request): string {
  if (process.env.TRUST_PROXY === "1") {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }
  return "unknown";
}
