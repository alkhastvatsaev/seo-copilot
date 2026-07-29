import { z } from "zod";

export const aiFixSuggestionSchema = z.object({
  summary: z
    .string()
    .min(1)
    .describe("Résumé court de la correction en français"),
  steps: z
    .array(z.string().min(1))
    .min(1)
    .max(6)
    .describe("Étapes concrètes ordonnées"),
  snippet: z
    .string()
    .min(1)
    .describe("Exemple de code ou markup corrigé, prêt à coller"),
  beforeSnippet: z
    .string()
    .optional()
    .describe("Exemple avant correction si pertinent"),
});

export type AiFixSuggestion = z.infer<typeof aiFixSuggestionSchema>;
