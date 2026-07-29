"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IssueCard,
  type IssueAiFixResult,
} from "@/components/issue-card";
import { ScoreRing } from "@/components/score-ring";
import type { AuditView } from "@/lib/audits/get-audit";
import type { AuditIssue } from "@/lib/audits/issue-schema";
import { topIssueIds } from "@/lib/ai/pipeline/prioritize";

type AuditResultsProps = {
  initialAudit: AuditView;
  /** Demo audits skip the live AI fix endpoint. */
  enableAiFix?: boolean;
};

type FixState = {
  loadingIssueId: string | null;
  errors: Record<string, string>;
  results: Record<string, IssueAiFixResult>;
};

export function AuditResults({
  initialAudit,
  enableAiFix = true,
}: AuditResultsProps) {
  const router = useRouter();
  const isPending =
    initialAudit.status === "pending" || initialAudit.status === "running";
  const [fixState, setFixState] = useState<FixState>({
    loadingIssueId: null,
    errors: {},
    results: {},
  });

  useEffect(() => {
    if (!isPending) return;
    const timer = setInterval(() => {
      router.refresh();
    }, 2500);
    return () => clearInterval(timer);
  }, [isPending, router]);

  async function fixIssue(issue: AuditIssue) {
    setFixState((prev) => ({
      ...prev,
      loadingIssueId: issue.id,
      errors: { ...prev.errors, [issue.id]: "" },
    }));

    try {
      const response = await fetch(
        `/api/audits/${initialAudit.id}/issues/${encodeURIComponent(issue.id)}/fix`,
        { method: "POST" },
      );
      const json = (await response.json()) as
        | { data: IssueAiFixResult }
        | { error: { code: string; message: string } };

      if (!response.ok || "error" in json) {
        const message =
          "error" in json
            ? json.error.message
            : "Impossible de générer la correction.";
        setFixState((prev) => ({
          ...prev,
          loadingIssueId: null,
          errors: { ...prev.errors, [issue.id]: message },
        }));
        return;
      }

      setFixState((prev) => ({
        ...prev,
        loadingIssueId: null,
        results: { ...prev.results, [issue.id]: json.data },
      }));
    } catch {
      setFixState((prev) => ({
        ...prev,
        loadingIssueId: null,
        errors: {
          ...prev.errors,
          [issue.id]: "Erreur réseau. Réessayez dans un instant.",
        },
      }));
    }
  }

  if (initialAudit.status === "failed") {
    return (
      <div className="space-y-4" role="alert">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {initialAudit.domain}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          Audit échoué
        </h1>
        <p className="max-w-xl text-muted-foreground">
          {initialAudit.errorMessage ?? "Une erreur est survenue."}
        </p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {initialAudit.domain}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          Analyse en cours…
        </h1>
        <div className="h-2 max-w-md overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[color:var(--ring)]" />
        </div>
        <p className="text-muted-foreground">
          Crawl et détection des problèmes. Cette page se met à jour
          automatiquement.
        </p>
      </div>
    );
  }

  const topIds = new Set(topIssueIds(initialAudit.issues, 3));
  const priorityIssues = initialAudit.issues.filter((issue) =>
    topIds.has(issue.id),
  );
  const otherIssues = initialAudit.issues.filter(
    (issue) => !topIds.has(issue.id),
  );

  function renderIssue(issue: AuditIssue) {
    return (
      <IssueCard
        key={issue.id}
        title={issue.title}
        why={issue.why}
        impact={issue.impact}
        priority={issue.priority}
        effort={issue.effort}
        difficulty={issue.difficulty}
        howToFix={issue.howToFix}
        beforeExample={issue.beforeExample}
        afterExample={issue.afterExample}
        onFixWithAi={
          enableAiFix
            ? () => {
                void fixIssue(issue);
              }
            : undefined
        }
        isFixing={fixState.loadingIssueId === issue.id}
        fixError={fixState.errors[issue.id] || null}
        aiFixResult={fixState.results[issue.id] ?? null}
      />
    );
  }

  return (
    <div className="space-y-12">
      <section className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {initialAudit.domain}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
            Votre score SEO
          </h1>
        <p className="max-w-xl text-muted-foreground">
          {initialAudit.issues.length === 0
            ? "Aucun problème technique majeur détecté sur la page d'accueil."
            : `${initialAudit.issues.length} problème(s) détecté(s) — commencez par les 3 actions ci-dessous.`}
        </p>
        <p className="text-sm text-muted-foreground">
          Score checklist technique (homepage crawlée) — pas un classement SEO
          global du site.
        </p>
        </div>
        {typeof initialAudit.score === "number" && (
          <ScoreRing score={initialAudit.score} />
        )}
      </section>

      {priorityIssues.length > 0 && (
        <section aria-labelledby="priority-actions" className="space-y-5">
          <h2
            id="priority-actions"
            className="font-[family-name:var(--font-display)] text-2xl font-semibold"
          >
            3 actions prioritaires
          </h2>
          <div className="space-y-4">{priorityIssues.map(renderIssue)}</div>
        </section>
      )}

      {otherIssues.length > 0 && (
        <section aria-labelledby="all-issues" className="space-y-5">
          <h2
            id="all-issues"
            className="font-[family-name:var(--font-display)] text-2xl font-semibold"
          >
            Détail des autres problèmes
          </h2>
          <div className="space-y-4">{otherIssues.map(renderIssue)}</div>
        </section>
      )}

      {initialAudit.issues.length === 0 && (
        <p className="rounded-xl border bg-card p-6 text-muted-foreground">
          Rien à corriger sur les contrôles techniques de base de la homepage.
          Les modules contenu, Core Web Vitals et UX/CRO arriveront ensuite.
        </p>
      )}
    </div>
  );
}
