import { z } from "zod";

export const auditStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
]);

export type AuditStatus = z.infer<typeof auditStatusSchema>;

export const issuePrioritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
]);

export type IssuePriority = z.infer<typeof issuePrioritySchema>;

export const issueEffortSchema = z.enum(["low", "medium", "high"]);

export type IssueEffort = z.infer<typeof issueEffortSchema>;

export const auditIssueSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  why: z.string(),
  impact: z.string(),
  priority: issuePrioritySchema,
  effort: issueEffortSchema,
  difficulty: issueEffortSchema,
  howToFix: z.string(),
  beforeExample: z.string().optional(),
  afterExample: z.string().optional(),
});

export type AuditIssue = z.infer<typeof auditIssueSchema>;

export const auditResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  issues: z.array(auditIssueSchema),
  topIssueIds: z.array(z.string()).max(3),
});

export type AuditResult = z.infer<typeof auditResultSchema>;
