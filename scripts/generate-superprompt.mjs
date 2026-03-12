import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const FRAMEWORK_DIR = path.join(ROOT, "docs", "prompt-framework");
const INPUT_DIR = path.join(FRAMEWORK_DIR, "input");
const OUTPUT_DIR = path.join(FRAMEWORK_DIR, "output");
const RUNS_DIR = path.join(FRAMEWORK_DIR, "runs");
const SCHEMA_PATH = path.join(INPUT_DIR, "run.schema.json");

const CURRENT_OUTPUT_FILES = {
  superPrompt: path.join(OUTPUT_DIR, "SUPER_PROMPT.md"),
  playbook: path.join(OUTPUT_DIR, "PROMPT_PLAYBOOK.md"),
  decisionRegister: path.join(OUTPUT_DIR, "logs", "decision-register.md"),
  promptEvents: path.join(OUTPUT_DIR, "logs", "prompt-events.jsonl"),
  report: path.join(OUTPUT_DIR, "run-report.md")
};

const ROOT_KEYS = [
  "conversation_source",
  "project_context",
  "repo_artifacts",
  "lessons_learned",
  "open_questions",
  "run_metadata"
];

const LESSON_LABELS = ["success", "regression", "misunderstanding", "process_change"];

const EVENT_CONFIDENCE = {
  context_extracted: 0.95,
  assumption_added: 0.72,
  decision_made: 0.91,
  risk_flagged: 0.89,
  gate_passed: 0.93,
  gate_failed: 0.84,
  prompt_revised: 0.94
};

const EXIT_CODES = {
  validation: 1,
  strictWarning: 2,
  write: 3
};

function usage() {
  return "Gebruik: npm run prompt:generate -- --input docs/prompt-framework/input/example.v3.run.json [--dry-run] [--diff] [--snapshot] [--report] [--strict]";
}

function fail(message, code = EXIT_CODES.validation) {
  console.error(message);
  process.exit(code);
}

function parseArgs(argv) {
  const inputIndex = argv.indexOf("--input");
  if (inputIndex === -1 || !argv[inputIndex + 1]) {
    fail(usage());
  }

  const knownFlags = new Set(["--input", "--dry-run", "--diff", "--snapshot", "--report", "--strict"]);
  for (const arg of argv) {
    if (arg.startsWith("--") && !knownFlags.has(arg)) {
      fail(`Onbekende flag: ${arg}\n${usage()}`);
    }
  }

  return {
    inputPath: path.resolve(ROOT, argv[inputIndex + 1]),
    dryRun: argv.includes("--dry-run"),
    diff: argv.includes("--diff"),
    snapshot: argv.includes("--snapshot"),
    report: argv.includes("--report"),
    strict: argv.includes("--strict")
  };
}

async function readTextFile(filePath, label = "Bestand") {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    throw new Error(`${label} niet gevonden: ${filePath}`);
  }
}

