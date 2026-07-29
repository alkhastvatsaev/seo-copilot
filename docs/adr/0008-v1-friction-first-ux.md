# ADR 0008 — V1 friction-first UX (conversion)

**Date :** 2026-07-29  
**Statut :** accepté

## Contexte

Objectif v1 : maximiser les visiteurs qui lancent un audit. Auth Google, sections marketing, roadmap « prochaines étapes » et validation stricte `https://` créaient de la friction sans valeur immédiate.

## Décision

1. Landing = un seul viewport (marque + promesse + champ + CTA). Auth retirée de l’UI.
2. Accepter les URLs collées (`https://…/path`) via normalisation hostname.
3. Rapport : copy courte, « À faire en premier », autres points en `<details>`.
4. IssueCard inchangé fonctionnellement (règles produit) — labels allégés.

## Alternative écartée

Garder login + sections pédagogiques — utile plus tard, coûte des conversions maintenant.
