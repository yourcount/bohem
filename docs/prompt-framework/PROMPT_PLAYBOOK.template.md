# Prompt Playbook Template

## Doel van deze versie

- Welke projectklasse de superprompt afdekt
- Welke problemen uit eerdere trajecten hiermee worden voorkomen

## Keuzeverantwoording

| Onderdeel | Keuze | Waarom | Bron |
| --- | --- | --- | --- |
| Worker-volgorde |  |  |  |
| Gates |  |  |  |
| Logging |  |  |  |
| Scope-aanpak |  |  |  |

## Herbruikbare promptpatronen

- Patroon:
- Wanneer toepassen:
- Waarom het werkt:
- Valkuilen:

## Anti-patronen

- Anti-patroon:
- Signaal:
- Risico:
- Correctie:

## Updateprotocol

1. Verzamel nieuwe lessons learned.
2. Vergelijk huidige artifacts met vorige run.
3. Beoordeel of de wijziging een meetbaar probleem oplost.
4. Werk template, playbook en decision register synchroon bij.
5. Log de revisie als `prompt_revised`.

## Diff-procedure

- Vergelijk `SUPER_PROMPT.md` tegen vorige versie op:
  - scope
  - worker-output
  - gates
  - assumptions policy
  - logging requirements
- Markeer elke wijziging als:
  - `clarification`
  - `safety improvement`
  - `regression prevention`
  - `unsupported drift`

## Regressiepreventie

- Geen nieuwe default zonder bewijs uit lessons learned of testresultaten.
- Geen scope-uitbreiding zonder acceptatiecriteria.
- Geen shortcut die evidence- of gate-regels verzwakt.

## Revisiegeschiedenis

| Datum | Versie | Wijziging | Reden |
| --- | --- | --- | --- |
|  |  |  |  |