async function readJsonFile(filePath, label = "JSON-bestand") {
  const raw = await readTextFile(filePath, label);

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Ongeldige JSON in ${label.toLowerCase()}: ${filePath}`);
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function relativePath(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, "/");
}

function timestampToken(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
}

function slugify(value) {
  const slug = normalizeString(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "run";
}

function formatPath(pathParts) {
  return pathParts.join(".").replace(".[", "[");
}

function validateAgainstSchema(schemaNode, value, pathParts, issues) {
  const fieldPath = formatPath(pathParts);

  if (schemaNode.type === "object") {
    if (!isPlainObject(value)) {
      issues.push(`${fieldPath} moet een object zijn`);
      return;
    }

    for (const requiredKey of schemaNode.required ?? []) {
      if (!(requiredKey in value)) {
        issues.push(`${fieldPath}.${requiredKey} ontbreekt`);
      }
    }

    for (const [key, childSchema] of Object.entries(schemaNode.properties ?? {})) {
      if (key in value) {
        validateAgainstSchema(childSchema, value[key], [...pathParts, key], issues);
      }
    }

    return;
  }

  if (schemaNode.type === "array") {
    if (!Array.isArray(value)) {
      issues.push(`${fieldPath} moet een lijst zijn`);
      return;
    }

    for (let index = 0; index < value.length; index += 1) {
      validateAgainstSchema(schemaNode.items, value[index], [...pathParts, `[${index}]`], issues);
    }

    return;
  }

  if (schemaNode.type === "string") {
    if (!isNonEmptyString(value)) {
      issues.push(`${fieldPath} moet tekst zijn`);
      return;
    }

    const trimmed = value.trim();
    if (schemaNode.enum && !schemaNode.enum.includes(trimmed)) {
      issues.push(`${fieldPath} is ongeldig`);
      return;
    }

    if (schemaNode.const && trimmed !== schemaNode.const) {
      issues.push(`${fieldPath} moet ${schemaNode.const} zijn`);
    }
  }
}

function normalizeInput(raw) {
  const conversationSource = raw.conversation_source ?? {};
  const projectContext = raw.project_context ?? {};
  const repoArtifacts = raw.repo_artifacts ?? {};
  const runMetadata = raw.run_metadata ?? {};

  const lessons = Array.isArray(raw.lessons_learned)
    ? raw.lessons_learned
        .filter((item) => isPlainObject(item))
        .map((item) => ({
          label: normalizeString(item.label),
          summary: normalizeString(item.summary)
        }))
    : [];

  return {
    conversation_source: {
      type: normalizeString(conversationSource.type),
      source: normalizeString(conversationSource.source),
      summary: normalizeString(conversationSource.summary)
    },
    project_context: {
      brand: normalizeString(projectContext.brand),
      audiences: Array.isArray(projectContext.audiences) ? projectContext.audiences.map(normalizeString).filter(Boolean) : [],
      website_goal: normalizeString(projectContext.website_goal),
      features: Array.isArray(projectContext.features) ? projectContext.features.map(normalizeString).filter(Boolean) : [],
      constraints: Array.isArray(projectContext.constraints) ? projectContext.constraints.map(normalizeString).filter(Boolean) : [],
      tone_of_voice: normalizeString(projectContext.tone_of_voice)
    },
    repo_artifacts: {
      paths: Array.isArray(repoArtifacts.paths) ? repoArtifacts.paths.map(normalizeString).filter(Boolean) : [],
      categories: Array.isArray(repoArtifacts.categories) ? repoArtifacts.categories.map(normalizeString).filter(Boolean) : []
    },
    lessons_learned: lessons,
    open_questions: Array.isArray(raw.open_questions) ? raw.open_questions.map(normalizeString).filter(Boolean) : [],
    run_metadata: {
      date: normalizeString(runMetadata.date),
      operator: normalizeString(runMetadata.operator),
      source_project: normalizeString(runMetadata.source_project),
      output_language: isNonEmptyString(runMetadata.output_language) ? normalizeString(runMetadata.output_language) : "nl",
      framework_version: normalizeString(runMetadata.framework_version),
      template_version: normalizeString(runMetadata.template_version)
    },
    success_criteria: Array.isArray(raw.success_criteria) ? raw.success_criteria.map(normalizeString).filter(Boolean) : [],
    scope_notes: Array.isArray(raw.scope_notes) ? raw.scope_notes.map(normalizeString).filter(Boolean) : []
  };
}

function validateSemantics(input, issues, warnings) {
  if (input.lessons_learned.length < 3) {
    issues.push("lessons_learned moet minimaal 3 items bevatten");
  }

  if (input.project_context.audiences.length < 1) {
    issues.push("project_context.audiences moet minimaal 1 item bevatten");
  }

  if (input.project_context.features.length < 1) {
    issues.push("project_context.features moet minimaal 1 item bevatten");
  }

  if (input.repo_artifacts.paths.length < 1 && input.repo_artifacts.categories.length < 1) {
    issues.push("repo_artifacts moet minimaal 1 path of categorie bevatten");
  }

  if (input.success_criteria.length === 0) {
    warnings.push("success_criteria ontbreekt; output krijgt placeholders voor succescriteria.");
  }

  input.lessons_learned.forEach((lesson, index) => {
    if (!lesson.label) {
      issues.push(`lessons_learned[${index}].label ontbreekt`);
    } else if (!LESSON_LABELS.includes(lesson.label)) {
      issues.push(`lessons_learned[${index}].label is ongeldig`);
    }

    if (!lesson.summary) {
      issues.push(`lessons_learned[${index}].summary ontbreekt`);
    }
  });
}

async function validateInputFile(inputPath) {
  const [schema, raw] = await Promise.all([
    readJsonFile(SCHEMA_PATH, "Schema-bestand"),
    readJsonFile(inputPath, "Inputbestand")
  ]);

  if (!isPlainObject(raw)) {
    throw new Error("Input moet een JSON-object zijn.");
  }

  const issues = [];
  const warnings = [];

  for (const key of ROOT_KEYS) {
    if (!(key in raw)) {
      issues.push(`${key} ontbreekt`);
    }
  }

  validateAgainstSchema(schema, raw, ["input"], issues);

  const normalized = normalizeInput(raw);
  validateSemantics(normalized, issues, warnings);

  return {
    schemaPath: relativePath(SCHEMA_PATH),
    raw,
    normalized,
    blockingIssues: issues,
    warnings
  };
}

function createRenderContext(inputPath, input, runDate) {
  const runToken = timestampToken(runDate);
  const snapshotDir = path.join(RUNS_DIR, `${runToken}-${slugify(input.run_metadata.source_project)}`);

  return {
    inputArtifactRef: relativePath(inputPath),
    runToken,
    snapshotDir,
    snapshotRelativeDir: relativePath(snapshotDir)
  };
}

function renderBulletList(items, emptyPlaceholder) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : `- ${emptyPlaceholder}`;
}

function renderLessonsByLabel(lessons) {
  const grouped = {
    success: [],
    regression: [],
    misunderstanding: [],
    process_change: []
  };

  for (const lesson of lessons) {
    if (grouped[lesson.label]) {
      grouped[lesson.label].push(lesson.summary);
    }
  }

  return [
    "### Success",
    renderBulletList(grouped.success, "[Aanvullen: success lesson]"),
    "",
    "### Regression",
    renderBulletList(grouped.regression, "[Aanvullen: regression lesson]"),
    "",
    "### Misunderstanding",
    renderBulletList(grouped.misunderstanding, "[Aanvullen: misunderstanding lesson]"),
    "",
    "### Process Change",
    renderBulletList(grouped.process_change, "[Aanvullen: process change lesson]")
  ].join("\n");
}

function renderSuccessCriteria(items, brand) {
  return items.length
    ? renderBulletList(items, `[Aanvullen: concrete succescriteria voor ${brand}]`)
    : `- [Aanvullen: concrete succescriteria voor ${brand}]`;
}

function renderScopeNotes(items) {
  if (!items.length) {
    return "";
  }

  return `\n## Scope Notes\n\n${renderBulletList(items, "[Aanvullen: scope note]")}\n`;
}

