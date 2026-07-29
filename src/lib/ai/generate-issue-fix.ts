import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { generateObjectWithRetry } from "@/lib/ai/generate-object-with-retry";
import { buildFixIssuePrompt } from "@/lib/ai/prompts/v1/fix-issue";
import {
  aiFixSuggestionSchema,
  type AiFixSuggestion,
} from "@/lib/ai/schemas/fix-suggestion";
import type { AuditIssue } from "@/lib/audits/issue-schema";
import { env } from "@/lib/env";

export class AiFixUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiFixUnavailableError";
  }
}

export async function generateIssueFix(input: {
  domain: string;
  issue: AuditIssue;
}): Promise<AiFixSuggestion> {
  if (!env.OPENAI_API_KEY) {
    throw new AiFixUnavailableError(
      "La correction IA n'est pas configurée (OPENAI_API_KEY manquant).",
    );
  }

  const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
  const prompt = buildFixIssuePrompt(input);

  return generateObjectWithRetry(
    async ({ schema, prompt: nextPrompt }) =>
      generateObject({
        model: openai("gpt-4o-mini"),
        schema,
        prompt: nextPrompt,
      }),
    aiFixSuggestionSchema,
    prompt,
  );
}
