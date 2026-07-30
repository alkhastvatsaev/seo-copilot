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
import { frameScoreMessage, SCORE_SCOPE_LABEL } from "@/lib/copy/score-framing";

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
    }, 2000);
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
        { method: "POST", credentials: "same-origin" },
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
        <p className="text-sm text-muted-foreground">{initialAudit.domain}</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          On n&apos;a pas pu analyser ce site
        </h1>
        <p className="max-w-xl text-muted-foreground">
          {initialAudit.errorMessage ??
            "Réessayez dans un instant, ou vérifiez que l’adresse est accessible."}
        </p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-5" aria-busy="true" aria-live="polite">
        <p className="text-sm text-muted-foreground">{initialAudit.domain}</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          Analyse en cours…
        </h1>
        <div className="h-2 max-w-sm overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[color:var(--ring)]" />
        </div>
        <p className="text-muted-foreground">Quelques secondes.</p>
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
    <div className="space-y-10">
      <section className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{initialAudit.domain}</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
            Votre score
          </h1>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {SCORE_SCOPE_LABEL}
          </p>
          <p className="max-w-xl text-muted-foreground">
            {typeof initialAudit.score === "number"
              ? frameScoreMessage(initialAudit.score)
              : initialAudit.issues.length === 0
                ? "Les contrôles techniques de l’échantillon sont verts — ce n’est pas une note d’autorité globale."
                : "Voici les leviers techniques les plus utiles pour progresser."}
          </p>
        </div>
        {typeof initialAudit.score === "number" && (
          <ScoreRing score={initialAudit.score} />
        )}
      </section>

      {priorityIssues.length > 0 && (
        <section aria-labelledby="priority-actions" className="space-y-4">
          <h2
            id="priority-actions"
            className="font-[family-name:var(--font-display)] text-2xl font-semibold"
          >
            Commencez par ici
          </h2>
          <div className="space-y-4">{priorityIssues.map(renderIssue)}</div>
        </section>
      )}

      {otherIssues.length > 0 && (
        <details className="group space-y-4">
          <summary className="cursor-pointer font-[family-name:var(--font-display)] text-xl font-semibold list-none [&::-webkit-details-marker]:hidden">
            <span className="underline-offset-4 group-open:underline">
              Ensuite ({otherIssues.length})
            </span>
          </summary>
          <div className="space-y-4 pt-2">{otherIssues.map(renderIssue)}</div>
        </details>
      )}

      {initialAudit.issues.length === 0 && (
        <p className="text-muted-foreground">
          Aucun écart sur les contrôles techniques de cet échantillon (pages
          crawlées + perf lab si disponible). Ce score ne mesure pas backlinks,
          E-E-A-T ni la concurrence.
        </p>
      )}
    </div>
  );
}
