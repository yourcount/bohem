# Decision Register

## Besluiten

### [2026-03-11] Inputformaat is JSON met formeel schema

- Besluit: De CLI leest exact een JSON-runbestand en valideert dit tegen een formeel schema en semantische regels.
- Alternatieven: YAML, meerdere Markdown-bestanden, losse veldvalidatie zonder schema
- Reden: Strakkere validatie en betere overdraagbaarheid.
- Impact: Minder invoerflexibiliteit, hogere betrouwbaarheid.
- Revisietrigger: Herzien als meerdere teams een ander bronformaat nodig hebben.
- Artifact refs: `docs/prompt-framework/output/`

### [2026-03-11] Automation mode is scaffold + merge

- Besluit: De CLI genereert structuur en herhaalbare inhoud, maar verzint geen projectspecifieke details.
- Alternatieven: Maximaal invullen, alleen boilerplate
- Reden: Dit houdt output bruikbaar en controleerbaar.
- Impact: Minder handwerk dan v1, maar nog bewuste naverfijning nodig.
- Revisietrigger: Herzien als meerdere runs aantonen dat meer automatisch invullen veilig is.
- Artifact refs: `docs/prompt-framework/output/`

### [2026-03-11] Vaste outputlocaties en current output blijven leidend

- Besluit: Current output blijft onder docs/prompt-framework/output en wordt per succesvolle run bijgewerkt.
- Alternatieven: Alleen snapshots, alleen stdout
- Reden: Behoudt een stabiel contract voor opvolgende tooling en gebruikers.
- Impact: Heldere laatste succesvolle run, plus aparte history.
- Revisietrigger: Herzien als consumers expliciet versiegebonden output nodig hebben.
- Artifact refs: `docs/prompt-framework/output/`

### [2026-03-11] Open ambiguities blokkeren plan_complete

- Besluit: Deze run heeft geen open high-impact ambiguities en mag plan_complete zijn.
- Alternatieven: Ambiguities als waarschuwing behandelen
- Reden: Frameworkregels eisen dat high-impact gaten niet stil worden genegeerd.
- Impact: Veiliger, maar strenger afrondingspad.
- Revisietrigger: Herzien als het gatebeleid verandert.
- Artifact refs: `docs/prompt-framework/output/`
