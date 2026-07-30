/**
 * Score framing — honest about technical on-page scope (not global SEO authority).
 */
export function frameScoreMessage(score: number): string {
  if (score >= 90) {
    return "Solide sur les contrôles techniques de cet échantillon. Des signaux plus larges (concurrence, backlinks) restent hors de ce score.";
  }
  if (score >= 70) {
    return "Bonne base technique — voici les leviers on-page / perf les plus utiles sur les pages analysées.";
  }
  if (score >= 50) {
    return "Il y a du potentiel. Priorisons les écarts techniques qui freinent le plus vos visiteurs.";
  }
  return "On avance pas à pas — plusieurs fondations techniques méritent une correction rapide.";
}

export const SCORE_SCOPE_LABEL =
  "Score technique (on-page + perf lab) — pas une note d’autorité SEO globale";
