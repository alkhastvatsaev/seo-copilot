# ADR 0001 — Bootstrap stack SEO Copilot

**Date :** 2026-07-29  
**Statut :** accepté

## Contexte

Mise en place initiale du monolithe Next.js pour SEO Copilot, avec les contraintes produit (audits longs, IA structurée, UX IssueCard) et la stack imposée.

## Décision

- **App Router** Next.js, Server Components par défaut, jobs via **Inngest** (`audit/run` initial).
- **Postgres + Drizzle** pour utilisateurs Auth.js et table `audit` minimale.
- **Validation Zod** sur env serveur, formulaire domaine et futures frontières API/IA.
- **Vercel AI SDK** préparé via `generateObjectWithRetry` et prompts versionnés dans `lib/ai/prompts/`.
- **Qualité** : `pnpm check` = typecheck + eslint + vitest ; Playwright pour la landing.
- **Observabilité** : pino + capture Sentry serveur lazy (`lib/sentry/server`) si `SENTRY_DSN` (intégration Next `@sentry/nextjs` complète reportée — conflit build Turbopack / prerender).

## Alternatives envisagées

- **Crawler / audit synchrone dans une route API** : écarté (timeouts, pas de retries) — Inngest retenu.
- **Prisma** : écarté (stack prescrite Drizzle + migrations drizzle-kit).

## Conséquences

- Postgres requis pour créer un audit via `/api/audits` (migration à appliquer).
- Auth.js configuré sans provider OAuth pour l’instant (session DB + adapter Drizzle).
- e2e lance `pnpm dev` ; CI devra fournir Postgres ou isoler les tests API.
