import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { AuditIssue, AuditStatus } from "@/lib/audits/issue-schema";

export type AuditRecord = {
  id: string;
  domain: string;
  status: AuditStatus;
  score: number | null;
  issues: AuditIssue[];
  errorMessage: string | null;
  accessTokenHash: string | null;
  userId: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

type SerializedAuditRecord = Omit<
  AuditRecord,
  "createdAt" | "completedAt"
> & {
  createdAt: string;
  completedAt: string | null;
};

const globalStore = globalThis as typeof globalThis & {
  __seoCopilotAuditStore?: Map<string, AuditRecord>;
};

function devFilePath() {
  if (process.env.NODE_ENV === "test") {
    return path.join(process.cwd(), ".data/test-audits.json");
  }
  return path.join(process.cwd(), ".data/dev-audits.json");
}

function serialize(record: AuditRecord): SerializedAuditRecord {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    completedAt: record.completedAt?.toISOString() ?? null,
  };
}

function deserialize(raw: SerializedAuditRecord): AuditRecord {
  return {
    ...raw,
    accessTokenHash: raw.accessTokenHash ?? null,
    createdAt: new Date(raw.createdAt),
    completedAt: raw.completedAt ? new Date(raw.completedAt) : null,
  };
}

function loadFromDisk(): Map<string, AuditRecord> {
  const file = devFilePath();
  if (!existsSync(file)) {
    return new Map();
  }
  try {
    const parsed = JSON.parse(
      readFileSync(file, "utf8"),
    ) as SerializedAuditRecord[];
    const map = new Map<string, AuditRecord>();
    for (const item of parsed) {
      map.set(item.id, deserialize(item));
    }
    return map;
  } catch {
    return new Map();
  }
}

function persistToDisk(store: Map<string, AuditRecord>) {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  const file = devFilePath();
  mkdirSync(path.dirname(file), { recursive: true });
  const payload = [...store.values()].map(serialize);
  writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
}

function getStore(): Map<string, AuditRecord> {
  if (!globalStore.__seoCopilotAuditStore) {
    globalStore.__seoCopilotAuditStore = loadFromDisk();
  }
  return globalStore.__seoCopilotAuditStore;
}

export function memoryCreateAudit(
  domain: string,
  accessTokenHash: string,
): AuditRecord {
  const store = getStore();
  const record: AuditRecord = {
    id: crypto.randomUUID(),
    domain,
    status: "pending",
    score: null,
    issues: [],
    errorMessage: null,
    accessTokenHash,
    userId: null,
    createdAt: new Date(),
    completedAt: null,
  };
  store.set(record.id, record);
  persistToDisk(store);
  return record;
}

export function memoryGetAudit(id: string): AuditRecord | null {
  const store = getStore();
  const hit = store.get(id);
  if (hit) return hit;

  const reloaded = loadFromDisk();
  globalStore.__seoCopilotAuditStore = reloaded;
  return reloaded.get(id) ?? null;
}

export function memoryUpdateAudit(
  id: string,
  patch: Partial<
    Pick<
      AuditRecord,
      | "status"
      | "score"
      | "issues"
      | "errorMessage"
      | "completedAt"
      | "accessTokenHash"
    >
  >,
): AuditRecord | null {
  const store = getStore();
  const current = store.get(id) ?? loadFromDisk().get(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  store.set(id, next);
  globalStore.__seoCopilotAuditStore = store;
  persistToDisk(store);
  return next;
}

/** Test helper */
export function memoryClearAudits() {
  const store = new Map<string, AuditRecord>();
  globalStore.__seoCopilotAuditStore = store;
  const file = devFilePath();
  if (existsSync(file)) {
    writeFileSync(file, "[]", "utf8");
  }
}
