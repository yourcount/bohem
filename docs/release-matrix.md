# Release Matrix (Bohèm)

Gebruik deze matrix als verplichte pre-release check voor iedere productie-deploy.

## Browsers

- Chrome (laatste stabiele versie, desktop)
- Firefox (laatste stabiele versie, desktop)
- Edge (laatste stabiele versie, desktop)
- Safari macOS (laatste + vorige major)
- Safari iOS (laatste + vorige major)
- Chrome Android (laatste stabiele versie)

## Viewports

- Mobiel: 390 x 844
- Tablet: 768 x 1024
- Desktop: 1440 x 900

## Kritieke flows

- Homepage render + sectie-overgangen
- Menu anchors (Bio, Discografie, Shows, Kampvuurklanken, Boekingen, Contact)
- Contactformulier verzenden (desktop + mobiel)
- Admin login/logout
- Content editor laden + opslaan
- Media upload/verwijderen vanuit bibliotheek

## Acceptatiecriteria

- Geen console errors of uncaught exceptions
- Geen gebroken layout of overlap bij 200% zoom
- Toetsenbordnavigatie werkt (zichtbare focus)
- CTA-links werken en landen op juiste sectie
- Geen regressie op LCP/CLS (LCP mobiel < 2.8s streef, CLS < 0.1)
