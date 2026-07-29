import type { AuditView } from "@/lib/audits/types";
import type { AuditIssue } from "@/lib/audits/issue-schema";
import { prioritizeIssues } from "@/lib/ai/pipeline/prioritize";
import { scoreIssues } from "@/lib/ai/pipeline/score";

const demoIssues: AuditIssue[] = [
  {
    id: "missing_meta_description",
    code: "missing_meta_description",
    title: "Meta description manquante",
    why: "Sans meta description, Google génère souvent un extrait moins convaincant.",
    impact: "CTR organique potentiellement plus bas sur les requêtes clés.",
    priority: "high",
    effort: "low",
    difficulty: "low",
    howToFix:
      "Ajoutez une meta description unique d'environ 140–160 caractères.",
    afterExample:
      '<meta name="description" content="Audit SEO actionnable pour PME — problèmes expliqués et corrigeables avec l\'IA.">',
  },
  {
    id: "images_missing_alt",
    code: "images_missing_alt",
    title: "Images sans attribut alt",
    why: "4/7 images n'ont pas d'attribut alt descriptif.",
    impact: "Accessibilité et SEO image dégradés.",
    priority: "high",
    effort: "medium",
    difficulty: "low",
    howToFix:
      "Ajoutez un alt descriptif (ou alt=\"\" si purement décoratif).",
    beforeExample: '<img src="/hero.jpg">',
    afterExample: '<img src="/hero.jpg" alt="Équipe SEO en atelier de priorisation">',
  },
  {
    id: "missing_canonical",
    code: "missing_canonical",
    title: "Canonical manquant",
    why: "Sans canonical, les variantes d'URL peuvent diluer le ranking.",
    impact: "Risque de contenu dupliqué entre www et paramètres UTM.",
    priority: "medium",
    effort: "low",
    difficulty: "low",
    howToFix:
      "Ajoutez un link rel=\"canonical\" pointant vers l'URL préférée.",
    afterExample: '<link rel="canonical" href="https://exemple.com/">',
  },
  {
    id: "title_too_short",
    code: "title_too_short",
    title: "Title trop court",
    why: "Le title fait 18 caractères — trop peu pour décrire la page.",
    impact: "Snippet peu attractif et pertinence thématique limitée.",
    priority: "medium",
    effort: "low",
    difficulty: "low",
    howToFix: "Allongez le title vers 50–60 caractères avec le mot-clé principal.",
    beforeExample: "Accueil — Acme",
    afterExample: "Agence SEO à Lyon pour PME | Acme Consulting",
  },
  {
    id: "multiple_h1",
    code: "multiple_h1",
    title: "Plusieurs H1 détectés",
    why: "La page contient 2 balises H1.",
    impact: "Signal thématique dilué ; structure moins claire.",
    priority: "medium",
    effort: "low",
    difficulty: "low",
    howToFix: "Conservez un seul H1 ; rétrogradez les autres en H2/H3.",
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
