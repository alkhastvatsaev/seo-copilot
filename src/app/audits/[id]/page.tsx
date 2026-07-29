import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AuditResults } from "@/components/audit-results";
import { SiteHeader } from "@/components/site-header";
import { getAuditById } from "@/lib/audits/get-audit";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return { title: "Audit" };
  }
  const audit = await getAuditById(id);
  if (!audit) return { title: "Audit introuvable" };
  return { title: `Audit ${audit.domain}` };
}

export default async function AuditPage({ params }: PageProps) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    notFound();
  }

  const audit = await getAuditById(id);
  if (!audit) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <SiteHeader showDemoLink />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <AuditResults initialAudit={audit} />
        <p className="mt-12 text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-2">
            Analyser un autre site
          </Link>
        </p>
      </main>
    </div>
  );
}
