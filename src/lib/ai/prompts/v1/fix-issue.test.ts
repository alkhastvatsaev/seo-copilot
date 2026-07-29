import { describe, expect, it } from "vitest";
import {
  buildFixIssuePrompt,
  FIX_PROMPT_VERSION,
} from "@/lib/ai/prompts/v1/fix-issue";
import type { AuditIssue } from "@/lib/audits/issue-schema";

const issue: AuditIssue = {
  id: "missing_title",
  code: "missing_title",
  title: "Titre de page à ajouter",
  why: "Le title est ce que vos clients voient en premier.",
  impact: "Moins de contrôle sur le message dans Google.",
  priority: "critical",
  effort: "low",
  difficulty: "low",
  howToFix: "Ajoutez un title.",
  beforeExample: "(aucune)",
  afterExample: "<title>Exemple</title>",
};

describe("buildFixIssuePrompt", () => {
  it("includes domain, issue fields and prompt version", () => {
    const prompt = buildFixIssuePrompt({ domain: "exemple.com", issue });
    expect(prompt).toContain("exemple.com");
    expect(prompt).toContain("missing_title");
    expect(prompt).toContain("Titre de page à ajouter");
    expect(prompt).toContain(`Prompt version: ${FIX_PROMPT_VERSION}`);
  });
});
