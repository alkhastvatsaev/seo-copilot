# ADR 0004 — Identité visuelle MVP + démo audit

**Date :** 2026-07-29  
**Statut :** accepté

## Contexte

Le squelette fonctionnel était utilisable mais non crédible produit. Il fallait une UI landing + rapport audit alignée UX (score → 3 actions → détail) et un moyen de prévisualiser sans Postgres/Inngest.

## Décision

- Direction visuelle **encre / lime** (pas purple, pas cream/terracotta) : Syne (display) + DM Sans + JetBrains Mono.
- Landing : hero full-bleed sombre, marque dominante, une headline, une phrase, CTA = formulaire domaine, mock produit en plan arrière.
- `/audits/demo` : audit statique fixture pour prévisualiser `IssueCard` / score.
- Dev : si `inngest.send` échoue, exécution via `after()` + `executeAuditRun` (jamais synchrone dans la réponse HTTP).

## Alternatives envisagées

- **Design system shadcn « default zinc »** : écarté (générique, branding trop faible).
- **Audit 100 % mock en production** : écarté — démo uniquement sur `/audits/demo`.

## Conséquences

- Typographies Google Fonts chargées via `next/font`.
- Fallback `after()` réservé au `NODE_ENV=development`.
