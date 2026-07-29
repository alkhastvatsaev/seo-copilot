import { describe, expect, it } from "vitest";
import {
  domainInputSchema,
  normalizeDomainInput,
} from "@/lib/validations/domain";

describe("normalizeDomainInput", () => {
  it("strips protocol, path and port", () => {
    expect(normalizeDomainInput("https://Example.COM/path?x=1")).toBe(
      "example.com",
    );
    expect(normalizeDomainInput("http://www.exemple.com:8080")).toBe(
      "www.exemple.com",
    );
  });
});

describe("domainInputSchema", () => {
  it("accepts a valid hostname", () => {
    const result = domainInputSchema.safeParse({ domain: "Example.COM" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domain).toBe("example.com");
    }
  });

  it("accepts pasted URLs and normalizes them", () => {
    const result = domainInputSchema.safeParse({
      domain: "https://example.com/page",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domain).toBe("example.com");
    }
  });

  it("rejects private hosts and IP literals", () => {
    expect(domainInputSchema.safeParse({ domain: "127.0.0.1.nip.io" }).success)
      .toBe(false);
    expect(domainInputSchema.safeParse({ domain: "localhost.local" }).success)
      .toBe(false);
  });
});
