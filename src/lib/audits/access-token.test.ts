import { describe, expect, it } from "vitest";
import {
  createAuditAccessToken,
  verifyAuditAccessToken,
} from "@/lib/audits/access-token";

describe("audit access token", () => {
  it("verifies a fresh token against its hash", () => {
    const { token, hash } = createAuditAccessToken();
    expect(verifyAuditAccessToken(token, hash)).toBe(true);
    expect(verifyAuditAccessToken("wrong", hash)).toBe(false);
    expect(verifyAuditAccessToken(token, null)).toBe(false);
  });
});
