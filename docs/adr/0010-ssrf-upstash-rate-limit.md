# ADR 0010 — Hardened SSRF + optional Upstash rate limit

Date: 2026-07-30

## Context

Full audit (30 jul 2026) flagged P0 risks: DNS-rebinding SSRF (hostname-only
checks + `redirect: follow`) and in-memory rate limits that do not hold across
Vercel instances.

## Decision

1. **SSRF** — Before every crawl hop: Zod/hostname denylist, then DNS
   `lookup({ all: true })` and reject private/metadata IPs. Fetch uses
   `redirect: "manual"` with per-hop re-validation (`safe-fetch.ts`).
2. **Rate limit** — Prefer Upstash Redis (`@upstash/ratelimit`) when
   `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set; otherwise keep
   in-memory sliding window (dev / single instance).
3. **Env** — `TRUST_PROXY`, `AUDIT_STORE`, and Upstash vars validated in
   `env.ts`.

## Alternatives considered

- Block only after final URL (status quo) — rejected: internal hop already hit.
- Require Upstash always — rejected: local/dev friction; optional is enough for MVP.

## Consequences

- Dependency: `@upstash/ratelimit` + `@upstash/redis` (multi-instance RL without
  self-hosted Redis).
- Crawl unit tests inject `resolveAddresses` to avoid real DNS.
- Prod: set Upstash (or Vercel Marketplace `KV_REST_API_*`) + `TRUST_PROXY=1`
  for correct IP keys. Code accepts either credential pair.