function renderAssumptions(input) {
  const assumptions = [
    `Frameworkversie: ${input.run_metadata.framework_version}`,
    `Templateversie: ${input.run_metadata.template_version}`,
    `Outputtaal: ${input.run_metadata.output_language}`,
    "Generator werkt als scaffold + merge en verzint geen projectspecifieke inhoud."
  ];

  if (input.open_questions.length > 0) {
    assumptions.push("Open ambiguities blokkeren plan_complete totdat ze expliciet zijn opgelost.");
  }

  if (input.success_criteria.length === 0) {
    assumptions.push("Succescriteria ontbreken nog; de output houdt daarom een placeholder zichtbaar.");
  }

  return renderBulletList(assumptions, "[Aanvullen: aanname]");
}

function renderSuperPrompt(input) {
  const hasOpenQuestions = input.open_questions.length > 0;
  const statusBlock = hasOpenQuestions
    ? [
        "## Status",
        "",
        "Deze run is nog niet `plan_complete`.",
        "",
        "Reden:",
        renderBulletList(input.open_questions, "[Aanvullen: open ambiguity]"),
        "",
        "Los deze high-impact ambiguities eerst op voordat deze output als definitief wordt gebruikt."
      ].join("\n")
    : [
        "## Plan complete",
        "",
        "Deze run heeft geen open high-impact ambiguities en mag als `plan_complete` worden behandeld."
      ].join("\n");

  return `# Super Prompt ${input.run_metadata.framework_version} voor ${input.project_context.brand}

## Doel

Je bent een Codex-only website delivery system voor ${input.project_context.brand}. Je doel is om een websiteproject iteratief, repo-gedekt en zonder hallucinaties uit te voeren.

Projectdoel:

- ${input.project_context.website_goal}

Succescriteria:

${renderSuccessCriteria(input.success_criteria, input.project_context.brand)}

Feature scope voor deze run:

${renderBulletList(input.project_context.features, "[Aanvullen: feature focus]")}

## Stopregel

Voer nooit implementatie uit voordat deze volgorde expliciet is afgerond:

1. contextinventarisatie
2. planvorming
3. uitvoering

Als context of plan niet decision-complete is, stop en vraag of log een expliciete aanname.

## Persona's en gebruikersdoelen

${renderBulletList(input.project_context.audiences, "[Aanvullen: doelgroep]")}

## MVP-scope

- Werk altijd aan precies een feature, bugcluster of subsystem per iteratie
- Lever per iteratie concrete output: code, docs of validatie

Huidige trajectscope:

${renderBulletList(input.project_context.features, "[Aanvullen: scoped feature]")}

## Out-of-scope

- Geen ongeplande feature creep
- Geen stille architectuurwijzigingen zonder rationale
- Geen gokwerk bij ontbrekende context

## Scope-context

Constraints:

${renderBulletList(input.project_context.constraints, "[Aanvullen: projectspecifieke scope guard]")}

Tone of voice:

- ${input.project_context.tone_of_voice}
${renderScopeNotes(input.scope_notes)}## Workers

### Worker 1: Conversation Analyst

- doelen
- constraints
- impliciete voorkeuren
- misverstanden en correcties
- lessons learned extractie
- confidence en open ambiguities

### Worker 2: Prompt Best-Practices Researcher

- toe te passen promptprincipes
- anti-hallucinatiepatronen
- verificatie- en bewijsregels
- outputstructuur-aanbevelingen
- rationale per patroon

### Worker 3: Website Delivery Architect

- fasering
- scope guards
- acceptance criteria
- interface-/artifactcontract
- failure modes

### Worker 4: QA & Risk Reviewer

- ontbrekende randgevallen
- kwaliteitsgates
- risico's per artifact
- stop/go oordeel
- regressiechecks

### Worker 5: Documentation & Logging Worker

- definitieve artifacts
- assumptions register
- JSONL events
- changelog
- revisienotities

## Outputformaten

Schrijf exact deze vier outputs:

- \`docs/prompt-framework/output/SUPER_PROMPT.md\`
- \`docs/prompt-framework/output/PROMPT_PLAYBOOK.md\`
- \`docs/prompt-framework/output/logs/prompt-events.jsonl\`
- \`docs/prompt-framework/output/logs/decision-register.md\`

## Validatiegates

- Context Completeness Gate
- Prompt Safety Gate
- Delivery Readiness Gate
- Documentation Integrity Gate

## Open ambiguities

${hasOpenQuestions ? renderBulletList(input.open_questions, "[Aanvullen: open ambiguity]") : "Geen open high-impact ambiguities."}

## Logging- en documentatieverplichtingen

- Log decisions, gates, risks en revisies in JSONL
- Bewaar structurele keuzes in het decision register
- Log elke aanname expliciet
- Voeg confidence toe aan observaties en conclusies

## Anti-hallucinatie-regels

- Niet gokken bij ontbrekende informatie
- Eerst transcript en repo inspecteren, daarna pas aannemen
- Elke niet-geverifieerde claim labelen als aanname
- Evidence-based claims moeten bron of repo-verwijzing hebben
- Geen implementatie zonder gesloten context- en plangates

## Repo-artifacts

Concrete paden:

${renderBulletList(input.repo_artifacts.paths, "[Aanvullen: concreet pad]")}

Artifact-categorieen:

${renderBulletList(input.repo_artifacts.categories, "[Aanvullen: artifactcategorie]")}

## Aannames

${renderAssumptions(input)}

${statusBlock}
`;
}

