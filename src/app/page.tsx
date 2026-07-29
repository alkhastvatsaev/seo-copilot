import type { Metadata } from "next";
import Link from "next/link";
import { DomainAuditForm } from "@/components/domain-audit-form";
import { HeroProductMock } from "@/components/hero-product-mock";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "SEO Copilot — Audit technique homepage",
  description:
    "Crawl de la page d'accueil, checklist SEO technique déterministe, priorisation, et corrections assistées par IA.",
};

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative isolate min-h-svh overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,#243524_0%,transparent_55%),radial-gradient(ellipse_at_80%_10%,#2a3a12_0%,transparent_40%),linear-gradient(160deg,#0c140c_0%,#121a10_50%,#0a100a_100%)]" />
        <div className="hero-grid absolute inset-0" />
        <div className="noise-overlay pointer-events-none absolute inset-0" />
        <div className="animate-pulse-soft pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        <HeroProductMock className="animate-rise-delay-2 pointer-events-none absolute inset-0" />

        <SiteHeader tone="dark" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] max-w-6xl flex-col justify-center px-4 pb-20 pt-8 sm:px-6 lg:max-w-[58%] lg:pr-0 xl:max-w-[52%]">
          <p className="animate-rise font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
            SEO Copilot
          </p>
          <h1 className="animate-rise-delay-1 mt-6 max-w-xl text-2xl font-medium leading-snug text-white/90 sm:text-3xl">
            Comprenez et corrigez votre SEO en quelques clics
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
            Audit technique de la homepage : chaque problème expliqué, priorisé,
            et corrigeable avec l&apos;IA — pas une note aléatoire.
          </p>
          <div className="animate-rise-delay-3 mt-10 max-w-xl">
            <DomainAuditForm variant="hero" />
          </div>
        </div>
      </section>

      <section className="border-t bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            Du score aux corrections
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Score checklist d&apos;abord, trois actions prioritaires ensuite,
            détail ensuite — pour décider en moins de 10 secondes.
          </p>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Crawl",
                body: "Page d'accueil analysée avec respect de robots.txt, timeout et garde-fous SSRF.",
              },
              {
                step: "02",
                title: "Diagnostic",
                body: "Problèmes techniques détectés, scorés et priorisés de façon déterministe.",
              },
              {
                step: "03",
                title: "Correction IA",
                body: "Un bouton unique sur chaque IssueCard pour générer le correctif prêt à coller.",
              },
            ].map((item) => (
              <li key={item.step} className="space-y-3">
                <p className="font-mono text-sm text-muted-foreground">
                  {item.step}
                </p>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            Inclus aujourd&apos;hui
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            MVP focalisé — on n&apos;affiche que ce qui est réellement audité.
          </p>
          <div className="mt-10 grid gap-10 sm:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Livré
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>HTTPS, title, meta description, H1, viewport, canonical</li>
                <li>Images sans alt, codes HTTP d&apos;erreur</li>
                <li>Score plafonné + contexte pages utilitaires</li>
                <li>Corrections IA (OpenAI) protégées par jeton d&apos;accès</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Prochaines étapes
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Crawl multi-pages et sitemap</li>
                <li>Core Web Vitals (CrUX / Lighthouse)</li>
                <li>Audit contenu, UX/CRO, Google Business</li>
                <li>Comptes liés Postgres et historique d&apos;audits</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>SEO Copilot — audit technique homepage</p>
          <p>
            <Link
              href="/audits/demo"
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              Exemple d&apos;audit
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
