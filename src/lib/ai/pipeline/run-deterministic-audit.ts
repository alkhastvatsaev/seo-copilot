import type { AuditResult } from "@/lib/audits/issue-schema";
import {
  analyzePageExtract,
  analyzeSecondaryPage,
  analyzeSiteExtracts,
} from "@/lib/ai/pipeline/analyze";
import { extractPageSignals } from "@/lib/ai/pipeline/extract";
import { prioritizeIssues, topIssueIds } from "@/lib/ai/pipeline/prioritize";
import { scoreIssues } from "@/lib/ai/pipeline/score";
import type { CrawledPage } from "@/lib/crawl/site-crawl";
import {
  analyzePageSpeed,
  type PageSpeedSnapshot,
} from "@/lib/performance/pagespeed";

export function runSiteAudit(input: {
  pages: CrawledPage[];
  pageSpeed?: PageSpeedSnapshot | null;
}): AuditResult {
  const [home, ...rest] = input.pages;
  const pageIssues = [
    ...(home ? analyzePageExtract(home.extract) : []),
    ...rest.flatMap((page) => analyzeSecondaryPage(page.extract)),
  ];
  const siteIssues = analyzeSiteExtracts(input.pages.map((p) => p.extract));
  const cwvIssues = input.pageSpeed
    ? analyzePageSpeed(input.pageSpeed)
    : [];

  const issues = prioritizeIssues([
    ...pageIssues,
    ...siteIssues,
    ...cwvIssues,
  ]);

  return {
    score: scoreIssues(issues),
    issues,
    topIssueIds: topIssueIds(issues),
  };
}

/** Backward-compatible single-page entry (tests / fixtures). */
export function runDeterministicAudit(input: {
  html: string;
  url: string;
  finalUrl: string;
  status: number;
}): AuditResult {
  const extract = extractPageSignals(input);
  return runSiteAudit({
    pages: [{ extract, html: input.html }],
    pageSpeed: null,
  });
}