function renderPlaybook(input, context) {
  return `# Prompt Playbook ${input.run_metadata.framework_version}

## Doel van deze versie

Deze versie scaffoldt een herhaalbare superprompt voor ${input.project_context.brand} op basis van een JSON-runbestand. De CLI automatiseert structuur, logging en vaste secties, maar laat projectspecifieke verfijning expliciet zichtbaar.

Projectdoel:

- ${input.project_context.website_goal}

## Waarom deze keuzes zijn gemaakt

| Onderdeel | Keuze | Waarom | Bron |
| --- | --- | --- | --- |
| Inputformaat | JSON met formeel schema | Eenvoudig te valideren en scriptbaar zonder extra dependencies | ${context.inputArtifactRef} |
| Automatisering | Scaffold + merge | Houdt output bruikbaar zonder inhoud te verzinnen | scripts/generate-superprompt.mjs |
| Outputlocaties | Vast onder docs/prompt-framework/output | Sluit aan op het frameworkcontract | docs/prompt-framework/README.md |
| Snapshot-history | Per-run snapshot naast current output | Verbetert traceability en rollback | docs/prompt-framework/V3-CLI.md |

## Lessons learned

${renderLessonsByLabel(input.lessons_learned)}

## Wat meenemen naar volgende run

${renderBulletList(input.lessons_learned.map((lesson) => lesson.summary), "[Aanvullen: takeaway]")}

## Herbruikbare promptpatronen

- Eerst context, dan plan, dan uitvoering
- 1 feature per iteratie
- Gates zijn hard blockers
- Geen stille aannames

## Anti-patronen

- Meteen implementeren zonder gesloten context
- Repo-feiten aannemen zonder bewijs
- Open high-impact ambiguities negeren
- Output buiten vaste artifactpaden schrijven

## Updateprotocol

1. Werk het JSON-runbestand bij.
2. Draai de CLI opnieuw.
3. Vergelijk current output en diff-samenvatting.
4. Beoordeel warnings en blocking issues in het run-report.
5. Bewaar snapshot-history als audit trail.

## Diff-procedure

Vergelijk altijd:

- projectdoel
- succescriteria
- lessons learned
- gates
- assumptions policy
- outputlocaties

## Regressiepreventieregels

- Geen nieuwe default zonder bewijs uit lessons learned of testen
- Geen scope-uitbreiding zonder acceptatiecriteria
- Geen shortcut die evidence- of gate-regels verzwakt

## Revisiegeschiedenis

| Datum | Versie | Wijziging | Reden |
| --- | --- | --- | --- |
| ${input.run_metadata.date} | ${input.run_metadata.framework_version} | Workflow-output voor ${input.run_metadata.source_project} | Betrouwbare CLI-run |
`;
}

