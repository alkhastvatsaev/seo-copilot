/** Minimal search homepage (utility UI, no classic marketing H1). */
export const googleLikeHomepageHtml = `<!doctype html>
<html itemscope itemtype="http://schema.org/WebPage" lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Google</title>
  </head>
  <body>
    <form action="/search" method="get">
      <input name="q" type="search" aria-label="Rechercher" />
    </form>
    <img src="/logo.png" />
  </body>
</html>`;
