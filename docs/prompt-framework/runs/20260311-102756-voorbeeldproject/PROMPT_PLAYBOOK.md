# Prompt Playbook v3

## Doel van deze versie

Deze versie scaffoldt een herhaalbare superprompt voor Voorbeeldproject op basis van een JSON-runbestand. De CLI automatiseert structuur, logging en vaste secties, maar laat projectspecifieke verfijning expliciet zichtbaar.

Projectdoel:

- Bouw een duidelijke, geloofwaardige en beheersbare website die primaire conversie ondersteunt en toekomstig beheer vereenvoudigt.

## Waarom deze keuzes zijn gemaakt

| Onderdeel | Keuze | Waarom | Bron |
| --- | --- | --- | --- |
| Inputformaat | JSON met formeel schema | Eenvoudig te valideren en scriptbaar zonder extra dependencies | ../../../../var/folders/f1/b1jgkbq14m31tzgf_vwx8nbm0000gn/T/tmp.khHqWChgiY |
| Automatisering | Scaffold + merge | Houdt output bruikbaar zonder inhoud te verzinnen | scripts/generate-superprompt.mjs |
| Outputlocaties | Vast onder docs/prompt-framework/output | Sluit aan op het frameworkcontract | docs/prompt-framework/README.md |
| Snapshot-history | Per-run snapshot naast current output | Verbetert traceability en rollback | docs/prompt-framework/V3-CLI.md |

## Lessons learned

### Success
- Kleine iteraties met expliciete acceptance criteria leverden minder correctierondes op.

### Regression
- Late kwaliteitscontrole leidde tot duurdere correcties in caching, UX en content parity.

### Misunderstanding
- Onduidelijke projectscope veroorzaakte verkeerde aannames over wat in v1 moest zitten.

### Process Change
- Een vast inputcontract en vaste outputpaden maakten de run consistenter en beter overdraagbaar.

## Wat meenemen naar volgende run

- Kleine iteraties met expliciete acceptance criteria leverden minder correctierondes op.
- Late kwaliteitscontrole leidde tot duurdere correcties in caching, UX en content parity.
- Onduidelijke projectscope veroorzaakte verkeerde aannames over wat in v1 moest zitten.
- Een vast inputcontract en vaste outputpaden maakten de run consistenter en beter overdraagbaar.

## Herbruikbare promptpatronen

- Eerst context, dan plan, dan uitvoering
- 1 feature per iteratie
- Gates zijn hard blockers
- Geen stille aannames

## Anti-patronen

- Meteen implementeren zonder gesloten context
- Repo-feiten aannemen zonder bewijs
- Open high-impact ambiguities negeren
- Output buiten vaste artifactpaden schrijven

## Updateprotocol

1. Werk het JSON-runbestand bij.
2. Draai de CLI opnieuw.
3. Vergelijk current output en diff-samenvatting.
4. Beoordeel warnings en blocking issues in het run-report.
5. Bewaar snapshot-history als audit trail.

## Diff-procedure

Vergelijk altijd:

- projectdoel
- succescriteria
- lessons learned
- gates
- assumptions policy
- outputlocaties

## Regressiepreventieregels

- Geen nieuwe default zonder bewijs uit lessons learned of testen
- Geen scope-uitbreiding zonder acceptatiecriteria
- Geen shortcut die evidence- of gate-regels verzwakt

## Revisiegeschiedenis

| Datum | Versie | Wijziging | Reden |
| --- | --- | --- | --- |
| 2026-03-11 | v3 | Workflow-output voor Voorbeeldproject | Betrouwbare CLI-run |
