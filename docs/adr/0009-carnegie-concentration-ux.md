# ADR 0009 — Dale Carnegie tone + concentration UX

Date: 2026-07-29

## Context

Post-friction landing still spoke in our interest (« Audit SEO gratuit ») and
framed issues as failures (« manquante », « trop court »). The hero product mock
competed with the CTA for visual attention.

## Decision

1. **Carnegie copy**: visitor interest first; coach tone (opportunity, not
   condemnation); score framing with appreciation; CTA « Voir mon score ».
2. **Concentration**: one attention path — dim decorative mock; French effort /
   priority labels; progressive disclosure already in place (top 3 then rest).
3. **Issue pipeline** (`analyze` + demo): titles and why/impact rewritten for
   benefit-to-visitor language; IssueCard structure unchanged (product rule).

## Alternatives considered

- Soften only UI strings, keep harsh analyzer titles — rejected: report is where
  trust is won or lost.
- Remove hero mock entirely — rejected: atmosphere helps brand; dimming + softer
  labels is enough for v1.

## Consequences

E2e and prompt fixtures updated to new French copy. Marketing honesty preserved
(homepage checklist, not global authority).

## Follow-up (2026-07-30)

Closed post-ship findings F1/F2/F4/F7: footer + subcopy restore homepage scope;
mock moved after CTA in DOM at opacity ~0.4 without « Corriger avec l’IA »;
rise-in delays shortened + `prefers-reduced-motion`.
