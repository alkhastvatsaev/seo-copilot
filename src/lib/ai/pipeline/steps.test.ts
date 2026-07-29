import { describe, expect, it } from "vitest";
import { z } from "zod";
import { generateObjectWithRetry } from "@/lib/ai/generate-object-with-retry";
import { isPipelineStep, PIPELINE_STEPS } from "@/lib/ai/pipeline/steps";

describe("pipeline steps", () => {
  it("lists the canonical pipeline order", () => {
    expect(PIPELINE_STEPS).toEqual([
      "extract",
      "analyze",
      "score",
      "recommend",
      "prioritize",
      "generate",
    ]);
  });

  it("narrows step names", () => {
    expect(isPipelineStep("score")).toBe(true);
    expect(isPipelineStep("unknown")).toBe(false);
  });
});

describe("generateObjectWithRetry", () => {
  const schema = z.object({ title: z.string() });

  it("returns object on first success", async () => {
    const generateObject = async () => ({ object: { title: "ok" } });
    const result = await generateObjectWithRetry(
      generateObject,
      schema,
      "prompt",
    );
    expect(result.title).toBe("ok");
  });

  it("retries once after failure", async () => {
    let calls = 0;
    const generateObject = async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error("invalid shape");
      }
      return { object: { title: "retry" } };
    };

    const result = await generateObjectWithRetry(
      generateObject,
      schema,
      "prompt",
    );
    expect(result.title).toBe("retry");
    expect(calls).toBe(2);
  });
});
