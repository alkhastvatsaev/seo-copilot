/**
 * Score framing — appreciation first (Dale Carnegie), then next step.
 */
export function frameScoreMessage(score: number): string {
  if (score >= 90) {
    return "Belle base. Quelques finitions et vous serez encore plus clair pour vos visiteurs.";
  }
  if (score >= 70) {
    return "Vous êtes sur la bonne voie. Voici les leviers les plus utiles pour progresser.";
  }
  if (score >= 50) {
    return "Il y a du potentiel. Commençons par quelques actions concrètes, une à la fois.";
  }
  return "On avance pas à pas — chaque correction compte pour vos visiteurs.";
}
