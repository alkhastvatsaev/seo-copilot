import { z } from "zod";
import {
  AiFixUnavailableError,
  generateIssueFix,
} from "@/lib/ai/generate-issue-fix";
import {
  parseAuditAccessCookie,
  verifyAuditAccessToken,
} from "@/lib/audits/access-token";
import { apiError } from "@/lib/api/errors";
import { getAuditRecord } from "@/lib/audits/repository";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { captureServerException } from "@/lib/sentry/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
  issueId: z.string().min(1).max(120),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; issueId: string }> },
) {
  const rawParams = await context.params;
  const parsedParams = paramsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return apiError("VALIDATION_ERROR", "Paramètres invalides.", 400);
  }

  const rate = checkRateLimit(`ai-fix:${getClientIp(request)}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return apiError(
      "RATE_LIMITED",
      `Trop de demandes IA. Réessayez dans ${rate.retryAfterSec}s.`,
      429,
    );
  }

  try {
    const audit = await getAuditRecord(parsedParams.data.id);
    if (!audit) {
      return apiError("NOT_FOUND", "Audit introuvable.", 404);
    }

    const headerToken = request.headers.get("x-audit-access-token");
    const cookieToken = parseAuditAccessCookie(
      request.headers.get("cookie"),
      parsedParams.data.id,
    );
    const token = headerToken ?? cookieToken;
    if (!verifyAuditAccessToken(token, audit.accessTokenHash)) {
      return apiError(
        "FORBIDDEN",
        "Jeton d'accès manquant ou invalide pour cette correction IA.",
        403,
      );
    }

    if (audit.status !== "completed") {
      return apiError(
        "VALIDATION_ERROR",
        "L'audit doit être terminé avant une correction IA.",
        400,
      );
    }

    const issue = audit.issues.find(
      (candidate) => candidate.id === parsedParams.data.issueId,
    );
    if (!issue) {
      return apiError("NOT_FOUND", "Problème introuvable dans cet audit.", 404);
    }

    const suggestion = await generateIssueFix({
      domain: audit.domain,
      issue,
    });

    return Response.json({ data: suggestion });
  } catch (error) {
    if (error instanceof AiFixUnavailableError) {
      return apiError("INTERNAL_ERROR", error.message, 503);
    }
    logger.error(
      {
        err: error,
        auditId: parsedParams.data.id,
        issueId: parsedParams.data.issueId,
      },
      "ai fix failed",
    );
    captureServerException(error);
    return apiError(
      "INTERNAL_ERROR",
      "Impossible de générer la correction pour le moment.",
      500,
    );
  }
}
