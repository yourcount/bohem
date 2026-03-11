# Decision Register

## Besluiten

### [2026-03-11] Framework landt onder docs/prompt-framework

- Besluit: v1 wordt als documentgedreven subsystem onder `docs/prompt-framework/` toegevoegd
- Alternatieven: projectroot, `tools/`
- Reden: gescheiden van app-code, maar wel repo-nabij en makkelijk leesbaar
- Impact: lage technische complexiteit, hoge overdraagbaarheid
- Revisietrigger: zodra CLI of scriptbare generator nodig is
- Artifact refs: `docs/prompt-framework/README.md`

### [2026-03-11] v1 is prompt-first en niet scriptgedreven

- Besluit: geen CLI, UI of codegedreven generator in v1
- Alternatieven: direct een CLI-specificatie of werkende generator bouwen
- Reden: eerst proceskwaliteit, defaults en kwaliteitsgates stabiliseren
- Impact: snellere adoptie, minder technische overhead, lagere automatiseringsgraad
- Revisietrigger: zodra twee of meer succesvolle handmatige runs stabiel hetzelfde patroon volgen
- Artifact refs: `docs/prompt-framework/operator-workflow.md`

### [2026-03-11] Vaste worker-volgorde is verplicht

- Besluit: vijf workers in vaste volgorde zonder overslaan
- Alternatieven: flexibele workerkeuze per run
- Reden: consistentie en regressiepreventie wegen zwaarder dan flexibiliteit in v1
- Impact: meer voorspelbare output, minder procesvrijheid
- Revisietrigger: als meerdere projecten aantonen dat een worker structureel overbodig of verkeerd gepositioneerd is
- Artifact refs: `docs/prompt-framework/SUPER_PROMPT.template.md`

### [2026-03-11] Quality gates zijn hard blockers

- Besluit: een gefaalde gate blokkeert finalisatie en verplicht revisie of stop
- Alternatieven: gates alleen als advies tonen
- Reden: voorkomt schijnbare “complete” prompts met open hiaten
- Impact: hogere kwaliteit, iets tragere afronding
- Revisietrigger: als gates te vaak falen door overstrenge eisen zonder kwaliteitswinst
- Artifact refs: `docs/prompt-framework/quality-gates.md`

### [2026-03-11] Bohèm is de referentie dry-run

- Besluit: Bohèm dient als eerste referentiecase en voorbeeldoutput
- Alternatieven: abstracte demo zonder echte casus
- Reden: concreet traject met merk, frontend, backend, CMS, SEO, security en release-lessons
- Impact: betere realiteitswaarde van defaults
- Revisietrigger: zodra een tweede project contrasterende lessons learned toevoegt
- Artifact refs: `docs/prompt-framework/examples/bohem-dry-run.md`
