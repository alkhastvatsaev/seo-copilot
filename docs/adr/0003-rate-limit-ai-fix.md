# ADR 0003 — Rate limiting + correction IA par IssueCard

**Date :** 2026-07-29  
**Statut :** accepté

## Contexte

Les endpoints crawl/création d'audit et génération IA sont coûteux. Le différenciateur produit exige un bouton unique « Corriger avec l'IA » sur `<IssueCard />`.

## Décision

- Rate limit **in-memory** (fenêtre glissante) sur `POST /api/audits` (5/min/IP) et `POST .../fix` (10/min/IP).
- Correction IA via Vercel AI SDK `generateObject` + schéma Zod, prompt versionné `lib/ai/prompts/v1/fix-issue.ts`, retry unique via `generateObjectWithRetry`.
- Affichage du résultat dans le même `<IssueCard />` (summary, steps, avant/après) — pas de variante ad hoc.

## Alternatives envisagées

- **Upstash Redis / @upstash/ratelimit** : écarté pour le MVP (infra + secrets) — à adopter dès multi-instances.
- **Correction inline synchrone dans la page RSC** : écarté (timeout, pas de rate limit HTTP clair).

## Conséquences

- `@ai-sdk/openai` ajouté ; stack AI SDK alignée sur `ai@7` (compat modèle V4).
- `OPENAI_API_KEY` requis pour le bouton IA (sinon 503).
- Le rate limit ne se partage pas entre replicas.
