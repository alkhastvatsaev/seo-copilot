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

function pageScopedId(code: string, extract: PageExtract): string {
  try {
    const path = new URL(extract.finalUrl).pathname || "/";
    if (path === "/" || extract.isRootHomepage) return code;
    return `${code}:${path}`;
  } catch {
    return code;
  }
}

/**
 * Deterministic on-page issue detection — opportunity framing, SPA-aware.
 */
export function analyzePageExtract(extract: PageExtract): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const spa = extract.isLikelySpaShell;
  const utility = extract.isUtilityHomepage;
  const softShell = spa || utility;

  if (extract.status >= 400) {
    issues.push(
      issue({
        id: pageScopedId("http_error", extract),
        code: "http_error",
        title: `La page répond en HTTP ${extract.status}`,
        why: "Quand la page ne répond pas correctement, Google et vos visiteurs peinent à vous trouver.",
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
        id: pageScopedId("no_https", extract),
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

  const robots = extract.robotsMeta?.toLowerCase() ?? "";
  if (robots.includes("noindex")) {
    issues.push(
      issue({
        id: pageScopedId("meta_noindex", extract),
        code: "meta_noindex",
        title: "Page marquée noindex",
        why: "La balise robots indique noindex — Google ne devrait pas afficher cette page dans les résultats.",
        impact: "Aucune visibilité organique tant que noindex reste actif.",
        priority: extract.isRootHomepage ? "critical" : "high",
        effort: "low",
        difficulty: "low",
        howToFix:
          'Retirez noindex de <meta name="robots"> si cette page doit être trouvée.',
        beforeExample: extract.robotsMeta ?? undefined,
      }),
    );
  }

  if (!extract.title) {
    issues.push(
      issue({
        id: pageScopedId("missing_title", extract),
        code: "missing_title",
        title: "Titre de page à ajouter",
        why: "Le titre est ce que vos clients voient en premier dans Google — c’est votre poignée de main.",
        impact: "Sans titre, Google invente souvent un extrait moins convaincant.",
        priority: "critical",
        effort: "low",
        difficulty: "low",
        howToFix:
          "Ajoutez une balise <title> claire, unique, ~50–60 caractères.",
        afterExample: "<title>Agence SEO à Lyon | Nom de marque</title>",
      }),
    );
  } else if (extract.title.length < 30) {
    const shortBrandTitle =
      extract.title.length <= 20 && !extract.title.includes("|");
    issues.push(
      issue({
        id: pageScopedId("title_too_short", extract),
        code: "title_too_short",
        title: shortBrandTitle
          ? "Titre marque — possible à enrichir"
          : "Titre à enrichir",
        why: shortBrandTitle
          ? `Le titre « ${extract.title} » est minimal — utile pour une marque connue, souvent perfectible hors marque.`
          : `Votre titre fait ${extract.title.length} caractères — il peut mieux raconter ce que vous offrez.`,
        impact: "Un titre plus clair attire souvent plus de clics qualifiés.",
        priority: shortBrandTitle || utility ? "low" : "medium",
        effort: "low",
        difficulty: "low",
        howToFix: "Élargissez vers 50–60 caractères : bénéfice + marque.",
        beforeExample: extract.title,
      }),
    );
  } else if (extract.title.length > 65) {
    issues.push(
      issue({
        id: pageScopedId("title_too_long", extract),
        code: "title_too_long",
        title: "Titre un peu long pour Google",
        why: `Votre titre fait ${extract.title.length} caractères — Google peut le raccourcir.`,
        impact: "Le message important risque d’être coupé.",
        priority: "low",
        effort: "low",
        difficulty: "low",
        howToFix: "Visez ~50–60 caractères.",
        beforeExample: extract.title,
      }),
    );
  }

  if (!extract.metaDescription) {
    issues.push(
      issue({
        id: pageScopedId("missing_meta_description", extract),
        code: "missing_meta_description",
        title: "Description Google à rédiger",
        why: "La meta description est votre courte invitation au clic.",
        impact: "Moins de contrôle sur le message qui convainc vos futurs clients.",
        priority: utility ? "low" : "medium",
        effort: "low",
        difficulty: "low",
        howToFix:
          "Ajoutez une meta description unique d’environ 140–160 caractères.",
      }),
    );
  } else if (extract.metaDescription.length < 70) {
    issues.push(
      issue({
        id: pageScopedId("meta_description_too_short", extract),
        code: "meta_description_too_short",
        title: "Description à développer",
        why: `Votre description fait ${extract.metaDescription.length} caractères.`,
        impact: "Un extrait plus riche peut améliorer le taux de clic.",
        priority: "low",
        effort: "low",
        difficulty: "low",
        howToFix: "Enrichissez vers 140–160 caractères.",
        beforeExample: extract.metaDescription,
      }),
    );
  } else if (extract.metaDescription.length > 165) {
    issues.push(
      issue({
        id: pageScopedId("meta_description_too_long", extract),
        code: "meta_description_too_long",
        title: "Description à raccourcir un peu",
        why: `Votre description fait ${extract.metaDescription.length} caractères.`,
        impact: "La fin du message peut disparaître dans Google.",
        priority: "low",
        effort: "low",
        difficulty: "low",
        howToFix: "Raccourcissez vers 140–160 caractères.",
        beforeExample: extract.metaDescription,
      }),
    );
  }

  if (extract.h1Count === 0) {
    issues.push(
      issue({
        id: pageScopedId("missing_h1", extract),
        code: "missing_h1",
        title: softShell
          ? "Titre principal (H1) optionnel ici"
          : "Titre principal (H1) à clarifier",
        why: softShell
          ? "Shell JS / interface utilitaire : le H1 peut être injecté côté client — à confirmer sur le rendu réel."
          : "Le H1 aide vos visiteurs (et Google) à comprendre le sujet en une seconde.",
        impact: softShell
          ? "Impact souvent faible si le title est clair ; vérifiez le HTML rendu."
          : "Un H1 net renforce la clarté de la page.",
        priority: softShell ? "low" : "high",
        effort: "low",
        difficulty: "low",
        howToFix: softShell
          ? "Assurez-vous qu’un H1 unique apparaît dans le HTML rendu (SSR ou crawlable)."
          : "Ajoutez un unique H1 aligné avec ce que cherchent vos clients.",
      }),
    );
  } else if (extract.h1Count > 1) {
    issues.push(
      issue({
        id: pageScopedId("multiple_h1", extract),
        code: "multiple_h1",
        title: "Un seul titre principal serait plus clair",
        why: `La page contient ${extract.h1Count} balises H1.`,
        impact: "Le sujet principal est plus facile à saisir avec un seul H1.",
        priority: "medium",
        effort: "low",
        difficulty: "low",
        howToFix: "Gardez un H1 ; transformez les autres en H2/H3.",
      }),
    );
  }

  if (
    !softShell &&
    extract.h1Count === 1 &&
    extract.h2Count === 0 &&
    extract.visibleWordCount > 200
  ) {
    issues.push(
      issue({
        id: pageScopedId("weak_heading_structure", extract),
        code: "weak_heading_structure",
        title: "Structurer le contenu avec des H2",
        why: "Beaucoup de texte sans sous-titres H2 — la lecture et le crawl y gagnent avec une hiérarchie claire.",
        impact: "Meilleure compréhension thématique et expérience de lecture.",
        priority: "low",
        effort: "medium",
        difficulty: "low",
        howToFix: "Ajoutez des H2 qui découpent les sections importantes.",
      }),
    );
  }

  if (!extract.hasViewport) {
    issues.push(
      issue({
        id: pageScopedId("missing_viewport", extract),
        code: "missing_viewport",
        title: "Affichage mobile à vérifier",
        why: softShell
          ? "Aucune balise viewport dans le HTML initial — souvent injectée au rendu SPA."
          : "Sans viewport, beaucoup de visiteurs mobiles voient une page difficile à lire.",
        impact: softShell
          ? "Vérifiez sur mobile réel avant de conclure."
          : "Une bonne expérience mobile rassure et convertit mieux.",
        priority: softShell ? "low" : "high",
        effort: "low",
        difficulty: "low",
        howToFix:
          'Ajoutez <meta name="viewport" content="width=device-width, initial-scale=1"> dans le HTML servi.',
      }),
    );
  }

  if (!extract.canonical) {
    issues.push(
      issue({
        id: pageScopedId("missing_canonical", extract),
        code: "missing_canonical",
        title: "URL de référence à indiquer",
        why: extract.isRootHomepage
          ? "Sur une homepage, le canonical aide si www et non-www coexistent."
          : "Le canonical dit à Google quelle version de la page compter.",
        impact: "Aide à concentrer la visibilité sur la bonne URL.",
        priority: extract.isRootHomepage ? "low" : "medium",
        effort: "low",
        difficulty: "low",
        howToFix: 'Ajoutez un <link rel="canonical"> vers l’URL préférée.',
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
        id: pageScopedId("images_missing_alt", extract),
        code: "images_missing_alt",
        title: "Textes alternatifs d’images à compléter",
        why: `${extract.imagesWithoutAlt}/${extract.imageCount} image(s) sans alt.`,
        impact: "Accessibilité et compréhension du contenu visuel.",
        priority: significant ? "medium" : "low",
        effort: "medium",
        difficulty: "low",
        howToFix: 'Ajoutez un alt descriptif (ou alt="" si décoratif).',
      }),
    );
  }

  if (!extract.htmlLang) {
    issues.push(
      issue({
        id: pageScopedId("missing_html_lang", extract),
        code: "missing_html_lang",
        title: "Langue de la page à déclarer",
        why: "L’attribut lang sur <html> aide navigateurs et Google à traiter la bonne langue.",
        impact: "Meilleure accessibilité et ciblage linguistique.",
        priority: "medium",
        effort: "low",
        difficulty: "low",
        howToFix: '<html lang="fr"> (ou la langue de votre audience).',
      }),
    );
  }

  if (!extract.ogTitle || !extract.ogDescription || !extract.ogImage) {
    if (!utility) {
      const missing = [
        !extract.ogTitle ? "og:title" : null,
        !extract.ogDescription ? "og:description" : null,
        !extract.ogImage ? "og:image" : null,
      ].filter(Boolean);
      issues.push(
        issue({
          id: pageScopedId("incomplete_open_graph", extract),
          code: "incomplete_open_graph",
          title: "Aperçu social (Open Graph) à compléter",
          why: `Il manque : ${missing.join(", ")} — LinkedIn, Slack, iMessage s’en servent pour l’aperçu.`,
          impact: "Partages moins convaincants, moins de clics depuis les réseaux.",
          priority: extract.isRootHomepage ? "medium" : "low",
          effort: "low",
          difficulty: "low",
          howToFix:
            "Ajoutez og:title, og:description et og:image (image ≥ 1200×630 idéalement).",
        }),
      );
    }
  }

  if (!extract.twitterCard && extract.isRootHomepage && !utility) {
    issues.push(
      issue({
        id: pageScopedId("missing_twitter_card", extract),
        code: "missing_twitter_card",
        title: "Carte Twitter/X à déclarer",
        why: "Sans twitter:card, l’aperçu sur X est souvent moins riche.",
        impact: "Partages X moins attractifs.",
        priority: "low",
        effort: "low",
        difficulty: "low",
        howToFix: '<meta name="twitter:card" content="summary_large_image">',
      }),
    );
  }

  if (extract.jsonLdBlockCount === 0 && !utility) {
    issues.push(
      issue({
        id: pageScopedId("missing_json_ld", extract),
        code: "missing_json_ld",
        title: "Données structurées (JSON-LD) à ajouter",
        why: "Organization, WebSite ou Article aident Google à comprendre l’entité derrière la page.",
        impact: "Éligibilité accrue aux résultats enrichis (selon le type).",
        priority: extract.isRootHomepage ? "medium" : "low",
        effort: "medium",
        difficulty: "medium",
        howToFix:
          "Ajoutez un script type=\"application/ld+json\" (Organization / WebSite au minimum).",
      }),
    );
  }

  if (
    !softShell &&
    extract.isRootHomepage &&
    extract.visibleWordCount < 120
  ) {
    issues.push(
      issue({
        id: pageScopedId("thin_content", extract),
        code: "thin_content",
        title: "Contenu d’accueil un peu mince",
        why: `Seulement ~${extract.visibleWordCount} mots visibles dans le HTML — peu de matière pour rassurer et ranker.`,
        impact: "Moins de signaux thématiques et de confiance pour les visiteurs.",
        priority: "high",
        effort: "high",
        difficulty: "medium",
        howToFix:
          "Enrichissez la homepage : proposition de valeur, preuves, services, FAQ.",
      }),
    );
  } else if (spa && extract.isRootHomepage) {
    issues.push(
      issue({
        id: pageScopedId("spa_shell_thin_html", extract),
        code: "spa_shell_thin_html",
        title: "HTML initial très léger (SPA)",
        why: `Le HTML servi contient peu de texte (~${extract.visibleWordCount} mots) — Google voit surtout une coquille JS.`,
        impact: "Indexation et aperçus moins fiables sans SSR ou prérendu.",
        priority: "high",
        effort: "high",
        difficulty: "high",
        howToFix:
          "Activez SSR/SSG ou un prérendu des balises et du contenu critique.",
      }),
    );
  }

  if (
    extract.isRootHomepage &&
    !utility &&
    extract.internalLinkCount < 3
  ) {
    issues.push(
      issue({
        id: pageScopedId("few_internal_links", extract),
        code: "few_internal_links",
        title: "Peu de liens internes depuis l’accueil",
        why: `Seulement ${extract.internalLinkCount} lien(s) interne(s) détecté(s) — le maillage aide le crawl et la découverte.`,
        impact: "Pages profondes plus difficiles à découvrir et à renforcer.",
        priority: "medium",
        effort: "medium",
        difficulty: "low",
        howToFix:
          "Ajoutez des liens clairs vers services, blog, contact, pages clés.",
      }),
    );
  }

  return issues;
}

/** Site-level issues across crawled pages (duplicates, etc.). */
export function analyzeSiteExtracts(pages: PageExtract[]): AuditIssue[] {
  if (pages.length < 2) return [];

  const issues: AuditIssue[] = [];
  const titles = new Map<string, string[]>();

  for (const page of pages) {
    if (!page.title) continue;
    const key = page.title.trim().toLowerCase();
    const list = titles.get(key) ?? [];
    list.push(page.finalUrl);
    titles.set(key, list);
  }

  for (const [title, urls] of titles) {
    if (urls.length < 2) continue;
    issues.push(
      issue({
        id: `duplicate_title:${title.slice(0, 40)}`,
        code: "duplicate_title",
        title: "Titres de page en double",
        why: `Le titre « ${title} » apparaît sur ${urls.length} pages crawlées.`,
        impact: "Google peine à différencier les pages dans les résultats.",
        priority: "high",
        effort: "medium",
        difficulty: "low",
        howToFix: "Donnez un title unique à chaque URL importante.",
        beforeExample: urls.slice(0, 3).join("\n"),
      }),
    );
  }

  return issues;
}

/**
 * Lightweight checks for secondary URLs in the sample (avoid SPA shell noise).
 */
export function analyzeSecondaryPage(extract: PageExtract): AuditIssue[] {
  const issues: AuditIssue[] = [];
  if (!extract.title) {
    issues.push(
      issue({
        id: pageScopedId("missing_title", extract),
        code: "missing_title",
        title: "Titre manquant sur une page du site",
        why: `Pas de <title> sur ${extract.finalUrl}.`,
        impact: "Page difficile à identifier dans les résultats.",
        priority: "medium",
        effort: "low",
        difficulty: "low",
        howToFix: "Ajoutez un title unique et descriptif.",
      }),
    );
  }
  if (extract.status >= 400) {
    issues.push(
      issue({
        id: pageScopedId("http_error", extract),
        code: "http_error",
        title: `Page en erreur HTTP ${extract.status}`,
        why: `${extract.finalUrl} ne répond pas correctement.`,
        impact: "Mauvaise expérience et budget de crawl gaspillé.",
        priority: "high",
        effort: "medium",
        difficulty: "medium",
        howToFix: "Corrigez ou retirez le lien vers cette URL.",
      }),
    );
  }
  return issues;
}
