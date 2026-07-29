import { describe, expect, it } from "vitest";
import { domainInputSchema } from "@/lib/validations/domain";

describe("domainInputSchema", () => {
  it("accepts a valid hostname", () => {
    const result = domainInputSchema.safeParse({ domain: "Example.COM" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domain).toBe("example.com");
    }
  });

  it("rejects values with protocol or path", () => {
    expect(domainInputSchema.safeParse({ domain: "https://example.com" }).success)
      .toBe(false);
    expect(domainInputSchema.safeParse({ domain: "example.com/page" }).success)
      .toBe(false);
  });

  it("rejects private hosts and IP literals", () => {
    expect(domainInputSchema.safeParse({ domain: "127.0.0.1.nip.io" }).success)
      .toBe(false);
    expect(domainInputSchema.safeParse({ domain: "localhost.local" }).success)
      .toBe(false);
  });
});
