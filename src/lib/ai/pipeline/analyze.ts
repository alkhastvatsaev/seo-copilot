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

/**
 * Deterministic issue detection — Dale Carnegie tone:
 * opportunity framing, visitor interest, no condemnation.
 */
export function analyzePageExtract(extract: PageExtract): AuditIssue[] {
  const issues: AuditIssue[] = [];

  if (extract.status >= 400) {
    issues.push(
      issue({
        code: "http_error",
        title: `La page répond en HTTP ${extract.status}`,
        why: "Quand la page d’accueil ne répond pas correctement, Google et vos visiteurs peinent à vous trouver.",
        impact: "Première impression et indexation à rétablir en priorité.",
        priority: "critical",
        effort: "high",
        difficulty: "high",
        howToFix:
          "Vérifiez DNS, certificat et application pour obtenir une réponse 200.",
      }),
    );
  }

  if (!extract.isHttps) {
    issues.push(
      issue({
        code: "no_https",
        title: "Passer en HTTPS pour rassurer vos visiteurs",
        why: "Les navigateurs signalent HTTP comme non sécurisé — la confiance se joue en une seconde.",
        impact: "Plus de sérénité pour vos clients et un signal positif pour Google.",
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
        title: "Titre de page à ajouter",
        why: "Le titre est ce que vos clients voient en premier dans Google — c’est votre poignée de main.",
        impact: "Sans titre, Google invente souvent un extrait moins convaincant.",
        priority: "critical",
        effort: "low",
        difficulty: "low",
        howToFix:
          "Ajoutez une balise <title> claire, unique, ~50–60 caractères.",
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
          ? "Titre marque — possible à enrichir"
          : "Titre à enrichir",
        why: shortBrandTitle
          ? `Le titre « ${extract.title} » est minimal — parfait pour une marque très connue, souvent perfectible pour attirer plus de clics.`
          : `Votre titre fait ${extract.title.length} caractères — il peut mieux raconter ce que vous offrez.`,
        impact: shortBrandTitle
          ? "Hors notoriété de marque, un peu plus de contexte aide souvent le clic."
          : "Un titre plus clair attire souvent plus de clics qualifiés.",
        priority: shortBrandTitle ? "low" : "medium",
        effort: "low",
        difficulty: "low",
        howToFix: shortBrandTitle
          ? "Enrichissez vers 50–60 caractères si vous ciblez des recherches hors marque."
          : "Élargissez vers 50–60 caractères : bénéfice + marque.",
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
        title: "Titre un peu long pour Google",
        why: `Votre titre fait ${extract.title.length} caractères — Google peut le raccourcir à l’affichage.`,
        impact: "Le message important risque d’être coupé pour vos visiteurs.",
        priority: "low",
        effort: "low",
        difficulty: "low",
        howToFix: "Visez ~50–60 caractères en gardant le bénéfice principal en tête.",
        beforeExample: extract.title,
      }),
    );
  }

  if (!extract.metaDescription) {
    issues.push(
      issue({
        code: "missing_meta_description",
        title: "Description Google à rédiger",
        why: "La meta description est votre courte invitation au clic — sans elle, Google choisit souvent un extrait au hasard.",
        impact: "Moins de contrôle sur le message qui convainc vos futurs clients.",
        priority: "medium",
        effort: "low",
        difficulty: "low",
        howToFix:
          "Ajoutez une meta description unique d’environ 140–160 caractères, centrée sur le bénéfice.",
        afterExample:
          '<meta name="description" content="Audit SEO actionnable pour…">',
      }),
    );
  } else if (extract.metaDescription.length < 70) {
    issues.push(
      issue({
        code: "meta_description_too_short",
        title: "Description à développer",
        why: `Votre description fait ${extract.metaDescription.length} caractères — vous avez de la place pour convaincre.`,
        impact: "Un extrait plus riche peut améliorer le taux de clic.",
        priority: "low",
        effort: "low",
        difficulty: "low",
        howToFix: "Enrichissez vers 140–160 caractères avec un bénéfice clair.",
        beforeExample: extract.metaDescription,
      }),
    );
  } else if (extract.metaDescription.length > 165) {
    issues.push(
      issue({
        code: "meta_description_too_long",
        title: "Description à raccourcir un peu",
        why: `Votre description fait ${extract.metaDescription.length} caractères — Google peut la tronquer.`,
        impact: "La fin du message (souvent l’appel à l’action) peut disparaître.",
        priority: "low",
        effort: "low",
        difficulty: "low",
        howToFix: "Raccourcissez vers 140–160 caractères en gardant l’essentiel.",
        beforeExample: extract.metaDescription,
      }),
    );
  }

  if (extract.h1Count === 0) {
    const utilityUi = extract.isUtilityHomepage || extract.visibleWordCount < 120;
    issues.push(
      issue({
        code: "missing_h1",
        title: utilityUi
          ? "Titre principal (H1) optionnel ici"
          : "Titre principal (H1) à clarifier",
        why: utilityUi
          ? "Certaines pages utilitaires n’utilisent pas de H1 classique — ce n’est pas forcément bloquant."
          : "Le H1 aide vos visiteurs (et Google) à comprendre le sujet en une seconde.",
        impact: utilityUi
          ? "Impact souvent faible si le title est déjà clair."
          : "Un H1 net renforce la confiance et la clarté de la page.",
        priority: utilityUi ? "low" : "high",
        effort: "low",
        difficulty: "low",
        howToFix: utilityUi
          ? "Ajoutez un H1 visible si cette page devient une landing marketing."
          : "Ajoutez un unique H1 aligné avec ce que cherchent vos clients.",
      }),
    );
  } else if (extract.h1Count > 1) {
    issues.push(
      issue({
        code: "multiple_h1",
        title: "Un seul titre principal serait plus clair",
        why: `La page contient ${extract.h1Count} balises H1 — un seul point d’ancrage aide la lecture.`,
        impact: "Le sujet principal est plus facile à saisir pour vos visiteurs.",
        priority: "medium",
        effort: "low",
        difficulty: "low",
        howToFix: "Gardez un H1 ; transformez les autres en H2/H3.",
      }),
    );
  }

  if (!extract.hasViewport) {
    const likelyDynamicMobile =
      extract.isUtilityHomepage || extract.visibleWordCount < 80;
    issues.push(
      issue({
        code: "missing_viewport",
        title: "Affichage mobile à vérifier",
        why: likelyDynamicMobile
          ? "Aucune balise viewport dans le HTML initial — le mobile peut être géré autrement (à confirmer sur téléphone)."
          : "Sans viewport, beaucoup de visiteurs mobiles voient une page difficile à lire.",
        impact: likelyDynamicMobile
          ? "Vérifiez sur mobile réel avant de changer quoi que ce soit."
          : "Une bonne expérience mobile rassure et convertit mieux.",
        priority: likelyDynamicMobile ? "medium" : "high",
        effort: "low",
        difficulty: "low",
        howToFix:
          'Ajoutez <meta name="viewport" content="width=device-width, initial-scale=1"> si elle manque au rendu.',
      }),
    );
  }

  if (!extract.canonical) {
    issues.push(
      issue({
        code: "missing_canonical",
        title: "URL de référence à indiquer",
        why: extract.isRootHomepage
          ? "Sur une homepage, le canonical est un plus — surtout si www et non-www coexistent."
          : "Le canonical dit à Google quelle version de la page compter.",
        impact: extract.isRootHomepage
          ? "Réduit le risque de confusion entre variantes d’URL."
          : "Aide à concentrer la visibilité sur la bonne URL.",
        priority: extract.isRootHomepage ? "low" : "medium",
        effort: "low",
        difficulty: "low",
        howToFix:
          'Ajoutez un <link rel="canonical"> vers l’URL que vous préférez.',
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
        title: "Textes alternatifs d’images à compléter",
        why: `${extract.imagesWithoutAlt}/${extract.imageCount} image(s) n’ont pas d’alt — utile pour l’accessibilité et la compréhension.`,
        impact: "Vos visiteurs et Google comprennent mieux le contenu visuel.",
        priority: significant ? "medium" : "low",
        effort: "medium",
        difficulty: "low",
        howToFix:
          'Ajoutez un alt descriptif (ou alt="" si l’image est purement décorative).',
      }),
    );
  }

  return issues;
}
