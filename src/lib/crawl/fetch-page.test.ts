import { describe, expect, it, vi } from "vitest";
import { isUrlAllowedByRobots } from "@/lib/crawl/robots";
import { CrawlError, fetchHomepage } from "@/lib/crawl/fetch-page";
import { fetchWithSafeRedirects } from "@/lib/crawl/safe-fetch";
import { assertHostnameResolvesPublic } from "@/lib/crawl/ssrf-resolve";
import { isBlockedIpAddress } from "@/lib/crawl/ssrf-host";

const publicResolve = async () => ["93.184.216.34"];

describe("isBlockedIpAddress", () => {
  it("blocks private and metadata addresses", () => {
    expect(isBlockedIpAddress("127.0.0.1")).toBe(true);
    expect(isBlockedIpAddress("10.0.0.1")).toBe(true);
    expect(isBlockedIpAddress("169.254.169.254")).toBe(true);
    expect(isBlockedIpAddress("8.8.8.8")).toBe(false);
  });
});

describe("assertHostnameResolvesPublic", () => {
  it("rejects hostnames that resolve to private IPs", async () => {
    await expect(
      assertHostnameResolvesPublic("evil.example", async () => ["127.0.0.1"]),
    ).rejects.toThrow(/autorisé/);
  });

  it("accepts public resolutions", async () => {
    await expect(
      assertHostnameResolvesPublic("example.com", publicResolve),
    ).resolves.toBeUndefined();
  });
});

describe("fetchWithSafeRedirects", () => {
  it("blocks redirect hops to private hosts", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/" },
      });
    });

    await expect(
      fetchWithSafeRedirects("https://exemple.com/", {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        resolveAddresses: publicResolve,
      }),
    ).rejects.toMatchObject({ code: "SSRF_BLOCKED" });
  });

  it("follows a safe redirect then returns the body response", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "https://exemple.com/") {
        return new Response(null, {
          status: 302,
          headers: { location: "https://www.exemple.com/" },
        });
      }
      return new Response("<html></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    });

    const result = await fetchWithSafeRedirects("https://exemple.com/", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      resolveAddresses: publicResolve,
    });
    expect(result.finalUrl).toBe("https://www.exemple.com/");
    expect(result.response.status).toBe(200);
  });
});

describe("isUrlAllowedByRobots", () => {
  it("allows when robots.txt is missing", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("Not Found", { status: 404 }),
    );
    const allowed = await isUrlAllowedByRobots(
      "https://exemple.com",
      "https://exemple.com/",
      fetchImpl as unknown as typeof fetch,
      publicResolve,
    );
    expect(allowed).toBe(true);
  });

  it("respects Disallow for our user-agent", async () => {
    const body = ["User-agent: SEOCopilotBot", "Disallow: /"].join("\n");
    const fetchImpl = vi.fn(async () => new Response(body, { status: 200 }));
    const allowed = await isUrlAllowedByRobots(
      "https://exemple.com",
      "https://exemple.com/",
      fetchImpl as unknown as typeof fetch,
      publicResolve,
    );
    expect(allowed).toBe(false);
  });
});

describe("fetchHomepage", () => {
  it("returns html when https succeeds", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/robots.txt")) {
        return new Response("User-agent: *\nAllow: /", { status: 200 });
      }
      return new Response("<html><title>Ok</title></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    });

    const page = await fetchHomepage(
      "exemple.com",
      fetchImpl as unknown as typeof fetch,
      publicResolve,
    );
    expect(page.status).toBe(200);
    expect(page.html).toContain("<title>Ok</title>");
  });

  it("throws ROBOTS_DISALLOWED when blocked", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/robots.txt")) {
        return new Response("User-agent: *\nDisallow: /", { status: 200 });
      }
      return new Response("should not fetch", { status: 200 });
    });

    await expect(
      fetchHomepage(
        "exemple.com",
        fetchImpl as unknown as typeof fetch,
        publicResolve,
      ),
    ).rejects.toMatchObject({
      code: "ROBOTS_DISALLOWED",
    } satisfies Partial<CrawlError>);
  });

  it("throws SSRF_BLOCKED for private hostnames", async () => {
    await expect(
      fetchHomepage("127.0.0.1", fetch as unknown as typeof fetch, publicResolve),
    ).rejects.toMatchObject({ code: "SSRF_BLOCKED" } satisfies Partial<CrawlError>);
  });

  it("throws SSRF_BLOCKED when DNS resolves private", async () => {
    await expect(
      fetchHomepage(
        "exemple.com",
        fetch as unknown as typeof fetch,
        async () => ["10.0.0.1"],
      ),
    ).rejects.toMatchObject({ code: "SSRF_BLOCKED" } satisfies Partial<CrawlError>);
  });
});
