import type { AuditView } from "@/lib/audits/types";
import type { AuditIssue } from "@/lib/audits/issue-schema";
import { prioritizeIssues } from "@/lib/ai/pipeline/prioritize";
import { scoreIssues } from "@/lib/ai/pipeline/score";

const demoIssues: AuditIssue[] = [
  {
    id: "missing_meta_description",
    code: "missing_meta_description",
    title: "Description Google à rédiger",
    why: "La meta description est votre courte invitation au clic — sans elle, Google choisit souvent un extrait au hasard.",
    impact: "Moins de contrôle sur le message qui convainc vos futurs clients.",
    priority: "high",
    effort: "low",
    difficulty: "low",
    howToFix:
      "Ajoutez une meta description unique d’environ 140–160 caractères, centrée sur le bénéfice.",
    afterExample:
      '<meta name="description" content="Audit SEO actionnable pour PME — problèmes expliqués et corrigeables avec l\'IA.">',
  },
  {
    id: "images_missing_alt",
    code: "images_missing_alt",
    title: "Textes alternatifs d’images à compléter",
    why: "4/7 images n’ont pas d’alt — utile pour l’accessibilité et la compréhension.",
    impact: "Vos visiteurs et Google comprennent mieux le contenu visuel.",
    priority: "high",
    effort: "medium",
    difficulty: "low",
    howToFix:
      'Ajoutez un alt descriptif (ou alt="" si purement décoratif).',
    beforeExample: '<img src="/hero.jpg">',
    afterExample:
      '<img src="/hero.jpg" alt="Équipe SEO en atelier de priorisation">',
  },
  {
    id: "missing_canonical",
    code: "missing_canonical",
    title: "URL de référence à indiquer",
    why: "Le canonical dit à Google quelle version de la page compter.",
    impact: "Aide à concentrer la visibilité sur la bonne URL.",
    priority: "medium",
    effort: "low",
    difficulty: "low",
    howToFix:
      'Ajoutez un link rel="canonical" pointant vers l’URL que vous préférez.',
    afterExample: '<link rel="canonical" href="https://exemple.com/">',
  },
  {
    id: "title_too_short",
    code: "title_too_short",
    title: "Titre à enrichir",
    why: "Votre titre fait 18 caractères — il peut mieux raconter ce que vous offrez.",
    impact: "Un titre plus clair attire souvent plus de clics qualifiés.",
    priority: "medium",
    effort: "low",
    difficulty: "low",
    howToFix:
      "Élargissez vers 50–60 caractères : bénéfice + marque, sans bourrage de mots-clés.",
    beforeExample: "Accueil — Acme",
    afterExample: "Agence SEO à Lyon pour PME | Acme Consulting",
  },
  {
    id: "multiple_h1",
    code: "multiple_h1",
    title: "Un seul titre principal serait plus clair",
    why: "La page contient 2 balises H1 — un seul point d’ancrage aide la lecture.",
    impact: "Le sujet principal est plus facile à saisir pour vos visiteurs.",
    priority: "medium",
    effort: "low",
    difficulty: "low",
    howToFix: "Gardez un H1 ; transformez les autres en H2/H3.",
  },
];

export function getDemoAudit(): AuditView {
  const issues = prioritizeIssues(demoIssues);
  const score = scoreIssues(issues);
  return {
    id: "00000000-0000-4000-8000-000000000001",
    domain: "exemple.com",
    status: "completed",
    score,
    issues,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}
