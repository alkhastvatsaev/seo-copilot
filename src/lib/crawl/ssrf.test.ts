import { describe, expect, it } from "vitest";
import {
  assertPublicHostname,
  assertPublicHttpUrl,
  isBlockedHostname,
} from "@/lib/crawl/ssrf";

describe("isBlockedHostname", () => {
  it("blocks localhost and private IPs", () => {
    expect(isBlockedHostname("localhost")).toBe(true);
    expect(isBlockedHostname("127.0.0.1")).toBe(true);
    expect(isBlockedHostname("10.0.0.1")).toBe(true);
    expect(isBlockedHostname("192.168.1.1")).toBe(true);
    expect(isBlockedHostname("169.254.169.254")).toBe(true);
    expect(isBlockedHostname("::1")).toBe(true);
  });

  it("blocks internal / rebinding helpers", () => {
    expect(isBlockedHostname("foo.local")).toBe(true);
    expect(isBlockedHostname("svc.internal")).toBe(true);
    expect(isBlockedHostname("1.1.1.1.nip.io")).toBe(true);
  });

  it("allows public hostnames", () => {
    expect(isBlockedHostname("example.com")).toBe(false);
    expect(isBlockedHostname("www.google.com")).toBe(false);
  });
});

describe("assertPublicHttpUrl", () => {
  it("accepts https public URLs", () => {
    expect(() => assertPublicHttpUrl("https://example.com/")).not.toThrow();
  });

  it("rejects private final URLs", () => {
    expect(() => assertPublicHttpUrl("http://127.0.0.1/")).toThrow();
    expect(() => assertPublicHostname("10.1.2.3")).toThrow();
  });
});
