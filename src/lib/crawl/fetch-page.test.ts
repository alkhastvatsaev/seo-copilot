import { describe, expect, it, vi } from "vitest";
import { isUrlAllowedByRobots } from "@/lib/crawl/robots";
import { CrawlError, fetchHomepage } from "@/lib/crawl/fetch-page";

describe("isUrlAllowedByRobots", () => {
  it("allows when robots.txt is missing", async () => {
    const fetchImpl = vi.fn(async () => new Response("Not Found", { status: 404 }));
    const allowed = await isUrlAllowedByRobots(
      "https://exemple.com",
      "https://exemple.com/",
      fetchImpl as unknown as typeof fetch,
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
      fetchHomepage("exemple.com", fetchImpl as unknown as typeof fetch),
    ).rejects.toMatchObject({ code: "ROBOTS_DISALLOWED" } satisfies Partial<CrawlError>);
  });

  it("throws SSRF_BLOCKED for private hostnames", async () => {
    await expect(
      fetchHomepage("127.0.0.1", fetch as unknown as typeof fetch),
    ).rejects.toMatchObject({ code: "SSRF_BLOCKED" } satisfies Partial<CrawlError>);
  });
});
