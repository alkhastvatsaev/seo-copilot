# ADR 0011 — Real on-page analysis: multipage + CWV lab

Date: 2026-07-30

## Context

Users saw near-random high scores (e.g. heynota 100, google 90) because the
engine was a shallow homepage HTML checklist with artificial score floors.

## Decision

1. Expand deterministic extract/analyze: lang, robots/noindex, Open Graph,
   Twitter card, JSON-LD, thin/SPA shell, heading structure, internal links.
2. Crawl up to 5 pages (sitemap.xml then internal links) with SSRF-safe fetch.
3. Soft-fail PageSpeed Insights (mobile lab) for LCP/CLS/INP/performance.
4. Remove high score floors; dedupe penalties by issue family across pages.
5. UI labels the score as technical on-page + lab perf — not global authority.

## Alternatives considered

- AI-scored SEO — rejected (non-deterministic, costly; scores stay code).
- Full Chrome render for every page — deferred (latency/cost); SPA soft rules first.

## Consequences

- Audits take longer (multipage + optional PSI).
- Optional `PAGESPEED_API_KEY` for quota; without key, PSI may soft-skip.
- Demo/copy updated for honesty.
