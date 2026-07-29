import { getAuditRecord } from "@/lib/audits/repository";
import type { AuditView } from "@/lib/audits/types";

export type { AuditView };

/** Public audit view — never includes accessTokenHash. */
export function toPublicAuditView(audit: AuditView): AuditView {
  return {
    id: audit.id,
    domain: audit.domain,
    status: audit.status,
    score: audit.score,
    issues: audit.issues,
    errorMessage: audit.errorMessage,
    createdAt: audit.createdAt,
    completedAt: audit.completedAt,
  };
}

export async function getAuditById(id: string): Promise<AuditView | null> {
  const audit = await getAuditRecord(id);
  if (!audit) return null;
  return toPublicAuditView(audit);
}
