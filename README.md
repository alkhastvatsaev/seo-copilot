# SEO Copilot

SaaS d’audit SEO actionnable (technique, contenu, CWV, UX/CRO, Google Business) avec corrections assistées par IA.

## Prérequis

- Node 22+
- pnpm 9+
- Postgres local (ou URL distante)

## Configuration

```bash
cp .env.example .env.local
```

## Commandes

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de dev (Turbopack) |
| `pnpm check` | Typecheck + lint + tests unitaires |
| `pnpm build` | Build production |
| `pnpm test:e2e` | Playwright (landing) |
| `pnpm db:generate` | Génère les migrations Drizzle |
| `pnpm db:migrate` | Applique les migrations |

## Première migration

```bash
pnpm db:generate
pnpm db:migrate
```

## Inngest (dev)

Lancer le serveur Inngest en parallèle de `pnpm dev` (requis pour terminer un audit) :

```bash
npx inngest-cli@latest dev
```

Parcours : landing → `POST /api/audits` → `/audits/[id]` (score + `IssueCard`).
