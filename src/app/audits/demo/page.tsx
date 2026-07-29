import type { Metadata } from "next";
import Link from "next/link";
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
      <SiteHeader showDemoLink />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="mb-8 text-sm text-muted-foreground">
          Exemple —{" "}
          <Link href="/" className="underline underline-offset-2">
            voyez le score de votre site
          </Link>{" "}
          pour un vrai crawl.
        </p>
        <AuditResults initialAudit={audit} enableAiFix={false} />
      </main>
    </div>
  );
}
