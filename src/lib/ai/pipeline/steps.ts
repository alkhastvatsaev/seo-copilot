export const PIPELINE_STEPS = [
  "extract",
  "analyze",
  "score",
  "recommend",
  "prioritize",
  "generate",
] as const;

export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export function isPipelineStep(value: string): value is PipelineStep {
  return (PIPELINE_STEPS as readonly string[]).includes(value);
}
