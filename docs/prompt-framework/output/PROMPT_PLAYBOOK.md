# Prompt Playbook v1

## Doel van deze versie

Deze versie vertaalt lessons learned uit het Bohèm-traject naar een herhaalbare startprompt voor volgende websiteprojecten in Codex. Het playbook voorkomt vooral drie terugkerende problemen:

- scope drift door te brede iteraties
- regressies door late kwaliteitscontroles
- verkeerde aannames over context, caching of beheerrollen

## Waarom deze keuzes zijn gemaakt

| Onderdeel | Keuze | Waarom | Bron |
| --- | --- | --- | --- |
| Worker-volgorde | Analyse -> best practices -> architectuur -> QA -> documentatie | Voorkomt implementatie voordat context en plan stabiel zijn | Bohèm correctierondes |
| Prompt-first | Geen CLI in v1 | Eerst proceskwaliteit borgen voordat tooling wordt gescript | Frameworkscope v1 |
| Quality gates | Vier vaste gates | Dwingt expliciete stopmomenten af | Security/SEO/release regressies in Bohèm |
| Logging | Markdown + JSONL | Leesbaar voor mensen, toetsbaar voor tooling later | Gevraagde defaults |

## Herbruikbare promptpatronen

- Patroon: eerst context, dan plan, dan uitvoering
  - Wanneer: altijd
  - Waarom: voorkwam in Bohèm veel verkeerde vroege implementaties

- Patroon: 1 feature per iteratie
  - Wanneer: bij design, frontend, backend en CMS-werk
  - Waarom: verkleint regressierisico en versnelt feedback

- Patroon: expliciete acceptance criteria
  - Wanneer: bij iedere substantiële wijziging
  - Waarom: maakt testen en oplevering objectiever

- Patroon: role-specific UX
  - Wanneer: als zowel eindgebruikers als beheerders bestaan
  - Waarom: editors en backend admins hebben fundamenteel andere behoeften

## Anti-patronen

- Anti-patroon: brede implementatieverzoeken in één stap uitvoeren
  - Risico: regressies, gemiste randgevallen, diffuse output

- Anti-patroon: repo-feiten aannemen zonder inspectie
  - Risico: foutieve claims, verkeerde fixes

- Anti-patroon: kwaliteitscontrole pas aan het eind
  - Risico: late, dure correctierondes

- Anti-patroon: technische defaults verbergen voor niet-technische gebruikers
  - Risico: onbegrijpelijke admin-UX en onvolledige content parity

## Updateprotocol

1. Verzamel nieuwe lessons learned uit het afgeronde project.
2. Label elk item als `success`, `regression`, `misunderstanding` of `process_change`.
3. Vergelijk `SUPER_PROMPT.md` met de vorige versie.
4. Promoveer alleen wijzigingen naar default als ze een aantoonbaar probleem oplossen.
5. Log de wijziging in decision register en JSONL.

## Diff-procedure

Vergelijk altijd:

- worker-output
- gates
- assumptions policy
- scope guards
- verificatie-eisen

Classificeer elke wijziging als:

- `clarification`
- `safety improvement`
- `regression prevention`
- `unsupported drift`

`unsupported drift` mag niet naar de defaultprompt.

## Regressiepreventieregels

- Geen nieuwe default zonder bewijs uit lessons learned of testen
- Geen scope-uitbreiding zonder acceptance criteria
- Geen shortcut die evidence-, gate- of loggingregels verzwakt
- Geen menging van editor-UX en technisch beheer zonder expliciete scheiding

## Bohèm-lessons die zijn gepromoveerd

- Mobile UX moet vroeg in de flow worden getoetst
- Content parity tussen frontend en admin moet expliciet geaudit worden
- Vercel caching en invalidatie zijn geen detail, maar een primaire releasevoorwaarde
- Security, SEO en performance moeten vaste gates krijgen, niet optionele checks

## Revisiegeschiedenis

| Datum | Versie | Wijziging | Reden |
| --- | --- | --- | --- |
| 2026-03-11 | v1 | Eerste frameworkversie op basis van Bohèm | Documentgedreven baseline |
