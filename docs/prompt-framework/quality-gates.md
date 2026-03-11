# Quality Gates

## Context Completeness Gate

Doel: verifiëren dat de run genoeg bronmateriaal heeft om veilig een superprompt te maken.

Checklist:

- `conversation_source` aanwezig
- `project_context` aanwezig
- `repo_artifacts` aanwezig
- `lessons_learned` aanwezig of expliciet leeg verklaard
- high-impact ambiguities benoemd
- aannames apart gelogd

Fail als:

- kerndoelen onduidelijk zijn
- repo of transcript onvoldoende basis biedt voor belangrijke claims
- lessons learned ontbreken zonder expliciete markering

## Prompt Safety Gate

Doel: verifiëren dat de superprompt geen hallucinatie- of shortcutgedrag stimuleert.

Checklist:

- stopregel aanwezig
- “niet gokken”-regel aanwezig
- evidence-based claims regel aanwezig
- aannameslijst verplicht
- geen implementatie voor context + plan

Fail als:

- prompt impliciet uitvoering toestaat zonder contextcheck
- claims niet herleidbaar hoeven te zijn
- aannames verborgen blijven

## Delivery Readiness Gate

Doel: verifiëren dat de prompt direct bruikbaar is voor een volgend websiteproject.

Checklist:

- projectdoel + succescriteria aanwezig
- persona's aanwezig
- MVP-scope + out-of-scope aanwezig
- workers en outputformaten compleet
- validatiechecklists compleet
- logging en retrospective aanwezig

Fail als:

- de implementerende agent nog productbeslissingen moet maken
- iteraties of acceptance criteria ontbreken
- artifacts niet decision-complete zijn

## Documentation Integrity Gate

Doel: verifiëren dat alle outputartefacts consistent en volledig zijn.

Checklist:

- `SUPER_PROMPT.md` aanwezig
- `PROMPT_PLAYBOOK.md` aanwezig
- `decision-register.md` aanwezig
- `prompt-events.jsonl` aanwezig
- inhoud onderling consistent
- revisies, assumptions en gate-uitkomsten gelogd

Fail als:

- artifactstructuren afwijken van het contract
- JSONL-events verplichte velden missen
- decisions of assumptions niet terug te vinden zijn
