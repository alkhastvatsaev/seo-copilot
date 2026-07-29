import type { AuditIssue, IssuePriority } from "@/lib/audits/issue-schema";
import type { PageExtract } from "./extract";

const PENALTY: Record<IssuePriority, number> = {
  critical: 18,
  high: 7,
  medium: 4,
  low: 2,
};

const CRITICAL_CODES = new Set(["http_error", "no_https", "missing_title"]);

function passesTechnicalFoundation(extract: PageExtract, issues: AuditIssue[]) {
  const hasBlockingCritical = issues.some(
    (issue) => issue.priority === "critical" && CRITICAL_CODES.has(issue.code),
  );
  if (hasBlockingCritical) return false;

  const viewportOk =
    extract.hasViewport ||
    extract.isUtilityHomepage ||
    issues.every((issue) => issue.code !== "missing_viewport");

  return (
    extract.isHttps &&
    extract.status >= 200 &&
    extract.status < 400 &&
    Boolean(extract.title) &&
    viewportOk
  );
}

/**
 * Deterministic checklist score for a homepage crawl — not a global SEO authority score.
 * Penalties are capped so several "nice to have" issues cannot collapse credible sites to ~40.
 */
export function scoreIssues(
  issues: AuditIssue[],
  extract?: PageExtract,
): number {
  if (issues.length === 0) return 100;

  const blockingCritical = issues.filter(
    (issue) => issue.priority === "critical" && CRITICAL_CODES.has(issue.code),
  );
  if (blockingCritical.length > 0) {
    const penalty = blockingCritical.reduce(
      (sum, issue) => sum + PENALTY[issue.priority],
      0,
    );
    return Math.max(0, Math.min(55, 100 - penalty));
  }

  let penalty = issues.reduce(
    (sum, issue) => sum + PENALTY[issue.priority],
    0,
  );
  penalty = Math.min(penalty, 28);

  let score = 100 - penalty;

  if (extract && passesTechnicalFoundation(extract, issues)) {
    score = Math.max(score, 78);
    const noHigh = !issues.some((issue) => issue.priority === "high");
    if (noHigh) {
      score = Math.max(score, 88);
    }
    const onlyLowMedium = issues.every(
      (issue) => issue.priority === "low" || issue.priority === "medium",
    );
    if (onlyLowMedium) {
      score = Math.max(score, 85);
    }
  }

  return Math.max(0, Math.min(100, score));
}
