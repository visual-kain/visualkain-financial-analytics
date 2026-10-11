# Context Refresh Record — `{{TRIGGER_OR_MILESTONE}}`

**Date:** `{{YYYY-MM-DD}}`  
**Trigger:** `{{FEATURE_COMPLETION | RELEASE | ARCHITECTURE_CHANGE | MIGRATION | REFACTOR | SECURITY_CHANGE | OTHER}}`  
**Owner:** `{{OWNER}}`  
**Scope:** `{{AREAS_REVIEWED}}`

> Use this record only when a refresh is substantial enough to benefit from an explicit audit trail. Small documentation updates do not require a separate refresh document.

## 1. Changed Truth

List facts that became true or stopped being true.

| ID | Changed Truth | Previous State | New State | Canonical Owner |
|---|---|---|---|---|
| CT-001 | `{{FACT}}` | `{{OLD}}` | `{{NEW}}` | `{{DOC / CODE / SCHEMA}}` |

## 2. Canonical Documentation Updated

| Artifact | Change | Reason |
|---|---|---|
| `{{PATH}}` | `{{SUMMARY}}` | `{{CHANGED_TRUTH_ID}}` |

If no update was required, state why.

## 3. Architecture Updated

- Architecture changed? `{{YES/NO}}`
- Updated artifacts: `{{PATHS_OR_NONE}}`
- ADR created/superseded: `{{LINKS_OR_NONE}}`
- New/changed boundaries: `{{SUMMARY_OR_NONE}}`
- Dependency/state/data ownership changes: `{{SUMMARY_OR_NONE}}`

## 4. `AGENTS.md` Updated

- Updated? `{{YES/NO}}`
- Reason: `{{PERMANENT_FREQUENTLY_RELEVANT_RULE_CHANGED / NO_DURABLE_CHANGE}}`
- Sections changed: `{{SECTIONS_OR_NONE}}`

Do not add feature history or transient status to `AGENTS.md`.

## 5. Source-of-Truth Consistency

- [ ] Product scope points to current canonical docs.
- [ ] Architecture references are current.
- [ ] Feature requirements/design status is correct.
- [ ] Code/tests/schema reflect intended implementation truth.
- [ ] Task/execution state has one canonical owner.
- [ ] Generated views, if used, are derived and current.

Conflicts found:

- `{{NONE_OR_CONFLICT}}`

Resolution:

- `{{RESOLUTION}}`

## 6. Stale Context Removed or Superseded

| Artifact / Instruction | Action | Reason |
|---|---|---|
| `{{PATH}}` | `{{DELETE / ARCHIVE / SUPERSEDE / EDIT}}` | `{{REASON}}` |

Look for old paths, old commands, obsolete plans, duplicate provider instructions, stale compatibility notes, and resolved "temporary" workarounds.

## 7. Open Questions

### Resolved

| ID | Question | Resolution | Canonical Record |
|---|---|---|---|
| `{{ID}}` | `{{QUESTION}}` | `{{DECISION}}` | `{{PATH}}` |

### Remaining

| ID | Question | Owner | Blocking? | Next Review |
|---|---|---|---|---|
| `{{ID}}` | `{{QUESTION}}` | `{{OWNER}}` | `{{YES/NO}}` | `{{TRIGGER/DATE}}` |

## 8. Archived Temporary Artifacts

| Artifact | Action | Durable Information Extracted To |
|---|---|---|
| `{{HANDOFF / PLAN / SPIKE}}` | `{{ARCHIVED / DELETED}}` | `{{ADR / ARCHITECTURE / RUNBOOK / NONE}}` |

## 9. Commands / Paths Verification

Check frequently used repository facts.

| Item | Verification | Result |
|---|---|---|
| install/dev command | `{{PROCEDURE}}` | `{{PASS/FAIL}}` |
| lint/typecheck | `{{COMMAND}}` | `{{PASS/FAIL}}` |
| test/build | `{{COMMAND}}` | `{{PASS/FAIL}}` |
| referenced paths | `{{LINK/PATH CHECK}}` | `{{PASS/FAIL}}` |

Only run what is relevant to the refresh. This is not automatically a full release verification.

## 10. Context Health Checklist

### Authority

- [ ] One canonical owner exists per major type of truth.
- [ ] Draft/approved/superseded states are clear.
- [ ] Conversation/provider memory is not canonical.

### Relevance

- [ ] Permanent instructions are high-signal.
- [ ] Completed historical details are outside default active context.
- [ ] Feature-local detail is not duplicated globally.

### Freshness

- [ ] Commands/paths are current.
- [ ] Architecture matches current approved design.
- [ ] Resolved questions are no longer pending.
- [ ] Compatibility/migration notes reflect current phase.

### Duplication

- [ ] Provider-specific files are thin adapters.
- [ ] No duplicate manually maintained status boards.
- [ ] No full copied canonical documents remain after reorganization.

### Context Efficiency

- [ ] A coding agent can execute a normal task from minimum sufficient context.
- [ ] Optional generated state/context tooling is still justified if present.

## 11. Remaining Risks

- `{{RISK_OR_NONE}}`

## 12. Final Refresh Status

`{{HEALTHY | HEALTHY_WITH_FOLLOW_UP | INCONSISTENT}}`

Follow-up actions:

- `{{ACTION_OR_NONE}}`
