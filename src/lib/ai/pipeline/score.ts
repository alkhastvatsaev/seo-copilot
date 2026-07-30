import type { AuditIssue, IssuePriority } from "@/lib/audits/issue-schema";

const PENALTY: Record<IssuePriority, number> = {
  critical: 22,
  high: 10,
  medium: 5,
  low: 2,
};

const CRITICAL_CODES = new Set([
  "http_error",
  "no_https",
  "missing_title",
  "meta_noindex",
]);

/**
 * Deterministic technical SEO score for crawled pages — not a global authority score.
 * No artificial high floors: empty issue list can reach 100 only if checks ran clean.
 */
export function scoreIssues(issues: AuditIssue[]): number {
  if (issues.length === 0) return 100;

  const blockingCritical = issues.filter(
    (issue) => issue.priority === "critical" && CRITICAL_CODES.has(issue.code),
  );
  if (blockingCritical.length > 0) {
    const penalty = blockingCritical.reduce(
      (sum, issue) => sum + PENALTY[issue.priority],
      0,
    );
    return Math.max(5, Math.min(45, 100 - penalty));
  }

  // Dedupe by code family so multipage repeats don't destroy the score unfairly.
  const seen = new Set<string>();
  let penalty = 0;
  for (const issue of issues) {
    const family = issue.code;
    if (seen.has(family)) {
      penalty += Math.max(1, Math.floor(PENALTY[issue.priority] / 3));
      continue;
    }
    seen.add(family);
    penalty += PENALTY[issue.priority];
  }

  penalty = Math.min(penalty, 72);
  return Math.max(0, Math.min(100, 100 - penalty));
}
