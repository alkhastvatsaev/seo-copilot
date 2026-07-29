# ADR 0007 — after() fallback without Inngest in production

**Date :** 2026-07-29  
**Statut :** accepté

## Contexte

Le premier deploy Vercel échouait sur `POST /api/audits` : Inngest exige `INNGEST_EVENT_KEY`, absent, et le handler remontait l'erreur en production.

## Décision

Si `INNGEST_EVENT_KEY` est absent ou si `inngest.send` échoue, planifier `executeAuditRun` via `after()` (supporté sur Vercel). Inngest reste le chemin préféré quand configuré.

## Alternative écartée

Bloquer le deploy jusqu'à configuration Inngest complète — trop strict pour un MVP.

## Conséquences

Audits homepage fonctionnent sans Inngest ; retries / observabilité Inngest restent optionnels.
