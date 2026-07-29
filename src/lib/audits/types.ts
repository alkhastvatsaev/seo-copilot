import type { AuditIssue, AuditStatus } from "@/lib/audits/issue-schema";

export type AuditView = {
  id: string;
  domain: string;
  status: AuditStatus;
  score: number | null;
  issues: AuditIssue[];
  errorMessage: string | null;
  /** Server-only; never serialize to client responses. */
  accessTokenHash?: string | null;
  createdAt: string;
  completedAt: string | null;
};
