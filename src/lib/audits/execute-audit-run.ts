import { runDeterministicAudit } from "@/lib/ai/pipeline/run-deterministic-audit";
import { getAuditRecord, updateAuditRecord } from "@/lib/audits/repository";
import { CrawlError, fetchHomepage } from "@/lib/crawl/fetch-page";
import { logger } from "@/lib/logger";

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
    const page = await fetchHomepage(domain);
    const result = runDeterministicAudit({
      html: page.html,
      url: page.url,
      finalUrl: page.finalUrl,
      status: page.status,
    });

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
