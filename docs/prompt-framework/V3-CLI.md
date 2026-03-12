# V3 CLI

De v3 CLI maakt van het prompt-framework een betrouwbare workflow-tool. De generator blijft generiek en JSON-first, maar voegt nu schema-validatie, diff-samenvattingen, quality scoring en snapshot-history toe.

## Commando

```bash
npm run prompt:generate -- --input docs/prompt-framework/input/example.v3.run.json
```

## Flags

- `--input <path>`
  Verplicht. Pad naar het JSON-runbestand.
- `--dry-run`
  Rendert alles in geheugen, toont diff/report in stdout en schrijft niets weg.
- `--diff`
  Toont per artifact of het `created`, `changed` of `unchanged` is ten opzichte van de huidige output.
- `--snapshot`
  Optionele expliciete bevestiging. In v3 zijn snapshots standaard al actief; de flag verandert het gedrag niet.
- `--report`
  Print het volledige run-report ook naar stdout. Het reportbestand wordt bij een succesvolle run sowieso geschreven.
- `--strict`
  Faalt niet alleen op blocking validation issues, maar ook op quality warnings.

## Exit codes

- `0`
  Run geslaagd.
- `1`
  Blocking validation failure.
- `2`
  Strict mode failure door warnings.
- `3`
  Write- of runtime failure.

## Validatie

De CLI valideert in drie lagen:

1. Schema-validatie via [`input/run.schema.json`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/input/run.schema.json)
2. Semantische validatie
3. Quality scoring

### Blocking failures

- schemafouten
- ontbrekende verplichte root keys
- ongeldige lesson labels
- minder dan 3 lessons learned
- geen audiences
- geen features
- geen repo path of categorie

### Quality warnings

- `success_criteria` ontbreekt
- placeholders blijven zichtbaar in output
- `open_questions` bevat nog items

## Outputgedrag

### Current output

Bij een succesvolle run schrijft de CLI:

- [`output/SUPER_PROMPT.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/output/SUPER_PROMPT.md)
- [`output/PROMPT_PLAYBOOK.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/output/PROMPT_PLAYBOOK.md)
- [`output/run-report.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/output/run-report.md)
- [`output/logs/decision-register.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/output/logs/decision-register.md)
- [`output/logs/prompt-events.jsonl`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/output/logs/prompt-events.jsonl)

### Snapshot-history

Elke succesvolle niet-dry-run maakt ook een immutable snapshot:

```text
docs/prompt-framework/runs/<timestamp>-<slug>/
```

Met daarin:

- `SUPER_PROMPT.md`
- `PROMPT_PLAYBOOK.md`
- `run-report.md`
- `input.json`
- `logs/decision-register.md`
- `logs/prompt-events.jsonl`

## Voorbeelden

Normale run:

```bash
npm run prompt:generate -- --input docs/prompt-framework/input/example.v3.run.json
```

Run met diff en report:

```bash
npm run prompt:generate -- --input docs/prompt-framework/input/example.v3.run.json --diff --report
```

Dry run zonder writes:

```bash
npm run prompt:generate -- --input docs/prompt-framework/input/example.v3.run.json --dry-run --diff --report
```

Strikte run:

```bash
npm run prompt:generate -- --input docs/prompt-framework/input/example.v3.run.json --strict
```

## Reportgedrag

Het run-report bevat:

- run metadata
- input summary
- validation result
- quality score
- blocking issues
- warnings
- placeholder count per artifact
- open ambiguities count
- generated files
- current-versus-previous summary

## Gebruikssuggestie

Voor nieuwe projecten:

1. kopieer [`input/example.v3.run.json`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/input/example.v3.run.json)
2. vul het bestand projectspecifiek in
3. draai de CLI met `--diff --report`
4. beoordeel `run-report.md`
5. gebruik Bohèm alleen als referentiecase, niet als default
