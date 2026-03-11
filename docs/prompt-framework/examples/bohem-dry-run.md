# Bohèm Dry-Run

Dit voorbeeld toont hoe v1 wordt toegepast op het Bohèm-traject.

## Run metadata

- Date: 2026-03-11
- Operator: Codex
- Source project: Bohèm website + admin/backend traject
- Output language: Nederlands
- Framework version: v1

## Inputsamenvatting

### `conversation_source`

- Meerdere iteraties over merkbasis, IA, copy, visueel systeem, frontend, backend, CMS, SEO, security en release-hardening
- Veel correctierondes rond mobile UX, hero-foto, sticky elementen, admin parity, caching en Vercel gedrag

### `project_context`

- Artist website met boekingsfocus
- Doelgroepen: programmeurs, eventorganisatoren, fans, pers, editors
- Belangrijke constraints: mobile-first, hoge esthetische kwaliteit, semantiek, toegankelijkheid, CMS voor niet-technische editors, Vercel deployment

### `repo_artifacts`

- `app/`
- `components/`
- `lib/`
- `docs/release-matrix.md`
- admin en super-admin flows
- Vercel caching, Blob storage, security hardening

### `lessons_learned`

- `misunderstanding`: hero image focuspoint was herhaaldelijk verkeerd op mobiel/desktop
- `regression`: cache op Vercel liet contentwijzigingen niet direct zien
- `success`: strong role separation tussen editor en backend admin verbeterde bruikbaarheid
- `process_change`: eerst dry-run en parity audit doen voorkomt latere contentgaten
- `success`: design decisions werden beter zodra scope per iteratie klein bleef

### `open_questions`

- Geen blockers voor framework v1

## Verwachte output

- Een superprompt die websiteprojecten iteratief en evidence-based laat verlopen
- Een playbook dat Bohèm-lessons learned omzet in herbruikbare defaults
- Logging die decisions, aannames en gates dwingend maakt

## Referentiepunten uit Bohèm

- Kleine iteraties werkten beter dan brede “pak alles tegelijk” requests
- Heldere outputcontracten verlaagden het aantal correctierondes
- Expliciete quality gates zijn nodig voor SEO, a11y, performance en security
- Niet-technische editors hebben andere prompt- en UX-vereisten dan technische admins
