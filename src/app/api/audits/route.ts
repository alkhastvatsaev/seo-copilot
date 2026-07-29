import { after } from "next/server";
import {
  buildAuditAccessSetCookie,
  createAuditAccessToken,
} from "@/lib/audits/access-token";
import { createAuditRecord } from "@/lib/audits/repository";
import { executeAuditRun } from "@/lib/audits/execute-audit-run";
import { inngest } from "@/inngest/client";
import { apiError } from "@/lib/api/errors";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { captureServerException } from "@/lib/sentry/server";
import { createAuditRequestSchema } from "@/lib/validations/domain";

export async function POST(request: Request) {
  const rate = checkRateLimit(`audit-create:${getClientIp(request)}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return apiError(
      "RATE_LIMITED",
      `Trop de demandes. Réessayez dans ${rate.retryAfterSec}s.`,
      429,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Corps JSON invalide.", 400);
  }

  const parsed = createAuditRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Domaine invalide.",
      400,
    );
  }

  try {
    const { token, hash } = createAuditAccessToken();
    const audit = await createAuditRecord(parsed.data.domain, hash);

    let queuedViaInngest = false;
    if (env.INNGEST_EVENT_KEY) {
      try {
        await inngest.send({
          name: "audit/run",
          data: { auditId: audit.id },
        });
        queuedViaInngest = true;
      } catch (sendError) {
        logger.warn(
          { err: sendError, auditId: audit.id },
          "inngest send failed — falling back to after()",
        );
      }
    }

    // Vercel `after()` keeps the crawl off the critical request path when Inngest is unset.
    if (!queuedViaInngest) {
      after(() => executeAuditRun({ auditId: audit.id }));
      logger.info({ auditId: audit.id }, "audit scheduled via after()");
    }

    return Response.json(
      { data: { auditId: audit.id, status: "pending" } },
      {
        status: 202,
        headers: {
          "Set-Cookie": buildAuditAccessSetCookie(audit.id, token),
        },
      },
    );
  } catch (error) {
    logger.error({ err: error }, "failed to create audit");
    captureServerException(error);
    return apiError(
      "INTERNAL_ERROR",
      "Impossible de lancer l'audit pour le moment. Voyez /audits/demo pour un exemple.",
      500,
    );
  }
}
