# Feature Requirements — `{{FEATURE_ID}}: {{FEATURE_NAME}}`

**Status:** `{{DRAFT | REVIEW | APPROVED | IMPLEMENTING | VERIFICATION | IMPLEMENTED | SUPERSEDED}}`  
**Owner:** `{{OWNER}}`  
**Created:** `{{YYYY-MM-DD}}`  
**Last Updated:** `{{YYYY-MM-DD}}`  
**Related PRD:** `{{PATH_OR_SECTION}}`

## 1. Context

`{{Where does this feature fit in the product? Why is it being considered now?}}`

## 2. Problem

### Current Behavior

`{{CURRENT_BEHAVIOR}}`

### Problem / Impact

`{{WHY_CURRENT_BEHAVIOR_IS_INSUFFICIENT}}`

## 3. Goal

`{{OBSERVABLE_OUTCOME}}`

### Success for This Feature

- `{{SUCCESS_SIGNAL}}`
- `{{SUCCESS_SIGNAL}}`

## 4. Actors

### ACTOR-001 — `{{ACTOR}}`

- Role: `{{ROLE}}`
- Relevant permission: `{{PERMISSION}}`
- Relevant constraint: `{{CONSTRAINT}}`

## 5. User Stories / Use Cases

### US-001

As a `{{ACTOR}}`, I want `{{CAPABILITY}}` so that `{{OUTCOME}}`.

### Primary Flow

1. `{{STEP}}`
2. `{{STEP}}`
3. `{{STEP}}`

## 6. Preconditions

- **PRE-001:** `{{PRECONDITION}}`
- **PRE-002:** `{{PRECONDITION}}`

## 7. Functional Requirements

### FR-001 — `{{TITLE}}`

The system shall `{{PRECISE_OBSERVABLE_BEHAVIOR}}`.

Acceptance criteria:

- **AC-001.1:** Given `{{STATE}}`, when `{{ACTION}}`, then `{{RESULT}}`.
- **AC-001.2:** Given `{{EDGE_OR_FAILURE_STATE}}`, when `{{ACTION}}`, then `{{RESULT}}`.

### FR-002 — `{{TITLE}}`

The system shall `{{BEHAVIOR}}`.

Acceptance criteria:

- **AC-002.1:** `{{CRITERION}}`
- **AC-002.2:** `{{CRITERION}}`

## 8. Business Rules

- **BR-001:** `{{RULE}}`
- **BR-002:** `{{RULE}}`

## 9. Validation Rules

| ID | Input / State | Rule | Failure Behavior |
|---|---|---|---|
| VAL-001 | `{{INPUT}}` | `{{RULE}}` | `{{ERROR_BEHAVIOR}}` |

## 10. States and Transitions

Use only if state lifecycle matters.

| State | Meaning | Allowed Transition | Invalid Transition Behavior |
|---|---|---|---|
| `{{STATE}}` | `{{MEANING}}` | `{{NEXT}}` | `{{BEHAVIOR}}` |

## 11. Edge Cases and Failure States

### EC-001 — `{{CASE}}`

- Condition: `{{CONDITION}}`
- Required behavior: `{{BEHAVIOR}}`

### EC-002 — `{{CASE}}`

- Condition: `{{CONDITION}}`
- Required behavior: `{{BEHAVIOR}}`

Consider only relevant categories: empty, duplicate, stale, concurrent, offline, unauthorized, missing resource, partial failure, retry, timeout, platform/locale boundary.

## 12. Non-Functional Requirements

- **NFR-PERF-001:** `{{PERFORMANCE_EXPECTATION_OR_NA}}`
- **NFR-SEC-001:** `{{SECURITY_EXPECTATION_OR_NA}}`
- **NFR-REL-001:** `{{RELIABILITY_EXPECTATION_OR_NA}}`
- **NFR-A11Y-001:** `{{ACCESSIBILITY_EXPECTATION_OR_NA}}`
- **NFR-COMP-001:** `{{COMPATIBILITY_EXPECTATION_OR_NA}}`
- **NFR-OBS-001:** `{{OBSERVABILITY_EXPECTATION_OR_NA}}`

Remove irrelevant NFR categories.

## 13. Constraints

- **C-001:** `{{CONSTRAINT}}`
- **C-002:** `{{CONSTRAINT}}`

Examples: no public API change, no new dependency, preserve current storage format, support existing client version.

## 14. Dependencies

| ID | Dependency | Type | Blocking? | Status |
|---|---|---|---|---|
| DEP-001 | `{{DEPENDENCY}}` | `{{FEATURE/DECISION/EXTERNAL}}` | `{{YES/NO}}` | `{{STATUS}}` |

## 15. Out of Scope

- **OOS-001:** `{{EXCLUDED_BEHAVIOR}}`
- **OOS-002:** `{{EXCLUDED_BEHAVIOR}}`

## 16. Assumptions

- **ASM-001:** `{{ASSUMPTION}}` — validation: `{{HOW}}`

## 17. Open Questions

| ID | Question | Owner | Blocking? | Resolution / Status |
|---|---|---|---|---|
| OQ-001 | `{{QUESTION}}` | `{{OWNER}}` | `{{YES/NO}}` | Pending |

Implementation must not silently decide blocking questions.

## 18. Requirement Traceability Summary

| Requirement | Acceptance Criteria | Design Section | Task(s) | Verification |
|---|---|---|---|---|
| FR-001 | AC-001.1, AC-001.2 | `{{LINK}}` | `{{TASK_IDS}}` | `{{PENDING}}` |

This table may be completed progressively for Level 2/3 features.

## 19. Approval

- Decision owner: `{{NAME}}`
- Status: `{{STATUS}}`
- Approved date: `{{DATE_OR_PENDING}}`
- Notes: `{{NOTES}}`