function renderDecisionRegister(input) {
  const decisions = [
    {
      title: "Inputformaat is JSON met formeel schema",
      decision: "De CLI leest exact een JSON-runbestand en valideert dit tegen een formeel schema en semantische regels.",
      alternatives: "YAML, meerdere Markdown-bestanden, losse veldvalidatie zonder schema",
      reason: "Strakkere validatie en betere overdraagbaarheid.",
      impact: "Minder invoerflexibiliteit, hogere betrouwbaarheid.",
      trigger: "Herzien als meerdere teams een ander bronformaat nodig hebben."
    },
    {
      title: "Automation mode is scaffold + merge",
      decision: "De CLI genereert structuur en herhaalbare inhoud, maar verzint geen projectspecifieke details.",
      alternatives: "Maximaal invullen, alleen boilerplate",
      reason: "Dit houdt output bruikbaar en controleerbaar.",
      impact: "Minder handwerk dan v1, maar nog bewuste naverfijning nodig.",
      trigger: "Herzien als meerdere runs aantonen dat meer automatisch invullen veilig is."
    },
    {
      title: "Vaste outputlocaties en current output blijven leidend",
      decision: "Current output blijft onder docs/prompt-framework/output en wordt per succesvolle run bijgewerkt.",
      alternatives: "Alleen snapshots, alleen stdout",
      reason: "Behoudt een stabiel contract voor opvolgende tooling en gebruikers.",
      impact: "Heldere laatste succesvolle run, plus aparte history.",
      trigger: "Herzien als consumers expliciet versiegebonden output nodig hebben."
    },
    {
      title: "Open ambiguities blokkeren plan_complete",
      decision: input.open_questions.length > 0
        ? "Deze run blijft geblokkeerd totdat open high-impact ambiguities zijn opgelost."
        : "Deze run heeft geen open high-impact ambiguities en mag plan_complete zijn.",
      alternatives: "Ambiguities als waarschuwing behandelen",
      reason: "Frameworkregels eisen dat high-impact gaten niet stil worden genegeerd.",
      impact: "Veiliger, maar strenger afrondingspad.",
      trigger: "Herzien als het gatebeleid verandert."
    }
  ];

  if (input.open_questions.length > 0) {
    decisions.push({
      title: "Run incomplete wegens open high-impact ambiguities",
      decision: "De run wordt als incompleet gelogd totdat alle open vragen zijn opgelost.",
      alternatives: "Run toch afronden met waarschuwing",
      reason: "Voorkomt schijnbaar definitieve output met bekende gaten.",
      impact: "Geen plan_complete, wel expliciete traceability.",
      trigger: "Verdwijnt zodra open_questions leeg is."
    });
  }

  return `# Decision Register

## Besluiten

${decisions
    .map(
      (item) => `### [${input.run_metadata.date}] ${item.title}

- Besluit: ${item.decision}
- Alternatieven: ${item.alternatives}
- Reden: ${item.reason}
- Impact: ${item.impact}
- Revisietrigger: ${item.trigger}
- Artifact refs: \`docs/prompt-framework/output/\``
    )
    .join("\n\n")}
