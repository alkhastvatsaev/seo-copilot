import type { AuditIssue } from "@/lib/audits/issue-schema";
import type { PageExtract } from "./extract";

function issue(
  partial: Omit<AuditIssue, "id"> & { id?: string },
): AuditIssue {
  return {
    id: partial.id ?? partial.code,
    ...partial,
  };
}

export function analyzePageExtract(extract: PageExtract): AuditIssue[] {
  const issues: AuditIssue[] = [];

  if (extract.status >= 400) {
    issues.push(
      issue({
        code: "http_error",
        title: `La page répond en HTTP ${extract.status}`,
        why: "Une page d'accueil en erreur ne peut pas être indexée correctement.",
        impact: "Perte de visibilité organique et mauvaise première impression.",
        priority: "critical",
        effort: "high",
        difficulty: "high",
        howToFix:
          "Corrigez la cause serveur (DNS, certificat, application) pour obtenir un 200.",
      }),
    );
  }

  if (!extract.isHttps) {
    issues.push(
      issue({
        code: "no_https",
        title: "Le site n'est pas servi en HTTPS",
        why: "Google privilégie le HTTPS ; les navigateurs marquent HTTP comme non sécurisé.",
        impact: "Confiance utilisateur et signal de ranking dégradés.",
        priority: "critical",
        effort: "medium",
        difficulty: "medium",
        howToFix:
          "Activez un certificat TLS et redirigez tout le trafic HTTP vers HTTPS.",
        beforeExample: "http://exemple.com/",
        afterExample: "https://exemple.com/",
      }),
    );
  }

  if (!extract.title) {
    issues.push(
      issue({
        code: "missing_title",
        title: "Balise title manquante",
        why: "Le title est le principal signal on-page pour le snippet SERP.",
        impact: "CTR faible et compréhension du sujet dégradée par Google.",
        priority: "critical",
        effort: "low",
        difficulty: "low",
        howToFix:
          "Ajoutez une balise <title> unique, descriptive, ~50–60 caractères.",
        beforeExample: "(aucune balise title)",
        afterExample: "<title>Agence SEO à Lyon | Nom de marque</title>",
      }),
    );
  } else if (extract.title.length < 30) {
    const shortBrandTitle =
      extract.title.length <= 20 && !extract.title.includes("|");
    issues.push(
      issue({
        code: "title_too_short",
        title: shortBrandTitle
          ? "Title court (nom de marque)"
          : "Title trop court",
        why: shortBrandTitle
          ? `Le title « ${extract.title} » est volontairement minimal — utile pour une marque très connue, mais souvent sous-optimal pour le CTR sur un site business.`
          : `Le title fait ${extract.title.length} caractères — peu de contexte pour le snippet.`,
        impact: shortBrandTitle
          ? "CTR potentiellement limité hors notoriété de marque."
          : "Snippet peu attractif et pertinence thématique limitée.",
        priority: shortBrandTitle ? "low" : "medium",
        effort: "low",
        difficulty: "low",
        howToFix: shortBrandTitle
          ? "Enrichissez vers 50–60 caractères si vous ciblez des requêtes non-brand."
          : "Allongez le title vers 50–60 caractères avec le mot-clé principal.",
        beforeExample: extract.title,
        afterExample: shortBrandTitle
          ? `${extract.title} — recherche et services`
          : `${extract.title} — services et contact`,
      }),
    );
  } else if (extract.title.length > 65) {
    issues.push(
      issue({
        code: "title_too_long",
        title: "Title trop long",
        why: `Le title fait ${extract.title.length} caractères et risque d'être tronqué.`,
        impact: "Snippet SERP coupé, message clé potentiellement invisible.",
        priority: "low",
        effort: "low",
        difficulty: "low",
        howToFix: "Réduisez le title autour de 50–60 caractères.",
        beforeExample: extract.title,
      }),
    );
  }

  if (!extract.metaDescription) {
    issues.push(
      issue({
        code: "missing_meta_description",
        title: "Meta description manquante",
        why: "Sans meta description, Google génère souvent un extrait depuis le contenu visible.",
        impact: "Moins de contrôle sur le message affiché dans les résultats.",
        priority: "medium",
        effort: "low",
        difficulty: "low",
        howToFix:
          "Ajoutez une meta description unique d'environ 140–160 caractères.",
        afterExample:
          '<meta name="description" content="Audit SEO actionnable pour…">',
      }),
    );
  } else if (extract.metaDescription.length < 70) {
    issues.push(
      issue({
        code: "meta_description_too_short",
        title: "Meta description trop courte",
        why: `La description fait ${extract.metaDescription.length} caractères.`,
        impact: "Espace SERP sous-exploité, moins d'incitation au clic.",
        priority: "low",
        effort: "low",
        difficulty: "low",
        howToFix: "Enrichissez la description vers 140–160 caractères.",
        beforeExample: extract.metaDescription,
      }),
    );
  } else if (extract.metaDescription.length > 165) {
    issues.push(
      issue({
        code: "meta_description_too_long",
        title: "Meta description trop longue",
        why: `La description fait ${extract.metaDescription.length} caractères et peut être tronquée.`,
        impact: "Message marketing coupé dans les résultats de recherche.",
        priority: "low",
        effort: "low",
        difficulty: "low",
        howToFix: "Raccourcissez vers 140–160 caractères.",
        beforeExample: extract.metaDescription,
      }),
    );
  }

  if (extract.h1Count === 0) {
    const utilityUi = extract.isUtilityHomepage || extract.visibleWordCount < 120;
    issues.push(
      issue({
        code: "missing_h1",
        title: utilityUi ? "Pas de H1 (interface utilitaire)" : "Aucun H1 sur la page",
        why: utilityUi
          ? "Certaines interfaces (recherche, app) n'utilisent pas un H1 classique — ce n'est pas toujours bloquant."
          : "Le H1 structure le contenu principal pour utilisateurs et crawlers.",
        impact: utilityUi
          ? "Impact SEO souvent faible si le title et la structure sont clairs."
          : "Hiérarchie sémantique faible, sujet de page moins clair.",
        priority: utilityUi ? "low" : "high",
        effort: "low",
        difficulty: "low",
        howToFix: utilityUi
          ? "Ajoutez un H1 visible si vous transformez cette page en landing marketing."
          : "Ajoutez un unique H1 aligné avec l'intention de recherche.",
      }),
    );
  } else if (extract.h1Count > 1) {
    issues.push(
      issue({
        code: "multiple_h1",
        title: "Plusieurs H1 détectés",
        why: `La page contient ${extract.h1Count} balises H1.`,
        impact: "Signal thématique dilué ; structure moins claire.",
        priority: "medium",
        effort: "low",
        difficulty: "low",
        howToFix: "Conservez un seul H1 ; rétrogradez les autres en H2/H3.",
      }),
    );
  }

  if (!extract.hasViewport) {
    const likelyDynamicMobile =
      extract.isUtilityHomepage || extract.visibleWordCount < 80;
    issues.push(
      issue({
        code: "missing_viewport",
        title: "Meta viewport non détectée",
        why: likelyDynamicMobile
          ? "Aucune balise viewport dans le HTML initial — l'affichage mobile peut être géré par CSS/JS (à vérifier manuellement)."
          : "Sans viewport, la page est rarement mobile-friendly.",
        impact: likelyDynamicMobile
          ? "Vérifiez sur mobile réel avant de corriger."
          : "Expérience mobile dégradée ; signal mobile-first indexing.",
        priority: likelyDynamicMobile ? "medium" : "high",
        effort: "low",
        difficulty: "low",
        howToFix:
          'Ajoutez <meta name="viewport" content="width=device-width, initial-scale=1"> si absent côté rendu.',
      }),
    );
  }

  if (!extract.canonical) {
    issues.push(
      issue({
        code: "missing_canonical",
        title: "Canonical manquant",
        why: extract.isRootHomepage
          ? "Sur une homepage, le canonical est recommandé mais moins critique que sur les pages profondes."
          : "Sans canonical, les variantes d'URL peuvent diluer le ranking.",
        impact: extract.isRootHomepage
          ? "Risque modéré de duplication www/paramètres."
          : "Risque de contenu dupliqué entre variantes d'URL.",
        priority: extract.isRootHomepage ? "low" : "medium",
        effort: "low",
        difficulty: "low",
        howToFix:
          "Ajoutez un <link rel=\"canonical\"> pointant vers l'URL préférée.",
        afterExample: `<link rel="canonical" href="${extract.finalUrl}">`,
      }),
    );
  }

  if (extract.imagesWithoutAlt > 0) {
    const ratio =
      extract.imageCount > 0
        ? extract.imagesWithoutAlt / extract.imageCount
        : 0;
    const significant = extract.imagesWithoutAlt >= 3 && ratio >= 0.5;
    issues.push(
      issue({
        code: "images_missing_alt",
        title: "Images sans attribut alt",
        why: `${extract.imagesWithoutAlt}/${extract.imageCount} image(s) n'ont pas d'alt.`,
        impact: "Accessibilité et SEO image dégradés.",
        priority: significant ? "medium" : "low",
        effort: "medium",
        difficulty: "low",
        howToFix:
          "Ajoutez un alt descriptif (ou alt=\"\" si purement décoratif).",
      }),
    );
  }

  return issues;
}
