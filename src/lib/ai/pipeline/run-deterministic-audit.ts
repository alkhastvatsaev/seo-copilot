import type { AuditResult } from "@/lib/audits/issue-schema";
import { analyzePageExtract } from "./analyze";
import { extractPageSignals } from "./extract";
import { prioritizeIssues, topIssueIds } from "./prioritize";
import { scoreIssues } from "./score";

export function runDeterministicAudit(input: {
  html: string;
  url: string;
  finalUrl: string;
  status: number;
}): AuditResult {
  const extract = extractPageSignals(input);
  const issues = prioritizeIssues(analyzePageExtract(extract));
  return {
    score: scoreIssues(issues, extract),
    issues,
    topIssueIds: topIssueIds(issues),
  };
}
