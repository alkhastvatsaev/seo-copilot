import { describe, expect, it } from "vitest";
import { runDeterministicAudit } from "@/lib/ai/pipeline/run-deterministic-audit";
import { googleLikeHomepageHtml } from "@/lib/ai/pipeline/fixtures/google-like";
import {
  brokenHomepageHtml,
  healthyHomepageHtml,
} from "@/lib/ai/pipeline/fixtures/homepages";
import { scoreIssues } from "@/lib/ai/pipeline/score";
import { prioritizeIssues } from "@/lib/ai/pipeline/prioritize";
import type { AuditIssue } from "@/lib/audits/issue-schema";

describe("runDeterministicAudit", () => {
  it("flags missing SEO basics on a broken page", () => {
    const result = runDeterministicAudit({
      html: brokenHomepageHtml,
      url: "https://exemple.com/",
      finalUrl: "https://exemple.com/",
      status: 200,
    });

    const codes = result.issues.map((issue) => issue.code);
    expect(codes).toContain("title_too_short");
    expect(codes).toContain("missing_meta_description");
    expect(codes).toContain("multiple_h1");
    expect(codes).toContain("missing_viewport");
    expect(codes).toContain("images_missing_alt");
    expect(result.score).toBeLessThan(100);
    expect(result.topIssueIds).toHaveLength(3);
  });

  it("scores a healthy page highly", () => {
    const result = runDeterministicAudit({
      html: healthyHomepageHtml,
      url: "https://exemple.com/",
      finalUrl: "https://exemple.com/",
      status: 200,
    });

    expect(result.issues).toHaveLength(0);
    expect(result.score).toBe(100);
  });

  it("does not crush utility homepages like a search box", () => {
    const result = runDeterministicAudit({
      html: googleLikeHomepageHtml,
      url: "https://google.com/",
      finalUrl: "https://www.google.com/",
      status: 200,
    });

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.issues.every((i) => i.priority !== "critical")).toBe(true);
  });

  it("penalizes http final URL", () => {
    const result = runDeterministicAudit({
      html: healthyHomepageHtml,
      url: "https://exemple.com/",
      finalUrl: "http://exemple.com/",
      status: 200,
    });

    expect(result.issues.some((issue) => issue.code === "no_https")).toBe(true);
  });
});

describe("scoreIssues + prioritizeIssues", () => {
  const sample: AuditIssue[] = [
    {
      id: "a",
      code: "a",
      title: "A",
      why: "w",
      impact: "i",
      priority: "low",
      effort: "high",
      difficulty: "low",
      howToFix: "f",
    },
    {
      id: "b",
      code: "b",
      title: "B",
      why: "w",
      impact: "i",
      priority: "critical",
      effort: "low",
      difficulty: "low",
      howToFix: "f",
    },
  ];

  it("orders critical before low", () => {
    expect(prioritizeIssues(sample)[0]?.id).toBe("b");
  });

  it("applies deterministic penalties with cap", () => {
    expect(scoreIssues(sample)).toBe(100 - 18 - 2);
  });
});
