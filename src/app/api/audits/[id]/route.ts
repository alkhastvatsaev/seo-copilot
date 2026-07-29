import { z } from "zod";
import { apiError } from "@/lib/api/errors";
import { getAuditRecord } from "@/lib/audits/repository";
import { auditIssueSchema, auditStatusSchema } from "@/lib/audits/issue-schema";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { captureServerException } from "@/lib/sentry/server";

const auditIdSchema = z.string().uuid();

const auditResponseSchema = z.object({
  id: z.string(),
  domain: z.string(),
  status: auditStatusSchema,
  score: z.number().int().nullable(),
  issues: z.array(auditIssueSchema),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const rate = checkRateLimit(`audit-get:${getClientIp(request)}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return apiError(
      "RATE_LIMITED",
      `Trop de demandes. Réessayez dans ${rate.retryAfterSec}s.`,
      429,
    );
  }

  const { id } = await context.params;
  const parsedId = auditIdSchema.safeParse(id);
  if (!parsedId.success) {
    return apiError("VALIDATION_ERROR", "Identifiant d'audit invalide.", 400);
  }

  try {
    const audit = await getAuditRecord(parsedId.data);
    if (!audit) {
      return apiError("NOT_FOUND", "Audit introuvable.", 404);
    }

    const payload = auditResponseSchema.parse(audit);
    return Response.json({ data: payload });
  } catch (error) {
    logger.error({ err: error, auditId: parsedId.data }, "failed to get audit");
    captureServerException(error);
    return apiError(
      "INTERNAL_ERROR",
      "Impossible de récupérer l'audit.",
      500,
    );
  }
}
