# prompt-events.jsonl Schema

Elke regel in `prompt-events.jsonl` is een JSON-object. Gebruik exact één event per regel.

## Verplicht schema

```json
{
  "timestamp": "2026-03-11T14:30:00Z",
  "worker": "Conversation Analyst",
  "event_type": "context_extracted",
  "summary": "Kerncontext uit transcript en repo samengevoegd.",
  "artifact_ref": "docs/prompt-framework/output/SUPER_PROMPT.md",
  "confidence": 0.92
}
```

## Velden

- `timestamp`
  - Type: string
  - Formaat: ISO-8601 UTC
  - Verplicht: ja

- `worker`
  - Type: string
  - Verplicht: ja
  - Toegestane waarden:
    - `Conversation Analyst`
    - `Prompt Best-Practices Researcher`
    - `Website Delivery Architect`
    - `QA & Risk Reviewer`
    - `Documentation & Logging Worker`
    - `Orchestrator`

- `event_type`
  - Type: string
  - Verplicht: ja
  - Toegestane waarden:
    - `context_extracted`
    - `assumption_added`
    - `decision_made`
    - `risk_flagged`
    - `gate_passed`
    - `gate_failed`
    - `prompt_revised`

- `summary`
  - Type: string
  - Verplicht: ja
  - Richtlijn: 1 zin, concreet en feitelijk

- `artifact_ref`
  - Type: string
  - Verplicht: ja
  - Richtlijn: pad naar bron- of doelartifact; gebruik `n/a` als er geen specifiek artifact is

- `confidence`
  - Type: number
  - Verplicht: ja
  - Bereik: `0` tot en met `1`

## Validatieregels

- Geen extra keys verplicht stellen in v1.
- `confidence` mag niet buiten `0..1` vallen.
- `summary` mag geen lege string zijn.
- `artifact_ref` moet een pad of `n/a` zijn.
- `gate_failed` moet in dezelfde run gevolgd worden door revisie of expliciete stop.
- `prompt_revised` mag alleen worden gelogd als een artifactinhoud is aangepast.
