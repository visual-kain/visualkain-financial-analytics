# Feature Tasks — `{{FEATURE_ID}}: {{FEATURE_NAME}}`

**Status:** `{{PLANNED | ACTIVE | BLOCKED | COMPLETE}}`  
**Requirements:** `{{REQUIREMENTS_PATH}}`  
**System Architecture:** `{{SYSTEM_ARCHITECTURE_PATH_OR_NA}}`  
**Design:** `{{DESIGN_PATH_OR_NA}}`  
**Owner:** `{{OWNER}}`  
**Last Updated:** `{{YYYY-MM-DD}}`

## 1. Tasking Principles

- Every task implements one coherent objective.
- Tasks reference the requirements, relevant module-architecture constraints, and implementation design they serve.
- Tasks are small enough to review and verify independently where practical.
- Dependencies and stop conditions are explicit.
- High-impact product/architecture/security/data decisions are resolved before they are encoded as implementation tasks.
- An implementation task must not silently change approved data ownership, consistency, communication, caching, scaling, resilience, security, or other module-architecture decisions.
- Do not use this file as a second full specification; link canonical artifacts.

## 2. Status Definitions

Use the project's actual status vocabulary. Example:

- `planned` — ready but not started;
- `in_progress` — active implementation;
- `blocked` — cannot proceed until a dependency/decision resolves;
- `verification` — implementation exists and evidence is being collected;
- `done` — acceptance/verification complete;
- `deferred` — intentionally removed from current scope.

## 3. Dependency Overview

```text
{{T-001}}
  → {{T-002}}
  → {{T-004}}

{{T-003}} ─────────┘
```

Parallel work is safe only when shared contracts and architecture decisions are already settled and tasks do not silently change one another's assumptions.

## 4. Task List

### T-001 — `{{TASK_TITLE}}`

**Status:** `{{STATUS}}`  
**Objective:** `{{ONE_COHERENT_OUTCOME}}`

#### Context

- Requirements: `{{FR_IDS / AC_IDS}}`
- System architecture: `{{ARCH_SECTION_OR_DECISION_OR_NA}}`
- Design: `{{DESIGN_SECTION_OR_NA}}`
- Reason this task exists: `{{CONTEXT}}`

Only load the architecture sections implicated by this task unless broader context is required to resolve a concrete uncertainty.

#### Dependencies

- `{{TASK_OR_DECISION_DEPENDENCY_OR_NONE}}`

#### Scope

May change:

- `{{AREA_OR_COMPONENT}}`
- `{{AREA_OR_COMPONENT}}`

#### Affected Areas

Expected repository areas after inspection:

- `{{PATH_OR_COMPONENT_IF_VERIFIED}}`
- `{{PATH_OR_COMPONENT_IF_VERIFIED}}`

Do not invent exact paths before repository inspection. If implementation differs from expected areas, explain why.

#### Constraints

- `{{REQUIREMENT_CONSTRAINT}}`
- `{{ARCHITECTURE_CONSTRAINT}}`
- `{{DESIGN_CONSTRAINT}}`
- No unrelated refactor.
- Preserve existing public/data behavior unless explicitly changed by referenced specification.

#### Architecture Stop Conditions

Stop and report before implementation if this task requires an unapproved change to:

- module/global ownership or dependency direction;
- source of truth or persistence strategy;
- consistency, ordering, concurrency, or idempotency guarantees;
- communication style or delivery semantics;
- caching/invalidation strategy;
- scaling/partitioning/sharding assumptions;
- retry/replay/resilience behavior;
- trust boundary, authentication, authorization, or sensitive-data handling;
- public/data contracts, deployment topology, or significant cost/operational model.

#### Implementation Notes

`{{OPTIONAL_GUIDANCE. Describe known patterns or sequencing, not a complete code solution unless that is intentionally the task contract.}}`

#### Acceptance Criteria

