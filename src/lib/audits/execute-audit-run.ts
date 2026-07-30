import { runSiteAudit } from "@/lib/ai/pipeline/run-deterministic-audit";
import { getAuditRecord, updateAuditRecord } from "@/lib/audits/repository";
import { CrawlError } from "@/lib/crawl/fetch-page";
import { crawlSite } from "@/lib/crawl/site-crawl";
import { logger } from "@/lib/logger";
import { fetchPageSpeedSnapshot } from "@/lib/performance/pagespeed";

export async function executeAuditRun(input: {
  auditId: string;
}): Promise<{ status: "completed" | "failed"; score?: number }> {
  const existing = await getAuditRecord(input.auditId);
  if (!existing) {
    logger.error({ auditId: input.auditId }, "audit not found for run");
    return { status: "failed" };
  }

  const domain = existing.domain;

  await updateAuditRecord(input.auditId, {
    status: "running",
    errorMessage: null,
  });

  try {
    const pages = await crawlSite(domain);
    const homepageUrl = pages[0]?.extract.finalUrl ?? `https://${domain}/`;

    const pageSpeed = await fetchPageSpeedSnapshot(homepageUrl);

    const result = runSiteAudit({ pages, pageSpeed });

    await updateAuditRecord(input.auditId, {
      status: "completed",
      score: result.score,
      issues: result.issues,
      completedAt: new Date(),
      errorMessage: null,
    });

    logger.info(
      {
        auditId: input.auditId,
        domain,
        score: result.score,
        issueCount: result.issues.length,
        pageCount: pages.length,
        hasPageSpeed: Boolean(pageSpeed),
      },
      "audit completed",
    );

    return { status: "completed", score: result.score };
  } catch (error) {
    const message =
      error instanceof CrawlError
        ? error.message
        : "Échec inattendu pendant l'audit.";

    await updateAuditRecord(input.auditId, {
      status: "failed",
      errorMessage: message,
      completedAt: new Date(),
    });

    logger.error(
      { err: error, auditId: input.auditId, domain },
      "audit failed",
    );

    return { status: "failed" };
  }
}
