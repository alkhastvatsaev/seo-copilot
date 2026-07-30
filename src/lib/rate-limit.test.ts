import { describe, expect, it, beforeEach } from "vitest";
import {
  checkRateLimit,
  checkRateLimitMemory,
  getClientIp,
  resetRateLimitStore,
} from "@/lib/rate-limit";

describe("checkRateLimitMemory", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows requests under the limit", () => {
    const first = checkRateLimitMemory("k", { limit: 2, windowMs: 60_000 }, 1_000);
    const second = checkRateLimitMemory(
      "k",
      { limit: 2, windowMs: 60_000 },
      1_100,
    );
    expect(first).toEqual({ ok: true, remaining: 1 });
    expect(second).toEqual({ ok: true, remaining: 0 });
  });

  it("blocks when the limit is exceeded", () => {
    checkRateLimitMemory("k", { limit: 1, windowMs: 60_000 }, 1_000);
    const blocked = checkRateLimitMemory(
      "k",
      { limit: 1, windowMs: 60_000 },
      1_500,
    );
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("resets after the window", () => {
    checkRateLimitMemory("k", { limit: 1, windowMs: 1_000 }, 1_000);
    const after = checkRateLimitMemory("k", { limit: 1, windowMs: 1_000 }, 2_100);
    expect(after.ok).toBe(true);
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("falls back to memory when Upstash is unset", async () => {
    const first = await checkRateLimit("async-k", {
      limit: 1,
      windowMs: 60_000,
    });
    const second = await checkRateLimit("async-k", {
      limit: 1,
      windowMs: 60_000,
    });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
  });
});

describe("getClientIp", () => {
  it("ignores forwarded headers unless TRUST_PROXY=1", () => {
    const previous = process.env.TRUST_PROXY;
    delete process.env.TRUST_PROXY;
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("unknown");
    process.env.TRUST_PROXY = previous;
  });

  it("reads x-forwarded-for when TRUST_PROXY=1", () => {
    const previous = process.env.TRUST_PROXY;
    process.env.TRUST_PROXY = "1";
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
    process.env.TRUST_PROXY = previous;
  });
});
