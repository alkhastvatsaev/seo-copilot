import { z } from "zod";
import { env } from "@/lib/env";
import { PAGESPEED_TIMEOUT_MS } from "@/lib/crawl/constants";
import { logger } from "@/lib/logger";
import type { AuditIssue } from "@/lib/audits/issue-schema";

const psiSchema = z.object({
  lighthouseResult: z
    .object({
      categories: z
        .object({
          performance: z
            .object({
              score: z.number().nullable().optional(),
            })
            .optional(),
        })
        .optional(),
      audits: z
        .record(
          z.string(),
          z.object({
            numericValue: z.number().optional(),
            displayValue: z.string().optional(),
            score: z.number().nullable().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  loadingExperience: z
    .object({
      overall_category: z.string().optional(),
    })
    .optional(),
});

export type PageSpeedSnapshot = {
  performanceScore: number | null;
  lcpMs: number | null;
  cls: number | null;
  inpMs: number | null;
  overallCategory: string | null;
};

function issue(
  partial: Omit<AuditIssue, "id"> & { id?: string },
): AuditIssue {
  return {
    id: partial.id ?? partial.code,
    ...partial,
  };
}

/**
 * Fetch lab CWV-ish metrics via PageSpeed Insights (optional API key).
 * Failures are soft — audit continues without performance issues.
 */
export async function fetchPageSpeedSnapshot(
  pageUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PageSpeedSnapshot | null> {
  const endpoint = new URL(
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
  );
  endpoint.searchParams.set("url", pageUrl);
  endpoint.searchParams.set("category", "PERFORMANCE");
  endpoint.searchParams.set("strategy", "mobile");
  if (env.PAGESPEED_API_KEY) {
    endpoint.searchParams.set("key", env.PAGESPEED_API_KEY);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PAGESPEED_TIMEOUT_MS);

  try {
    const response = await fetchImpl(endpoint.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      logger.info(
        { status: response.status, pageUrl },
        "pagespeed request not ok",
      );
      return null;
    }
    const json: unknown = await response.json();
    const parsed = psiSchema.safeParse(json);
    if (!parsed.success) return null;

    const audits = parsed.data.lighthouseResult?.audits ?? {};
    const perf =
      parsed.data.lighthouseResult?.categories?.performance?.score ?? null;

    return {
      performanceScore:
        typeof perf === "number" ? Math.round(perf * 100) : null,
      lcpMs: audits["largest-contentful-paint"]?.numericValue ?? null,
      cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
      inpMs:
        audits["interaction-to-next-paint"]?.numericValue ??
        audits["experimental-interaction-to-next-paint"]?.numericValue ??
        null,
      overallCategory: parsed.data.loadingExperience?.overall_category ?? null,
    };
  } catch (error) {
    logger.info({ err: error, pageUrl }, "pagespeed skipped");
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function analyzePageSpeed(snapshot: PageSpeedSnapshot): AuditIssue[] {
  const issues: AuditIssue[] = [];

  if (snapshot.performanceScore !== null && snapshot.performanceScore < 50) {
    issues.push(
      issue({
        code: "cwv_performance_low",
        title: "Performance mobile à améliorer",
        why: `PageSpeed (lab) score ~${snapshot.performanceScore}/100 sur mobile.`,
        impact: "Lenteur perçue : plus d’abandons et un signal expérience négatif.",
        priority: "high",
        effort: "high",
        difficulty: "high",
        howToFix:
          "Réduisez JS/CSS bloquants, optimisez images, améliorez le serveur/CDN.",
      }),
    );
  }

  if (snapshot.lcpMs !== null && snapshot.lcpMs > 2500) {
    issues.push(
      issue({
        code: "cwv_lcp_slow",
        title: "LCP (Largest Contentful Paint) trop lent",
        why: `LCP lab ≈ ${Math.round(snapshot.lcpMs)} ms (cible : ≤ 2500 ms).`,
        impact: "Le contenu principal met trop longtemps à apparaître.",
        priority: snapshot.lcpMs > 4000 ? "high" : "medium",
        effort: "high",
        difficulty: "medium",
        howToFix:
          "Optimisez l’image/hero LCP, préchargez la ressource critique, réduisez le TTFB.",
      }),
    );
  }

  if (snapshot.cls !== null && snapshot.cls > 0.1) {
    issues.push(
      issue({
        code: "cwv_cls_high",
        title: "CLS (stabilité visuelle) à corriger",
        why: `CLS lab ≈ ${snapshot.cls.toFixed(3)} (cible : ≤ 0.1).`,
        impact: "La page « saute » pendant le chargement — frustrant pour le clic.",
        priority: snapshot.cls > 0.25 ? "high" : "medium",
        effort: "medium",
        difficulty: "medium",
        howToFix:
          "Réservez largeur/hauteur des images et embeds ; évitez d’injecter du contenu au-dessus.",
      }),
    );
  }

  if (snapshot.inpMs !== null && snapshot.inpMs > 200) {
    issues.push(
      issue({
        code: "cwv_inp_slow",
        title: "Interactivité (INP) à fluidifier",
        why: `INP lab ≈ ${Math.round(snapshot.inpMs)} ms (cible : ≤ 200 ms).`,
        impact: "La page met du temps à répondre aux clics/tapes.",
        priority: snapshot.inpMs > 500 ? "high" : "medium",
        effort: "high",
        difficulty: "high",
        howToFix:
          "Réduisez le travail JS long sur le thread principal ; découpez les handlers.",
      }),
    );
  }

  return issues;
}
