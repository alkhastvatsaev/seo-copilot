# ADR 0006 — MVP shippable (SSRF, access token, auth JWT)

**Date :** 2026-07-29  
**Statut :** accepté

## Contexte

L'audit produit montrait un MVP technique utilisable mais non shippable : SSRF ouvert, APIs IA anonymes, copy marketing en avance sur le produit, Auth.js sans providers.

## Décision

1. **SSRF** — refus des hôtes privés / localhost / nip.io à la validation domaine + re-contrôle de l'URL finale après redirect.
2. **Jeton d'accès audit** — cookie HttpOnly à la création ; obligatoire pour `Corriger avec l'IA` (lecture publique par UUID conservée, modèle lien non listé).
3. **Inngest** — `executeAuditRun` lit le `domain` depuis le store, pas depuis l'event.
4. **Auth Google** — JWT-only (sans adapter Drizzle) si `GOOGLE_CLIENT_*` présents ; fonctionne avec store mémoire.
5. **Copy** — promesse limitée à la checklist technique homepage ; section « prochaines étapes » explicite.

## Alternatives écartées

- **Auth obligatoire pour lire un audit** : frein UX MVP ; UUID + cookie IA suffisent.
- **Adapter Drizzle + sessions DB** : bloque le mode mémoire sans Postgres.
- **CWV / multipage / GMB dans ce lot** : épics séparés, hors définition « site MVP terminé ».

## Conséquences

- Migration `0002_audit_access_token`.
- Rate-limit IP ne lit `X-Forwarded-For` que si `TRUST_PROXY=1`.
