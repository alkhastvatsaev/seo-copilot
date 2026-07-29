import type { Metadata } from "next";
import { AuditResults } from "@/components/audit-results";
import { SiteHeader } from "@/components/site-header";
import { getDemoAudit } from "@/lib/audits/demo-audit";

export const metadata: Metadata = {
  title: "Exemple d'audit",
  description: "Démonstration du rapport SEO Copilot avec IssueCards.",
};

export default function DemoAuditPage() {
  const audit = getDemoAudit();

  return (
    <div className="flex flex-1 flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="mb-8 rounded-lg border border-[color:var(--ring)]/40 bg-[color:var(--accent)]/20 px-4 py-3 text-sm">
          Exemple statique — aucun crawl réel. Lancez un audit depuis l&apos;accueil
          pour analyser votre domaine.
        </p>
        <AuditResults initialAudit={audit} enableAiFix={false} />
      </main>
    </div>
  );
}
