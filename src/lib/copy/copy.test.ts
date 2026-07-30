import { describe, expect, it } from "vitest";
import {
  difficultyLabel,
  effortLabel,
  priorityLabel,
} from "@/lib/copy/issue-labels";
import { frameScoreMessage } from "@/lib/copy/score-framing";

describe("frameScoreMessage", () => {
  it("is honest about high scores", () => {
    expect(frameScoreMessage(92)).toMatch(/technique|échantillon|autorité/i);
  });

  it("encourages mid scores without condemning", () => {
    expect(frameScoreMessage(55)).toMatch(/potentiel/i);
    expect(frameScoreMessage(55)).not.toMatch(/mauvais|échec|nul/i);
  });
});

describe("issue labels", () => {
  it("exposes French effort and priority labels", () => {
    expect(effortLabel("low")).toBe("simple");
    expect(difficultyLabel("high")).toBe("technique");
    expect(priorityLabel("critical")).toBe("À traiter d’abord");
    expect(priorityLabel("low")).toBe("Bonus");
  });
});
