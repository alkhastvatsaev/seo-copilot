import { describe, expect, it, beforeEach } from "vitest";
import {
  memoryClearAudits,
  memoryCreateAudit,
  memoryGetAudit,
  memoryUpdateAudit,
} from "@/lib/audits/memory-store";

describe("memory audit store", () => {
  beforeEach(() => {
    memoryClearAudits();
  });

  it("creates and updates an audit", () => {
    const created = memoryCreateAudit("exemple.com", "hash-test");
    expect(created.status).toBe("pending");
    expect(created.accessTokenHash).toBe("hash-test");
    expect(memoryGetAudit(created.id)?.domain).toBe("exemple.com");

    const updated = memoryUpdateAudit(created.id, {
      status: "completed",
      score: 72,
      issues: [],
      completedAt: new Date(),
    });

    expect(updated?.status).toBe("completed");
    expect(updated?.score).toBe(72);
  });
});
