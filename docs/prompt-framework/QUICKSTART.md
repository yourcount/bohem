# Quickstart voor Nieuwe Projecten

Gebruik deze quickstart als je een nieuw websiteproject in Codex wilt starten met het superprompt-framework, zonder eerst alle frameworkdocumentatie volledig door te nemen.

Gebruik dit document wel:

- als je een nieuw project of nieuw traject wilt opstarten
- als je transcript, briefing of repo-context wilt omzetten naar een gestructureerde Codex-run
- als je consistente output wilt in `SUPER_PROMPT.md`, `PROMPT_PLAYBOOK.md` en logs

Gebruik dit document niet:

- als je alleen een bestaand frameworkdocument wilt raadplegen
- als je al midden in een actieve generator-run zit
- als je code wilt implementeren in plaats van een superprompt-run wilt starten

## Wat je minimaal klaar moet hebben

Voordat je begint, verzamel je minimaal:

- een transcript of fase-samenvatting van het vorige traject
- projectcontext: merk, doelgroep, website-doel, features, constraints
- repo-artifacts: concrete paden of artifact-categorieen
- lessons learned, gelabeld als `success`, `regression`, `misunderstanding` of `process_change`
- run metadata: datum, operator, bronproject, taal, versie

Als een onderdeel ontbreekt, mag je dat niet stil invullen. Eerst repo of transcript checken, daarna pas expliciet als aanname loggen.

## Stappenplan

1. Lees kort [`README.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/README.md) voor het input- en outputcontract.
2. Gebruik het inputtemplate hieronder en vul alle zes blokken in.
3. Kies standaard voor de v3 CLI workflow; gebruik handmatig prompt-first alleen als fallback.
4. Zet de input in een JSON-bestand op basis van `example.v3.run.json`.
5. Draai `npm run prompt:generate -- --input docs/prompt-framework/input/example.v3.run.json --diff --report`.
6. Controleer `output/run-report.md` en de snapshot-map onder `runs/`.
7. Gebruik de handmatige startprompt hieronder alleen als je bewust zonder CLI wilt werken.

## Primaire flow: v3 CLI workflow

Gebruik de CLI als standaardroute. Die valideert input, bewaakt quality gates en legt elke succesvolle run vast in snapshots.

Command:

```bash
npm run prompt:generate -- --input docs/prompt-framework/input/example.v3.run.json --diff --report
```

De CLI:

- valideert tegen `input/run.schema.json`
- voert semantische checks uit op lessons, audiences, features en repo-artifacts
- schrijft de current outputbestanden
- maakt per succesvolle run een immutable snapshot
- schrijft een `run-report.md` met quality score, warnings en diff-samenvatting

## Fallback: handmatige prompt-first flow

Gebruik deze alleen als je bewust zonder CLI wilt draaien, bijvoorbeeld om een run eerst conceptueel te verkennen.

## Copy/paste startprompt

Plak dit als eerste prompt in een nieuwe Codex-sessie:

```md
Je voert een superprompt-generator run uit voor een websiteproject.

Werk volgens deze regels:

- begin altijd met contextinventarisatie
- ga daarna pas naar planvorming
- voer nooit implementatie uit voordat context en plan expliciet gesloten zijn
- gebruik exact deze worker-volgorde:
  1. Conversation Analyst
  2. Prompt Best-Practices Researcher
  3. Website Delivery Architect
  4. QA & Risk Reviewer
  5. Documentation & Logging Worker
- gebruik exact deze gates:
  - Context Completeness Gate
  - Prompt Safety Gate
  - Delivery Readiness Gate
  - Documentation Integrity Gate
- label lessons learned verplicht als:
  - success
  - regression
  - misunderstanding
  - process_change
- doe geen stille aannames
- laat de run falen als high-impact ambiguities open blijven

Verwerk eerst het inputtemplate dat ik hierna geef.

Schrijf daarna exact deze vier outputs:

- docs/prompt-framework/output/SUPER_PROMPT.md
- docs/prompt-framework/output/PROMPT_PLAYBOOK.md
- docs/prompt-framework/output/logs/prompt-events.jsonl
- docs/prompt-framework/output/logs/decision-register.md

Claims over het project of de repo moeten herleidbaar zijn naar transcript, artifact of expliciete aanname.
```

## Copy/paste inputtemplate

Vul dit template eerst in en plak het direct onder de startprompt:

```md
## Input

### conversation_source
- type:
- bron:
- samenvatting:

### project_context
- merk:
- doelgroep:
- website-doel:
- features:
- constraints:
- tone of voice:

### repo_artifacts
- concrete paden:
- artifact-categorieen:

### lessons_learned
- [success]:
- [regression]:
- [misunderstanding]:
- [process_change]:

### open_questions
- 

### run_metadata
- date:
- operator:
- source_project:
- output_language:
- framework_version:
- template_version:

### success_criteria
- 

### scope_notes
- 
```

## Verwachte outputs

Na een complete run moeten deze artifacts bestaan:

- [`docs/prompt-framework/output/SUPER_PROMPT.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/output/SUPER_PROMPT.md)
- [`docs/prompt-framework/output/PROMPT_PLAYBOOK.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/output/PROMPT_PLAYBOOK.md)
- [`docs/prompt-framework/output/logs/prompt-events.jsonl`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/output/logs/prompt-events.jsonl)
- [`docs/prompt-framework/output/logs/decision-register.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/output/logs/decision-register.md)

## Veelgemaakte fouten

- Meteen naar uitvoering gaan zonder contextinventarisatie
- Lessons learned niet labelen
- `repo_artifacts` te vaag invullen
- Open high-impact vragen niet expliciet laten falen
- Output buiten de vaste `docs/prompt-framework/output/` paden laten landen
- `README.md` en `operator-workflow.md` niet als broncontract behandelen

## Snelle startcheck

Je bent klaar om te starten als:

- alle verplichte inputblokken zijn ingevuld
- optionele v3-blokken zoals `success_criteria` en `scope_notes` zijn bewust ingevuld of bewust leeg gelaten
- lessons learned labels aanwezig zijn
- repo-artifacts concreet genoeg zijn
- je bereid bent high-impact ambiguities te laten falen in plaats van te gokken
- je de startprompt en het inputtemplate direct kunt plakken in een nieuwe Codex-sessie

## Referentievoorbeelden

- Gebruik [`input/example.v3.run.json`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/input/example.v3.run.json) als generiek startpunt voor nieuwe projecten.
- Zie [`examples/bohem-dry-run.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/examples/bohem-dry-run.md) en [`input/bohem.run.json`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/input/bohem.run.json) als leer- en referentiecase.
- Voor een concrete Bohèm multi-worker uitvoeringsprompt, zie [`examples/bohem-multi-worker-instruction.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/examples/bohem-multi-worker-instruction.md).
