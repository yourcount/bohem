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
3. Start een nieuwe Codex-sessie.
4. Plak eerst de startprompt uit deze quickstart.
5. Plak daarna het ingevulde inputtemplate.
6. Laat de run pas doorgaan als de context- en plangates expliciet gesloten zijn.
7. Controleer of de outputs op de vaste paden zijn geschreven.

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

- alle zes inputblokken zijn ingevuld
- lessons learned labels aanwezig zijn
- repo-artifacts concreet genoeg zijn
- je bereid bent high-impact ambiguities te laten falen in plaats van te gokken
- je de startprompt en het inputtemplate direct kunt plakken in een nieuwe Codex-sessie

## Referentievoorbeeld

Zie [`examples/bohem-dry-run.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/examples/bohem-dry-run.md) voor een ingevulde referentierun.
