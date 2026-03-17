# Superprompt Generator Framework

Dit framework definieert een herhaalbare, `prompt-first` werkwijze om uit een afgerond Codex-websiteproject vier artifacts te genereren:

- `SUPER_PROMPT.md`
- `PROMPT_PLAYBOOK.md`
- `logs/prompt-events.jsonl`
- `logs/decision-register.md`

Het framework begon documentgedreven in v1. Vanaf v3 is er daarnaast een lokale workflow-CLI die input valideert, diffs samenvat, run-reports schrijft en snapshots bewaart.

## Snel starten

Voor een directe operator-ingang voor nieuwe projecten, gebruik [`QUICKSTART.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/QUICKSTART.md).
Voor een Bohèm-specifieke multi-worker uitvoeringsprompt, gebruik [`examples/bohem-multi-worker-instruction.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/examples/bohem-multi-worker-instruction.md).

## v3 CLI

Vanaf v3 kun je de framework-artifacts genereren vanuit een JSON-runbestand met schema-validatie, diff, report en snapshot-history:

```bash
npm run prompt:generate -- --input docs/prompt-framework/input/example.v3.run.json
```

De CLI:

- leest exact een JSON-bestand
- valideert tegen `input/run.schema.json`
- voert aanvullende semantische checks uit
- schrijft de current output naar `docs/prompt-framework/output/`
- maakt per succesvolle run een immutable snapshot onder `docs/prompt-framework/runs/`
- schrijft ook een `run-report.md`

Zie [`V3-CLI.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/V3-CLI.md) voor flags, exit codes en voorbeelden.

## Doel

Gebruik afgeronde website-trajecten als bronmateriaal om een decision-complete superprompt te maken die in een volgende Codex-sessie direct als eerste prompt inzetbaar is. Het framework dwingt vaste workers, quality gates, logging en een leerlus af.

## Structuur

- `QUICKSTART.md`
- `SUPER_PROMPT.template.md`
- `PROMPT_PLAYBOOK.template.md`
- `decision-register.template.md`
- `prompt-events.schema.md`
- `operator-workflow.md`
- `quality-gates.md`
- `examples/bohem-dry-run.md`
- `V3-CLI.md`
- `input/example.run.json`
- `input/example.v3.run.json`
- `input/bohem.run.json`
- `input/run.schema.json`
- `output/SUPER_PROMPT.md`
- `output/PROMPT_PLAYBOOK.md`
- `output/run-report.md`
- `output/logs/prompt-events.jsonl`
- `output/logs/decision-register.md`
- `runs/<timestamp>-<slug>/...`

## Canoniek inputcontract

Elke run moet een object of gestructureerde promptsectie bevatten met exact deze blokken:

### `conversation_source`

- Verplicht: ja
- Minimuminhoud: volledig transcript of fase-samenvatting met doelen, correctierondes en finale uitkomst
- Acceptabele bronvormen: ruwe chat-export, samenvatting per fase, linked notes, markdown digest
- Bij ontbrekende data: eerst transcriptfragmenten of repo-artefacts inspecteren; blijft er een gat over, log `assumption_added`

### `project_context`

- Verplicht: ja
- Minimuminhoud: merk, doelgroep, beoogde website, features, constraints, tone of voice
- Acceptabele bronvormen: briefing, intake, merkdocument, structured summary
- Bij ontbrekende data: markeer ontbrekende business- of UX-beslissingen als open question; niet gokken

### `repo_artifacts`

- Verplicht: ja
- Minimuminhoud: concrete paden of artifact-categorieen die de run onderbouwen
- Acceptabele bronvormen: bestandslijst, padverzameling, architecture notes, screenshots met padreferenties
- Extra regel: noem concrete paden waar mogelijk; anders minimaal categorieen zoals `frontend`, `admin`, `security`, `seo`
- Bij ontbrekende data: laat `Conversation Analyst` expliciet aangeven welke beweringen niet repo-gedekt zijn

### `lessons_learned`

- Verplicht: ja
- Minimuminhoud: minimaal 3 lessons of expliciet `none`
- Acceptabele bronvormen: postmortem, bullet list, changelog, testresultaten
- Verplichte labels per lesson: `success`, `regression`, `misunderstanding`, `process_change`
- Bij ontbrekende data: worker moet een expliciete `lessons missing` observatie loggen en aannames verbieden

### `open_questions`

- Verplicht: nee
- Minimuminhoud: lijst met onopgeloste high-impact ambiguities
- Acceptabele bronvormen: bullets, checklist, structured list
- Bij ontbrekende data: behandel als leeg, niet als “alles bekend”

### `run_metadata`

- Verplicht: ja
- Minimuminhoud: datum, operator, bronproject, gewenste outputtaal, versie
- Acceptabele bronvormen: YAML, JSON, markdown key-value, plain-language lijst
- Bij ontbrekende data: gebruik defaults en log dit als aanname

## Outputcontract

### `output/SUPER_PROMPT.md`

Verplicht:

- projectdoel en succescriteria
- persona's en gebruikersdoelen
- MVP-scope en out-of-scope
- iteratieve werkmethode met 1 feature per iteratie
- worker-definities en outputformaten
- validatiegates voor UX, SEO, security, performance en a11y
- logging- en documentatieverplichtingen
- retrospective-lus
- aannameslijst
- anti-hallucinatie-regels
- expliciete stopregel: eerst context, dan plan, dan uitvoering

### `output/PROMPT_PLAYBOOK.md`

Verplicht:

- waarom keuzes in de superprompt zijn gemaakt
- herbruikbare promptpatronen
- anti-patronen
- updateprotocol
- regressiepreventieregels
- diff-procedure ten opzichte van vorige promptversie

### `output/logs/decision-register.md`

Per besluit verplicht:

- datum
- besluit
- alternatieven
- reden
- impact
- revisietrigger

### `output/logs/prompt-events.jsonl`

Per event verplicht:

- `timestamp`
- `worker`
- `event_type`
- `summary`
- `artifact_ref`
- `confidence`

Toegestane `event_type` waarden:

- `context_extracted`
- `assumption_added`
- `decision_made`
- `risk_flagged`
- `gate_passed`
- `gate_failed`
- `prompt_revised`

## Defaults

- Locatie: `docs/prompt-framework/`
- Modus: `prompt-first workflow`
- Taal: Nederlands voor rapportage; Engelse keys en labels waar structureel nuttig
- Logging: Markdown + JSONL
- Uitvoeringsmodel: Codex-only workers binnen een gesprek
- Geen automatische codewijzigingen in v1
- Nooit gokken bij ontbrekende informatie; eerst inspecteren, daarna expliciet aannemen

## Gebruik

1. Lees `operator-workflow.md`.
2. Vul het inputcontract aan met transcript, context, repo-artifacts en lessons learned.
3. Run de vijf workers in vaste volgorde.
4. Laat elke gate expliciet `pass` of `fail` opleveren.
5. Schrijf de definitieve artifacts naar `output/`.
6. Beoordeel `run-report.md` en diff-samenvatting.
7. Vergelijk een nieuwe run met de vorige versie via het playbook updateprotocol.

De generator is generiek. `example.v3.run.json` is het primaire startpunt voor nieuwe projecten. `bohem.run.json` en `examples/bohem-dry-run.md` zijn referentiecases om van te leren, niet de default voor nieuwe projecten.