`;
}

function createEvent(worker, eventType, summary, artifactRef, timestamp) {
  return JSON.stringify({
    timestamp,
    worker,
    event_type: eventType,
    summary,
    artifact_ref: artifactRef,
    confidence: EVENT_CONFIDENCE[eventType]
  });
}

function renderPromptEvents(input, report) {
  const baseTime = new Date(`${input.run_metadata.date}T10:00:00Z`).getTime();
  const times = Array.from({ length: 6 }, (_, index) => new Date(baseTime + index * 60 * 1000).toISOString());
  const events = [
    createEvent(
      "Conversation Analyst",
      "context_extracted",
      `Runcontext voor ${input.run_metadata.source_project} uit JSON-input en repo-artifacts samengevoegd.`,
      "docs/prompt-framework/output/SUPER_PROMPT.md",
      times[0]
    ),
    createEvent(
      "Prompt Best-Practices Researcher",
      "decision_made",
      "Promptregels, gates en outputcontract zijn herbouwd vanuit het schema en frameworkcontract.",
      "docs/prompt-framework/README.md",
      times[1]
    )
  ];

  if (input.open_questions.length > 0) {
    events.push(
      createEvent(
        "QA & Risk Reviewer",
        "risk_flagged",
        `Open ambiguities blokkeren plan_complete: ${input.open_questions.length} item(s).`,
        "docs/prompt-framework/output/SUPER_PROMPT.md",
        times[2]
      )
    );
  }

  events.push(
    createEvent(
      "Website Delivery Architect",
      "decision_made",
      "Generator draait in workflowmodus met diff, report en snapshots.",
      "scripts/generate-superprompt.mjs",
      times[3]
    ),
    createEvent(
      "QA & Risk Reviewer",
      report.qualityScore === "fail" ? "gate_failed" : "gate_passed",
      report.qualityScore === "fail"
        ? "Delivery Readiness Gate gefaald op basis van blocking issues of strict warnings."
        : "Context Completeness Gate en Delivery Readiness Gate zijn geslaagd.",
      "docs/prompt-framework/quality-gates.md",
      times[4]
    ),
    createEvent(
      "Documentation & Logging Worker",
      "prompt_revised",
      `Artifacts opnieuw gegenereerd voor ${input.run_metadata.source_project}.`,
      "docs/prompt-framework/output/",
      times[5]
    )
  );

  return `${events.join("\n")}\n`;
}

function countPlaceholders(text) {
  const matches = text.match(/\[Aanvullen:/g);
  return matches ? matches.length : 0;
}

async function readExistingContent(filePath) {
  try {
    return await readTextFile(filePath);
  } catch {
    return null;
  }
}

async function buildDiffSummary(rendered) {
  const checks = [
    ["SUPER_PROMPT.md", CURRENT_OUTPUT_FILES.superPrompt, rendered.superPrompt],
    ["PROMPT_PLAYBOOK.md", CURRENT_OUTPUT_FILES.playbook, rendered.playbook],
    ["decision-register.md", CURRENT_OUTPUT_FILES.decisionRegister, rendered.decisionRegister],
    ["prompt-events.jsonl", CURRENT_OUTPUT_FILES.promptEvents, rendered.promptEvents],
    ["run-report.md", CURRENT_OUTPUT_FILES.report, rendered.report]
  ];

  const summary = [];
  for (const [label, filePath, nextContent] of checks) {
    const current = await readExistingContent(filePath);
    const status = current === null ? "created" : current === nextContent ? "unchanged" : "changed";
    summary.push({
      label,
      status,
      path: relativePath(filePath)
    });
  }
  return summary;
}

function summarizeDiff(diffSummary) {
  return diffSummary.map((item) => `- ${item.label}: ${item.status}`).join("\n");
}

function buildReport(input, validation, rendered, diffSummary, context, options) {
  const placeholderCounts = {
    superPrompt: countPlaceholders(rendered.superPrompt),
    playbook: countPlaceholders(rendered.playbook),
    decisionRegister: countPlaceholders(rendered.decisionRegister),
    promptEvents: countPlaceholders(rendered.promptEvents)
  };

  const warnings = [...validation.warnings];
  const totalPlaceholders = Object.values(placeholderCounts).reduce((sum, value) => sum + value, 0);

  if (totalPlaceholders > 0) {
    warnings.push(`Artifacts bevatten ${totalPlaceholders} placeholder(s).`);
  }

  if (input.open_questions.length > 0) {
    warnings.push(`Open ambiguities aanwezig: ${input.open_questions.length}.`);
  }

  let qualityScore = "pass";
  if (validation.blockingIssues.length > 0) {
    qualityScore = "fail";
  } else if (warnings.length > 0) {
    qualityScore = "warn";
  }

  if (options.strict && qualityScore === "warn") {
    qualityScore = "fail";
  }

  const validationResult = validation.blockingIssues.length > 0
    ? "blocking_fail"
    : qualityScore === "warn"
      ? "valid_with_warnings"
      : "valid";

  const generatedFiles = [
    relativePath(CURRENT_OUTPUT_FILES.superPrompt),
    relativePath(CURRENT_OUTPUT_FILES.playbook),
    relativePath(CURRENT_OUTPUT_FILES.decisionRegister),
    relativePath(CURRENT_OUTPUT_FILES.promptEvents),
    relativePath(CURRENT_OUTPUT_FILES.report)
  ];

  const reportMarkdown = `# Run Report

