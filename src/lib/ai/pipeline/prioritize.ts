import type { AuditIssue, IssuePriority } from "@/lib/audits/issue-schema";

const PRIORITY_RANK: Record<IssuePriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const EFFORT_RANK = { low: 0, medium: 1, high: 2 } as const;

export function prioritizeIssues(issues: AuditIssue[]): AuditIssue[] {
  return [...issues].sort((a, b) => {
    const byPriority =
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (byPriority !== 0) return byPriority;
    return EFFORT_RANK[a.effort] - EFFORT_RANK[b.effort];
  });
}

export function topIssueIds(issues: AuditIssue[], limit = 3): string[] {
  return prioritizeIssues(issues)
    .slice(0, limit)
    .map((issue) => issue.id);
}
