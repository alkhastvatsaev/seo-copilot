import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type IssuePriority = "critical" | "high" | "medium" | "low";
export type IssueEffort = "low" | "medium" | "high";

export type IssueAiFixResult = {
  summary: string;
  steps: string[];
  snippet: string;
  beforeSnippet?: string | null;
};

export type IssueCardProps = {
  title: string;
  why: string;
  impact: string;
  priority: IssuePriority;
  effort: IssueEffort;
  difficulty: IssueEffort;
  howToFix: string;
  beforeExample?: string;
  afterExample?: string;
  onFixWithAi?: () => void;
  isFixing?: boolean;
  fixError?: string | null;
  aiFixResult?: IssueAiFixResult | null;
  className?: string;
};

const priorityLabel: Record<IssuePriority, string> = {
  critical: "Critique",
  high: "Élevée",
  medium: "Moyenne",
  low: "Faible",
};

const priorityAccent: Record<IssuePriority, string> = {
  critical: "bg-destructive",
  high: "bg-[color:var(--ring)]",
  medium: "bg-foreground/40",
  low: "bg-foreground/20",
};

export function IssueCard({
  title,
  why,
  impact,
  priority,
  effort,
  difficulty,
  howToFix,
  beforeExample,
  afterExample,
  onFixWithAi,
  isFixing = false,
  fixError = null,
  aiFixResult = null,
  className,
}: IssueCardProps) {
  const displayBefore = aiFixResult?.beforeSnippet ?? beforeExample;
  const displayAfter = aiFixResult?.snippet ?? afterExample;

  return (
    <Card className={cn("relative overflow-hidden shadow-none", className)}>
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          priorityAccent[priority],
        )}
      />
      <CardHeader className="pl-7">
        <CardTitle className="font-[family-name:var(--font-display)] text-xl">
          {title}
        </CardTitle>
        <CardDescription>
          Priorité {priorityLabel[priority]} · Effort {effort} · Difficulté{" "}
          {difficulty}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pl-7 text-sm">
        <div>
          <p className="font-medium">Pourquoi c&apos;est un problème</p>
          <p className="mt-1 text-muted-foreground">{why}</p>
        </div>
        <div>
          <p className="font-medium">Impact</p>
          <p className="mt-1 text-muted-foreground">{impact}</p>
        </div>
        <div>
          <p className="font-medium">Comment corriger</p>
          <p className="mt-1 text-muted-foreground">
            {aiFixResult?.summary ?? howToFix}
          </p>
          {aiFixResult && aiFixResult.steps.length > 0 && (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              {aiFixResult.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
        </div>
        {(displayBefore || displayAfter) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {displayBefore && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Avant
                </p>
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                  {displayBefore}
                </pre>
              </div>
            )}
            {displayAfter && (
              <div className="rounded-lg border border-[color:var(--ring)]/30 bg-[color:var(--accent)]/15 p-3">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Après
                </p>
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                  {displayAfter}
                </pre>
              </div>
            )}
          </div>
        )}
        {fixError && (
          <p className="text-sm text-destructive" role="alert">
            {fixError}
          </p>
        )}
        {onFixWithAi && (
          <Button
            type="button"
            onClick={onFixWithAi}
            disabled={isFixing}
            className="w-full bg-primary text-primary-foreground sm:w-auto"
          >
            <Sparkles />
            {isFixing ? "Génération…" : "Corriger avec l'IA"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