## Run metadata

- Date: ${input.run_metadata.date}
- Operator: ${input.run_metadata.operator}
- Source project: ${input.run_metadata.source_project}
- Framework version: ${input.run_metadata.framework_version}
- Template version: ${input.run_metadata.template_version}
- Input artifact: ${context.inputArtifactRef}
- Dry run: ${options.dryRun ? "ja" : "nee"}
- Diff mode: ${options.diff ? "ja" : "nee"}
- Strict mode: ${options.strict ? "ja" : "nee"}
- Snapshot path: ${context.snapshotRelativeDir}

## Input summary

- Brand: ${input.project_context.brand}
- Audiences: ${input.project_context.audiences.length}
- Features: ${input.project_context.features.length}
- Constraints: ${input.project_context.constraints.length}
- Lessons learned: ${input.lessons_learned.length}
- Open ambiguities: ${input.open_questions.length}

## Validation result

- Result: ${validationResult}
- Quality score: ${qualityScore}
- Schema path: ${validation.schemaPath}

## Blocking issues

${renderBulletList(validation.blockingIssues, "Geen blocking issues.")}

## Warnings

${renderBulletList(warnings, "Geen warnings.")}

## Placeholder count per artifact

- SUPER_PROMPT.md: ${placeholderCounts.superPrompt}
- PROMPT_PLAYBOOK.md: ${placeholderCounts.playbook}
- decision-register.md: ${placeholderCounts.decisionRegister}
- prompt-events.jsonl: ${placeholderCounts.promptEvents}

## Open ambiguities count

- ${input.open_questions.length}

## Generated files

${renderBulletList(generatedFiles, "[Aanvullen: generated file]")}

## Current-versus-previous summary

