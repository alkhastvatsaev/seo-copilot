# ADR 0002 — Crawl homepage + audit déterministe

**Date :** 2026-07-29  
**Statut :** accepté

## Contexte

Après le bootstrap, il faut un premier parcours bout-en-bout : domaine → job async → résultats actionnables (`IssueCard`).

## Décision

- Crawl **homepage uniquement** (limite 1 page), respect `robots.txt`, UA `SEOCopilotBot/0.1`, timeout 10s, plafond HTML 2 Mo.
- Pipeline déterministe `extract → analyze → score → prioritize` sans appel IA pour les règles techniques de base.
- Résultats persistés sur `audit` (`score`, `issues` jsonb, `status`, `errorMessage`, `completedAt`).
- UI `/audits/[id]` : score global, 3 actions prioritaires, détail ensuite ; polling via `router.refresh()`.

## Alternatives envisagées

- **Crawl multi-pages immédiat** : écarté (complexité file d'attente / budget) — reporté.
- **Analyse 100 % IA dès le V1** : écarté (coût, non-déterminisme des scores) — l'IA viendra sur recommend/generate.

## Conséquences

- `robots-parser` + `node-html-parser` ajoutés (parsing mature, pas de regex maison).
- Sans Inngest Dev Server, les audits restent `pending`/`running` non terminés.
- Migration `0001` requise avant usage.
