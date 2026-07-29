# ADR 0005 — Store mémoire audits en développement

**Date :** 2026-07-29  
**Statut :** accepté

## Contexte

Sur cette machine : pas de Docker, pas de Postgres. Les audits échouaient à l'insert DB, empêchant tout essai réel hors `/audits/demo`.

## Décision

- Repository audits (`create` / `get` / `update`) avec fallback **in-memory** si Postgres est injoignable en `development`, ou si `AUDIT_STORE=memory`.
- Exécution locale via `after()` + `executeAuditRun` en développement (Inngest optionnel).
- Production : Postgres obligatoire, pas de fallback mémoire.

## Alternatives envisagées

- **Installer Postgres via Homebrew maintenant** : souhaitable ensuite, mais bloque l'essai immédiat.
- **SQLite** : écarté (stack prescrite Postgres).

## Conséquences

- Les audits mémoire sont persistés dans `.data/dev-audits.json` (partagé entre API et pages Next en dev).
- Redémarrage serveur : les audits dev restent sur disque jusqu'à suppression du fichier.