${summarizeDiff(diffSummary)}
`;

  return {
    qualityScore,
    validationResult,
    warnings,
    blockingIssues: validation.blockingIssues,
    diffSummary,
    reportMarkdown
  };
}

function snapshotFiles(context) {
  return {
    superPrompt: path.join(context.snapshotDir, "SUPER_PROMPT.md"),
    playbook: path.join(context.snapshotDir, "PROMPT_PLAYBOOK.md"),
    decisionRegister: path.join(context.snapshotDir, "logs", "decision-register.md"),
    promptEvents: path.join(context.snapshotDir, "logs", "prompt-events.jsonl"),
    report: path.join(context.snapshotDir, "run-report.md"),
    inputCopy: path.join(context.snapshotDir, "input.json")
  };
}

async function writeAtomically(targetPath, content, tempSuffix) {
  const tempPath = `${targetPath}${tempSuffix}`;
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(tempPath, content, "utf8");
  await rename(tempPath, targetPath);
}

async function writeOutputs(rendered, rawInput, context) {
  const suffix = `.tmp-${process.pid}-${Date.now()}`;
  const snapshot = snapshotFiles(context);

  const writes = [
    [CURRENT_OUTPUT_FILES.superPrompt, rendered.superPrompt],
    [CURRENT_OUTPUT_FILES.playbook, rendered.playbook],
    [CURRENT_OUTPUT_FILES.decisionRegister, rendered.decisionRegister],
    [CURRENT_OUTPUT_FILES.promptEvents, rendered.promptEvents],
    [CURRENT_OUTPUT_FILES.report, rendered.report]
  ];

  const snapshotWrites = [
    [snapshot.superPrompt, rendered.superPrompt],
    [snapshot.playbook, rendered.playbook],
    [snapshot.decisionRegister, rendered.decisionRegister],
    [snapshot.promptEvents, rendered.promptEvents],
    [snapshot.report, rendered.report],
    [snapshot.inputCopy, JSON.stringify(rawInput, null, 2)]
  ];

  for (const [targetPath, content] of [...writes, ...snapshotWrites]) {
    await writeAtomically(targetPath, content, suffix);
  }
}

function printSummary(report) {
  console.log(`Run quality: ${report.qualityScore}`);
  console.log(summarizeDiff(report.diffSummary));
}

function printReport(report) {
  console.log("\n--- run-report ---\n");
  console.log(report.reportMarkdown);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const validation = await validateInputFile(options.inputPath);
  const input = validation.normalized;
  const runDate = new Date();
  const context = createRenderContext(options.inputPath, input, runDate);

  const rendered = {
    superPrompt: renderSuperPrompt(input),
    playbook: renderPlaybook(input, context),
    decisionRegister: renderDecisionRegister(input),
    promptEvents: "",
    report: ""
  };

  rendered.promptEvents = renderPromptEvents(input, { qualityScore: validation.blockingIssues.length > 0 ? "fail" : "pass" });
  const diffSummary = await buildDiffSummary(rendered);
  const report = buildReport(input, validation, rendered, diffSummary, context, options);
  rendered.promptEvents = renderPromptEvents(input, report);
  rendered.report = report.reportMarkdown;

  const hardFailure = report.blockingIssues.length > 0;
  const strictFailure = !hardFailure && options.strict && report.warnings.length > 0;

  if (options.diff || options.dryRun || options.report || hardFailure || strictFailure) {
    printSummary(report);
    if (options.report || options.dryRun || hardFailure || strictFailure) {
      printReport(report);
    }
  }

  if (hardFailure) {
    process.exit(EXIT_CODES.validation);
  }

  if (strictFailure) {
    process.exit(EXIT_CODES.strictWarning);
  }

  if (options.dryRun) {
    console.log("\nDry run: geen bestanden geschreven.");
    return;
  }

  try {
    await writeOutputs(rendered, validation.raw, context);
  } catch (error) {
    fail(`Write failure: ${error instanceof Error ? error.message : String(error)}`, EXIT_CODES.write);
  }

  console.log(`Artifacts gegenereerd vanuit ${context.inputArtifactRef}`);
  console.log(`Snapshot opgeslagen in ${context.snapshotRelativeDir}`);
  if (options.snapshot) {
    console.log("Flag --snapshot ontvangen; snapshots zijn in v3 standaard actief.");
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error), EXIT_CODES.write);
});
