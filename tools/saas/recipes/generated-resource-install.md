# AI Agent Recipe: Generated Resource Install

Use this recipe for one generated resource only. Do not broaden the task into framework changes, runtime registration work, or unrelated product modules.

## Inputs

- resource spec: `{{SPEC_PATH}}`
- preview output: `{{PREVIEW_OUTPUT_PATH}}`
- apply target: `{{APPLY_TARGET_PATH}}`
- recipe template: `{{TEMPLATE_PATH}}`
- bounded context command: `{{AGENT_CONTEXT_COMMAND}}`

## Read Only If Needed

{{RELEVANT_CONTEXT_FILES}}

Prefer the bounded context command over broad repo scans. Do not dump full file contents into your working notes.

## Allowed Paths

{{ALLOWED_PATHS}}

## Forbidden Paths

{{FORBIDDEN_PATHS}}

## Stop Conditions

{{STOP_CONDITIONS}}

## Phase 1: Inspect And Validate

Run:

```bash
{{PHASE_ONE_COMMANDS}}
```

Then:

{{PHASE_ONE_GUIDANCE}}

## Phase 2: Preview Generation

Run:

```bash
{{PHASE_TWO_COMMANDS}}
```

Then:

{{PHASE_TWO_GUIDANCE}}

## Phase 3: Apply Safely

Run only after Phase 1 and Phase 2 pass:

```bash
{{PHASE_THREE_COMMANDS}}
```

Apply rules:

{{SAFE_APPLY_GUIDANCE}}

## Phase 4: Customize Narrowly

Edit only these safe customization points:

{{SAFE_CUSTOMIZATION_POINTS}}

Customization rules:

{{CUSTOMIZATION_GUIDANCE}}

## Phase 5: Verify

Run:

```bash
{{PHASE_FIVE_COMMANDS}}
```

Verification rules:

{{PHASE_FIVE_GUIDANCE}}

## Planner Warnings

{{PLANNER_WARNINGS}}

## Manual Review

{{MANUAL_REVIEW}}

## Rollback And Manual Review Guidance

{{ROLLBACK_GUIDANCE}}

## Required Checks

{{REQUIRED_CHECKS}}

## Report Format

```text
{{REPORT_FORMAT}}
```
