import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getUpstashRedisCredentials } from "@/lib/env";

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

const upstashLimiters = new Map<string, Ratelimit>();

function upstashConfigured(): boolean {
  return getUpstashRedisCredentials() !== null;
}

function getUpstashLimiter(options: RateLimitOptions): Ratelimit {
  const windowSec = Math.max(1, Math.ceil(options.windowMs / 1000));
  const cacheKey = `${options.limit}:${windowSec}`;
  const existing = upstashLimiters.get(cacheKey);
  if (existing) return existing;

  const credentials = getUpstashRedisCredentials();
  if (!credentials) {
    throw new Error("Upstash Redis is not configured.");
  }

  const redis = new Redis({
    url: credentials.url,
    token: credentials.token,
  });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(options.limit, `${windowSec} s`),
    prefix: "seo-copilot",
  });
  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

/** Sliding-window rate limiter (in-memory). Used when Upstash is unset. */
export function checkRateLimitMemory(
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

/**
 * Rate limit — Upstash Redis when configured (multi-instance), else memory.
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions,
  now = Date.now(),
): Promise<RateLimitResult> {
  if (upstashConfigured()) {
    const limiter = getUpstashLimiter(options);
    const result = await limiter.limit(key);
    if (!result.success) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000),
      );
      return { ok: false, retryAfterSec };
    }
    return { ok: true, remaining: result.remaining };
  }

  return checkRateLimitMemory(key, options, now);
}

/** Test helper — clears in-memory buckets. */
export function resetRateLimitStore() {
  buckets.clear();
}

/**
 * Client IP for rate limiting.
 * Only trusts proxy headers when TRUST_PROXY=1.
 */
export function getClientIp(request: Request): string {
  // Read process.env so tests can toggle; Zod validates at boot via env.ts.
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
