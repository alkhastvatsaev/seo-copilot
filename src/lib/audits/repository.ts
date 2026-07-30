import { eq, sql } from "drizzle-orm";
import postgres from "postgres";
import { getDb } from "@/db";
import { audits } from "@/db/schema";
import type { AuditView } from "@/lib/audits/types";
import {
  auditIssueSchema,
  auditStatusSchema,
  type AuditIssue,
} from "@/lib/audits/issue-schema";
import {
  memoryCreateAudit,
  memoryGetAudit,
  memoryUpdateAudit,
  type AuditRecord,
} from "@/lib/audits/memory-store";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

type DbMode = "unknown" | "ok" | "down";

let dbMode: DbMode = "unknown";

function forceMemoryStore() {
  return env.NODE_ENV === "development" && env.AUDIT_STORE === "memory";
}

export async function isDatabaseAvailable(): Promise<boolean> {
  if (forceMemoryStore()) {
    dbMode = "down";
    return false;
  }
  if (env.NODE_ENV === "production") {
    return true;
  }
  if (dbMode === "ok") return true;
  if (dbMode === "down") return false;

  const probe = postgres(env.DATABASE_URL, {
    max: 1,
    connect_timeout: 2,
  });
  try {
    await probe`select 1`;
    dbMode = "ok";
    return true;
  } catch {
    dbMode = "down";
    logger.warn(
      "Postgres unavailable — using in-memory audit store (development only)",
    );
    return false;
  } finally {
    await probe.end({ timeout: 1 }).catch(() => undefined);
  }
}

function toView(record: AuditRecord): AuditView {
  return {
    id: record.id,
    domain: record.domain,
    status: record.status,
    score: record.score,
    issues: record.issues,
    errorMessage: record.errorMessage,
    accessTokenHash: record.accessTokenHash,
    createdAt: record.createdAt.toISOString(),
    completedAt: record.completedAt?.toISOString() ?? null,
  };
}

function parseIssues(raw: unknown): AuditIssue[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = auditIssueSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function createAuditRecord(
  domain: string,
  accessTokenHash: string,
): Promise<AuditView> {
  if (await isDatabaseAvailable()) {
    const db = getDb();
    const [audit] = await db
      .insert(audits)
      .values({ domain, status: "pending", accessTokenHash })
      .returning();
    if (!audit) {
      throw new Error("Création d'audit impossible.");
    }
    return {
      id: audit.id,
      domain: audit.domain,
      status: "pending",
      score: audit.score ?? null,
      issues: parseIssues(audit.issues),
      errorMessage: audit.errorMessage ?? null,
      accessTokenHash: audit.accessTokenHash ?? null,
      createdAt: audit.createdAt.toISOString(),
      completedAt: audit.completedAt?.toISOString() ?? null,
    };
  }

  return toView(memoryCreateAudit(domain, accessTokenHash));
}

export async function getAuditRecord(id: string): Promise<AuditView | null> {
  const memory = memoryGetAudit(id);
  if (memory) return toView(memory);

  if (!(await isDatabaseAvailable())) {
    return null;
  }

  const db = getDb();
  const [audit] = await db
    .select()
    .from(audits)
    .where(eq(audits.id, id))
    .limit(1);

  if (!audit) return null;

  const status = auditStatusSchema.safeParse(audit.status);
  return {
    id: audit.id,
    domain: audit.domain,
    status: status.success ? status.data : "pending",
    score: audit.score ?? null,
    issues: parseIssues(audit.issues),
    errorMessage: audit.errorMessage ?? null,
    accessTokenHash: audit.accessTokenHash ?? null,
    createdAt: audit.createdAt.toISOString(),
    completedAt: audit.completedAt?.toISOString() ?? null,
  };
}

export async function updateAuditRecord(
  id: string,
  patch: {
    status?: AuditRecord["status"];
    score?: number | null;
    issues?: AuditIssue[];
    errorMessage?: string | null;
    completedAt?: Date | null;
  },
): Promise<AuditView | null> {
  if (memoryGetAudit(id)) {
    const updated = memoryUpdateAudit(id, patch);
    return updated ? toView(updated) : null;
  }

  if (!(await isDatabaseAvailable())) {
    return null;
  }

  const db = getDb();
  const [audit] = await db
    .update(audits)
    .set({
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.score !== undefined ? { score: patch.score } : {}),
      ...(patch.issues !== undefined ? { issues: patch.issues } : {}),
      ...(patch.errorMessage !== undefined
        ? { errorMessage: patch.errorMessage }
        : {}),
      ...(patch.completedAt !== undefined
        ? { completedAt: patch.completedAt }
        : {}),
    })
    .where(eq(audits.id, id))
    .returning();

  if (!audit) return null;

  const status = auditStatusSchema.safeParse(audit.status);
  return {
    id: audit.id,
    domain: audit.domain,
    status: status.success ? status.data : "pending",
    score: audit.score ?? null,
    issues: parseIssues(audit.issues),
    errorMessage: audit.errorMessage ?? null,
    accessTokenHash: audit.accessTokenHash ?? null,
    createdAt: audit.createdAt.toISOString(),
    completedAt: audit.completedAt?.toISOString() ?? null,
  };
}

/** Keeps drizzle import for future health checks / migrations tooling. */
export async function pingDatabase() {
  if (!(await isDatabaseAvailable())) return false;
  const db = getDb();
  await db.execute(sql`select 1`);
  return true;
}
