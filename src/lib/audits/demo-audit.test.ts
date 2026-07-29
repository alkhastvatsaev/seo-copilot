import { describe, expect, it } from "vitest";
import { getDemoAudit } from "@/lib/audits/demo-audit";

describe("getDemoAudit", () => {
  it("returns a completed audit with prioritized issues and score", () => {
    const audit = getDemoAudit();
    expect(audit.status).toBe("completed");
    expect(audit.domain).toBe("exemple.com");
    expect(audit.issues.length).toBeGreaterThan(0);
    expect(audit.score).toBeGreaterThanOrEqual(0);
    expect(audit.score).toBeLessThanOrEqual(100);
    expect(audit.issues[0]?.priority).toBe("high");
  });
});