- [ ] `{{OBSERVABLE_TASK_CRITERION}}`
- [ ] `{{OBSERVABLE_TASK_CRITERION}}`
- [ ] `{{ERROR_OR_EDGE_CRITERION}}`
- [ ] Referenced architecture constraints are preserved.

#### Verification

- Static: `{{COMMAND_OR_NA}}`
- Tests: `{{COMMAND_OR_TEST_SCOPE}}`
- Build: `{{COMMAND_OR_NA}}`
- Runtime/manual: `{{SCENARIO_OR_NA}}`
- Architecture-sensitive evidence: `{{ORDERING / AUTHZ / IDEMPOTENCY / REPLAY / CACHE / FAILURE / LOAD / OTHER_OR_NA}}`
- Regression: `{{NEIGHBORING_FLOW_OR_NA}}`

#### Out of Scope

- `{{NEARBY_BUT_EXCLUDED_WORK}}`

#### Completion Evidence

- Commit/PR: `{{LINK_OR_PENDING}}`
- Verification record: `{{EVIDENCE_OR_PENDING}}`
- Architecture evidence: `{{EVIDENCE_OR_NA}}`
- Notes/limitations: `{{NOTES_OR_NONE}}`

---

### T-002 — `{{TASK_TITLE}}`

**Status:** `{{STATUS}}`  
**Objective:** `{{ONE_COHERENT_OUTCOME}}`

#### Context

- Requirements: `{{FR_IDS / AC_IDS}}`
- System architecture: `{{ARCH_SECTION_OR_NA}}`
- Design: `{{DESIGN_SECTION_OR_NA}}`

#### Dependencies

- `{{DEPENDENCY}}`

#### Scope

- `{{SCOPE}}`

#### Affected Areas

- `{{AREA}}`

#### Constraints

- `{{CONSTRAINT}}`
- Preserve `{{ARCHITECTURE_CONSTRAINT_OR_NA}}`.

#### Acceptance Criteria

- [ ] `{{CRITERION}}`
- [ ] `{{CRITERION}}`

#### Verification

- `{{VERIFICATION}}`

#### Out of Scope

- `{{OUT_OF_SCOPE}}`

#### Completion Evidence

- `{{PENDING}}`

## 5. Integration / Closure Task

For Level 2/3 features, include a final task when useful:

### T-XXX — Feature Integration and Verification

**Objective:** demonstrate the feature end to end and close remaining specification, architecture-evidence, and documentation work.

Typical acceptance:

- [ ] all in-scope tasks complete;
- [ ] acceptance criteria mapped to evidence;
- [ ] applicable architecture claims mapped to evidence;
- [ ] integration/build checks pass;
- [ ] relevant regression flow passes;
- [ ] migration/security/release checks complete where applicable;
- [ ] feature verification document updated;
- [ ] durable documentation/context refreshed if shared truth changed.

## 6. Discovered Work

Record newly discovered work that should **not** be silently absorbed into active tasks.

| ID | Discovery | Required for current feature? | Decision / Follow-Up |
|---|---|---|---|
| DW-001 | `{{DISCOVERY}}` | `{{YES/NO}}` | `{{TASK / DEFER / SPEC CHANGE / ARCHITECTURE CHANGE}}` |

If a discovery changes an approved architecture decision, block affected tasks until the architecture/ADR is intentionally updated.

## 7. Task Readiness Checklist

Before marking a task ready for an AI coding agent:

- [ ] Objective is singular and understandable.
- [ ] Requirement references are current.
- [ ] Relevant system-architecture constraints are current or explicitly N/A.
- [ ] Implementation-design references are current.
- [ ] Blocking questions are resolved.
- [ ] Scope/out-of-scope are explicit.
- [ ] Dependencies are satisfied or visible.
- [ ] High-impact decisions are approved.
- [ ] Acceptance criteria are observable.
- [ ] Verification, including architecture-sensitive evidence when relevant, is feasible.
