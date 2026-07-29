import type { Metadata } from "next";
import Link from "next/link";
import { DomainAuditForm } from "@/components/domain-audit-form";
import { HeroProductMock } from "@/components/hero-product-mock";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "SEO Copilot — Faites trouver votre entreprise sur Google",
  description:
    "Entrez votre site. Score et corrections pour la page d’accueil. Gratuit, sans compte.",
};

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <section className="relative isolate flex min-h-svh flex-1 flex-col overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,#243524_0%,transparent_55%),radial-gradient(ellipse_at_80%_10%,#2a3a12_0%,transparent_40%),linear-gradient(160deg,#0c140c_0%,#121a10_50%,#0a100a_100%)]" />
        <div className="hero-grid absolute inset-0" />
        <div className="noise-overlay pointer-events-none absolute inset-0" />
        <div className="animate-pulse-soft pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[var(--accent)]/10 blur-3xl" />

        <SiteHeader tone="dark" />

        {/* Content first in DOM — mock is decorative backdrop after CTA path */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-16 pt-6 sm:px-6 lg:max-w-[58%] lg:pr-0 xl:max-w-[52%]">
          <p className="animate-rise font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
            SEO Copilot
          </p>
          <h1 className="animate-rise-delay-1 mt-6 max-w-xl text-2xl font-medium leading-snug text-white/90 sm:text-3xl">
            Faites trouver votre entreprise sur Google
          </h1>
          <p className="animate-rise-delay-1 mt-4 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
            Entrez votre site. Recevez un score clair et des corrections pour
            votre page d’accueil.
          </p>
          <div className="animate-rise-delay-2 mt-10 max-w-xl">
            <DomainAuditForm variant="hero" />
          </div>
        </div>

        <HeroProductMock className="animate-rise-delay-2 pointer-events-none absolute inset-0 z-0" />

        <footer className="relative z-10 border-t border-white/10 py-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 text-sm text-white/45 sm:px-6">
            <p>Gratuit · Page d’accueil · Sans inscription</p>
            <Link
              href="/audits/demo"
              className="text-white/35 underline-offset-2 hover:text-white/70 hover:underline"
            >
              Voir un exemple
            </Link>
          </div>
        </footer>
      </section>
    </div>
  );
}
