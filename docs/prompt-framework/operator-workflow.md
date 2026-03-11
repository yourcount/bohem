# Operator Workflow

Dit document beschrijft de enige toegestane v1-run voor de superprompt-generator.

Voor nieuwe runs begint de operator praktisch in [`QUICKSTART.md`](/Users/Tijmen/Documents/bohem/docs/prompt-framework/QUICKSTART.md); dit document blijft het procescontract.

## Werkmodus

- `prompt-first`
- geen scripts
- geen file-generatie buiten de vastgelegde outputlocaties
- een run eindigt pas als alle vier de artifacts zijn geschreven of een gate expliciet faalt

## Stappen

### 1. Input verzamelen

Verzamel voor de run:

- `conversation_source`
- `project_context`
- `repo_artifacts`
- `lessons_learned`
- `open_questions`
- `run_metadata`

Gebruik de definities uit `README.md`.

## 2. Contextinventarisatie

Laat `Conversation Analyst` eerst:

- doelen extraheren
- constraints extraheren
- impliciete voorkeuren benoemen
- misverstanden en correcties samenvatten
- lessons learned labelen
- open ambiguities en confidence vastleggen

Log minimaal:

- 1 `context_extracted`
- 0 of meer `assumption_added`
- `gate_passed` of `gate_failed` voor `Context Completeness Gate`

## 3. Promptontwerp

Laat `Prompt Best-Practices Researcher`:

- promptprincipes selecteren
- anti-hallucinatiepatronen vastleggen
- verificatie- en bewijsregels vastleggen
- outputstructuur onderbouwen

Daarna laat `Website Delivery Architect`:

- fasering bepalen
- scope guards vastleggen
- acceptance criteria definiëren
- artifactcontract bevestigen
- failure modes uitwerken

Log minimaal:

- 1 `decision_made`
- 0 of meer `risk_flagged`
- `gate_passed` of `gate_failed` voor `Prompt Safety Gate`
- `gate_passed` of `gate_failed` voor `Delivery Readiness Gate`

## 4. QA en integriteitscontrole

Laat `QA & Risk Reviewer` controleren:

- alle verplichte secties aanwezig
- geen open high-impact ambiguities
- lessons learned verwerkt
- artifacts onderling consistent
- safety- en evidence-regels intact

Bij failure:

- log `gate_failed`
- voer een revisieronde uit
- log `prompt_revised`
- herhaal de gate

## 5. Artifactschrijven

Pas nadat de plan- en safety-gates zijn gesloten:

- schrijf `output/SUPER_PROMPT.md`
- schrijf `output/PROMPT_PLAYBOOK.md`
- schrijf `output/logs/decision-register.md`
- schrijf `output/logs/prompt-events.jsonl`

De `Documentation & Logging Worker` is eigenaar van deze stap.

## 6. Afronding

Een run is alleen “complete” als:

- `plan_complete` expliciet is vastgesteld in de artifacttekst
- alle vier artifacts bestaan
- `Documentation Integrity Gate` is geslaagd
- revisies en aannames zichtbaar gelogd zijn

## Specifiek beleid bij ontbrekende informatie

- Eerst transcript of repo checken.
- Als het antwoord daar niet uit volgt, voeg een expliciete aanname toe.
- Als de aanname high-impact is en niet veilig te maken, markeer als open question en laat de gate falen.
- Nooit stil gaten opvullen.

## Outputlocaties

- `docs/prompt-framework/output/SUPER_PROMPT.md`
- `docs/prompt-framework/output/PROMPT_PLAYBOOK.md`
- `docs/prompt-framework/output/logs/prompt-events.jsonl`
- `docs/prompt-framework/output/logs/decision-register.md`
