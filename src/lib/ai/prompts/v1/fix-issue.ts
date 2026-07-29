import type { AuditIssue } from "@/lib/audits/issue-schema";

export const FIX_PROMPT_VERSION = "v1" as const;

export function buildFixIssuePrompt(input: {
  domain: string;
  issue: AuditIssue;
}): string {
  return [
    `Tu es un expert SEO technique. Propose une correction actionnable pour le site ${input.domain}.`,
    "Réponds en français. Sois précis, concret, sans blabla marketing.",
    "Le champ snippet doit contenir du HTML/markup ou une config directement utilisable.",
    "",
    `Code problème: ${input.issue.code}`,
    `Titre: ${input.issue.title}`,
    `Pourquoi: ${input.issue.why}`,
    `Impact: ${input.issue.impact}`,
    `Piste déjà connue: ${input.issue.howToFix}`,
    input.issue.beforeExample
      ? `Exemple avant: ${input.issue.beforeExample}`
      : null,
    input.issue.afterExample
      ? `Exemple après (indicatif): ${input.issue.afterExample}`
      : null,
    "",
    `Prompt version: ${FIX_PROMPT_VERSION}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}
