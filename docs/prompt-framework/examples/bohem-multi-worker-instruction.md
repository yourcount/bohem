# Bohèm Multi-Worker Instructie

Dit document bevat een direct uitvoerbare, Bohèm-specifieke multi-worker prompt voor een volledige content parity en conversie-audit. De instructie sluit aan op de huidige repo-opzet en verdeelt het werk over duidelijke domeinen met minimale overlap: frontend, contentflow, editor/CMS, contact/conversie en performance/SEO-validatie.

Gebruik dit document:

- als je meerdere workers parallel op de Bohèm-repo wilt laten werken
- als je parity, editorbeheer en conversieflow tegelijk wilt beoordelen
- als je high-impact fixes wilt doorvoeren zonder de scope open te trekken

Gebruik dit document niet:

- als je een generieke superprompt-run voor een nieuw project wilt starten
- als je alleen een losse bug of een enkel component wilt laten onderzoeken
- als je een open-ended redesign wilt zonder duidelijke P1/P2-scope

## Copy/paste prompt

```text
Je werkt in de Bohèm-website repo. Voer een volledige content parity en conversie-audit uit met meerdere workers in parallel.

Doel:
- alle zichtbare frontend-content moet correct renderen
- alle relevante zichtbare content moet beheerbaar zijn in `/admin`
- mobiel en desktop moeten logisch en frictieloos werken
- high-impact fouten in contentflow, editor en contactflow moeten worden opgelost
- wijzigingen mogen geen regressie geven in performance, SEO of structured data

Werkwijze:
- werk in 3 golven: explorers, implementatie, validatie
- eerst analyseren, dan pas wijzigen
- alleen P1/P2 issues oplossen
- geen feature creep
- behoud bestaande visuele richting en merktoon
- server-side validatie blijft leidend
- noteer aannames expliciet
- geen worker mag andermans wijzigingen terugdraaien
- geef elke worker een duidelijke ownership-scope
- integreer centraal en voer pas daarna finale verificatie uit

## Golf 1 - Parallelle Explorers

Spawn 3 explorers parallel.

### Worker 1: Frontend Explorer
Taak:
- inventariseer alle zichtbare secties, CTA's, lege-blokregels en mobiele fricties
- lever een compacte parity/UX-matrix op
- noem per item:
  - element
  - locatie
  - zichtbaarheid/voorwaarde
  - opvallend gedrag of risico

Ownership:
- `app/page.tsx`
- `components/sections/*`
- `components/ui/*`

Output:
- korte frontend-matrix
- top P1/P2 frontend issues
- lijst met lege-blok/conditional rendering regels

### Worker 2: Content Flow Explorer
Taak:
- analyseer hoe content van bron naar frontend loopt
- breng per belangrijk frontend-element in kaart:
  - databron
  - sanitizing
  - storage-pad
  - fallback-gedrag
  - cache/revalidate gedrag
- markeer mismatch-risico's tussen baseline content, full-site content, editor-content en runtime-output

Ownership:
- `lib/content/live-content.ts`
- `lib/content/sanitize-site-content.ts`
- `lib/content/editor-content-contract.ts`
- `lib/content/full-content-contract.ts`
- `lib/db/full-site-content-db.ts`
- `lib/db/content-db.ts`
- `lib/cache/*`

Output:
- contentflow-overzicht
- parity-risico's
- concrete P1/P2 mismatch-kandidaten

### Worker 3: Performance / SEO Explorer
Taak:
- controleer regressierisico's in:
  - hero/LCP
  - metadata
  - structured data
  - sitemap/robots
  - social preview basis
  - third-party impact
- lever bevindingen en alleen kleine, veilige fix-kandidaten terug
- voer geen brede refactors uit

Ownership:
- `next.config.ts`
- `app/layout.tsx`
- `app/sitemap.ts`
- `app/robots.ts`
- `lib/seo.ts`
- `lib/seo-settings.ts`

Output:
- performance/SEO bevindingen
- kleine veilige fix-kandidaten
- regressierisico's voor live site

## Golf 2 - Lokale hoofdtaak + gerichte workers

Terwijl de explorers draaien:
- lees en beoordeel:
  - `app/admin/page.tsx`
  - `components/admin/ContentEditorForm.tsx`
  - `app/api/content/admin/editor-full/route.ts`
- vorm een eigen oordeel over editor parity en niet-technische UX

Na ontvangst van de explorer-uitkomsten:
- consolideer alle P1/P2 issues
- verwijder overlap
- start maximaal 2 workers voor implementatie

### Worker 4: Editor Worker
Taak:
- voer alleen high-impact parity- en UX-fixes door in de content editor
- doel:
  - alle relevante zichtbare frontend-content moet beheerbaar zijn in `/admin`
  - dode/irrelevante velden moeten verdwijnen
  - labels, hulpteksten en foutmeldingen moeten begrijpelijk zijn voor niet-technische editors
- behoud bestaande functionaliteit
- verander geen technische backend-scope

Ownership:
- `app/admin/page.tsx`
- `components/admin/ContentEditorForm.tsx`
- `app/api/content/admin/editor-full/route.ts`

Output:
- doorgevoerde editor fixes
- lijst van opgeloste parity-gaten
- eventuele resterende editor-risico's

### Worker 5: Contact Worker
Taak:
- audit en verbeter alleen de contactflow op mobiel en desktop
- focus op:
  - formulierstappen
  - Turnstile gedrag
  - fout/succesmeldingen
  - submit UX
  - regressievrije validatie
  - zichtbare mailtemplate-regressies indien relevant
- voer alleen high-impact fixes door

Ownership:
- `components/sections/ContactSection.tsx`
- `app/api/contact/route.ts`

Output:
- doorgevoerde contactflow fixes
- resterende risico's
- expliciete check op mobiel gedrag

## Golf 3 - Validatie

Spawn 1 validatie-explorer nadat implementatiewerk gereed is.

### Worker 6: QA Explorer
Taak:
- valideer de doorgevoerde wijzigingen end-to-end
- controleer:
  - frontend parity
  - admin parity
  - contactflow
  - lege-blokregels
  - zichtbare regressies
- rapporteer alleen concrete bevindingen met pad en korte impactinschatting
- doe geen codewijzigingen

Ownership:
- `app/page.tsx`
- `components/sections/*`
- `components/admin/*`
- `app/api/content/admin/editor-full/route.ts`
- `app/api/contact/route.ts`

Output:
- pass/fail per flow
- concrete regressies
- resterende P1/P2 issues

## Centrale integratieverantwoordelijkheid

De hoofdagent doet:
- consolidatie van explorer-uitkomsten
- keuze welke P1/P2 fixes echt worden uitgevoerd
- integratie van worker-output
- finale checks:
  - build
  - relevante smoke checks
  - parity-check frontend versus admin
  - contact submit flow
- samenvatting van:
  - bevindingen
  - doorgevoerde fixes
  - resterende risico's

## Verwachte eindoutput

Lever uiteindelijk op:

1. Korte parity matrix
2. P1/P2 issue-lijst
3. Doorgevoerde fixes
4. Validatie-resultaat voor:
- frontend
- admin/editor
- contactflow
- performance/SEO basis
5. Resterende risico's of backlog

## Belangrijke grenzen

- los geen P3/polish op tenzij het direct nodig is om een P1/P2 correct af te ronden
- verander geen repo-brede architectuur tenzij dat noodzakelijk is voor een concrete bugfix
- verwijder geen bestaande functionaliteit zonder expliciete onderbouwing
- houd wijzigingen backward compatible waar redelijk mogelijk
- respecteer bestaande merktoon, structuur en contentlogica
```

## Belangrijke interfaces en defaults

- `Explorer` workers: read-only analyse, geen codewijzigingen
- `Worker` workers: alleen binnen expliciete ownership-scope wijzigen
- centrale agent blijft eigenaar van integratie, finale tests en commit-strategie
- default prioriteit: parity en conversie eerst, daarna performance/SEO-validatie

## Testgevallen

- Frontend zichtbaar item heeft een admin-tegenhanger of bewust gedocumenteerde uitzondering
- Lege content verbergt CTA/blokken correct op frontend
- Mobiel contactformulier behoudt stapstatus en toont meldingen logisch
- Editor-save komt correct door op frontend
- Geen regressie in metadata, sitemap, robots of structured data basis
- Build slaagt

## Aannames

- Deze prompt is Bohèm-specifiek en bedoeld voor de huidige repo
- De uitvoerder heeft beschikking over sub-agents/workers
- De gewenste scope is audit + high-impact fixes, niet een open-ended redesign
