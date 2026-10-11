# Feature Verification — `{{FEATURE_ID}}: {{FEATURE_NAME}}`

**Verification Status:** `{{NOT_STARTED | IN_PROGRESS | PASS | PASS_WITH_LIMITATIONS | FAIL}}`  
**Implementation Ref:** `{{COMMIT / PR / RELEASE REF}}`  
**Environment:** `{{LOCAL | CI | STAGING | PRODUCTION | OTHER}}`  
**Verified By:** `{{PERSON_OR_AGENT}}`  
**Date:** `{{YYYY-MM-DD}}`

## 1. Verification Scope

Requirements: `{{REQUIREMENTS_PATH}}`  
System Architecture: `{{SYSTEM_ARCHITECTURE_PATH_OR_NA}}`  
Design: `{{DESIGN_PATH}}`  
Tasks: `{{TASKS_PATH}}`

This verification covers: `{{IN_SCOPE}}`.

Not covered / intentionally deferred: `{{OUT_OF_SCOPE_OR_NONE}}`.

## 2. Requirement Coverage

Map each in-scope acceptance criterion to concrete evidence.

| Requirement | Acceptance Criterion | Evidence | Result | Notes |
|---|---|---|---|---|
| FR-001 | AC-001.1 | `{{TEST / COMMAND / SCREENSHOT / MANUAL SCENARIO}}` | `PASS/FAIL/NOT_RUN` | `{{NOTES}}` |
| FR-001 | AC-001.2 | `{{EVIDENCE}}` | `{{RESULT}}` | `{{NOTES}}` |

Rules:

- `PASS` requires actual evidence.
- `NOT_RUN` must include reason and residual risk.
- Do not mark the feature fully verified while blocking acceptance criteria remain unverified.

## 3. Architecture Claim Verification

Remove if the feature has no separate module system architecture or no architecture-sensitive claims requiring direct evidence.

Map important architecture claims to evidence. Do not convert design intent into proof.

| Architecture claim / risk | Architecture ref | Evidence / procedure | Result | Notes |
|---|---|---|---|---|
| `{{AUTHORIZATION_ISOLATION / ORDERING / IDEMPOTENCY / REPLAY / CACHE_FRESHNESS / FAILURE_RECOVERY / LATENCY / OTHER}}` | `{{SECTION}}` | `{{TEST / LOAD TEST / FAILURE INJECTION / MANUAL / METRIC}}` | `{{PASS/FAIL/NOT_RUN}}` | `{{NOTES}}` |

Possible evidence when relevant:

- allowed/denied authorization tests;
- ordering and duplicate/idempotency tests;
- reconnect and missed-event replay scenarios;
- cache invalidation/freshness checks;
- timeout/retry/degradation behavior;
- integration failure/partial-failure scenarios;
- performance/load measurement;
- migration/backward-compatibility evidence;
- sensitive-data logging checks;
- cost/usage signal review where architecture depends on an operational budget.

If an architecture claim was intentionally not verified, record the reason and residual risk in Section 13.

## 4. Static Verification

| Check | Command / Procedure | Result | Evidence / Notes |
|---|---|---|---|
| Format | `{{COMMAND}}` | `{{PASS/FAIL/NOT_RUN}}` | `{{NOTES}}` |
| Lint/static analysis | `{{COMMAND}}` | `{{RESULT}}` | `{{NOTES}}` |
| Type check/compiler diagnostics | `{{COMMAND_OR_NA}}` | `{{RESULT}}` | `{{NOTES}}` |
| Schema/codegen consistency | `{{COMMAND_OR_NA}}` | `{{RESULT}}` | `{{NOTES}}` |

## 5. Automated Test Results

### Unit

- Command: `{{COMMAND_OR_NA}}`
- Result: `{{PASS/FAIL/NOT_RUN}}`
- Relevant tests: `{{TEST_NAMES_OR_SCOPE}}`
- Notes: `{{NOTES}}`

### Integration / Contract

- Command: `{{COMMAND_OR_NA}}`
- Result: `{{RESULT}}`
- Scope: `{{SCOPE}}`
- Notes: `{{NOTES}}`

### Component / Widget / E2E

- Command: `{{COMMAND_OR_NA}}`
- Result: `{{RESULT}}`
- Scope: `{{SCOPE}}`
- Notes: `{{NOTES}}`

### Load / Reliability / Failure Testing

Remove if not applicable.

- Procedure/command: `{{COMMAND_OR_NA}}`
- Result: `{{RESULT}}`
- Architecture claim covered: `{{CLAIM}}`
- Notes: `{{NOTES}}`

## 6. Build / Compile Results

| Target | Command | Result | Notes |
|---|---|---|---|
| `{{TARGET}}` | `{{COMMAND}}` | `{{PASS/FAIL/NOT_RUN}}` | `{{NOTES}}` |

## 7. Manual / Runtime Verification

### Scenario MV-001 — `{{SCENARIO_NAME}}`

- Preconditions: `{{PRECONDITIONS}}`
- Steps:
  1. `{{STEP}}`
  2. `{{STEP}}`
  3. `{{STEP}}`
- Expected: `{{EXPECTED}}`
- Actual: `{{ACTUAL}}`
- Result: `{{PASS/FAIL}}`
- Evidence: `{{SCREENSHOT / LOG / RESPONSE / NONE}}`

### Scenario MV-002 — `{{ERROR_OR_EDGE_SCENARIO}}`

- Preconditions: `{{PRECONDITIONS}}`
- Steps: `{{STEPS}}`
- Expected: `{{EXPECTED}}`
- Actual: `{{ACTUAL}}`
- Result: `{{RESULT}}`

## 8. Security / Authorization Verification

Remove if not applicable.

| Scenario | Expected | Evidence | Result |
|---|---|---|---|
| allowed actor | `{{EXPECTED}}` | `{{TEST}}` | `{{RESULT}}` |
| unauthorized actor | denied | `{{TEST}}` | `{{RESULT}}` |
| cross-resource/tenant access | denied | `{{TEST}}` | `{{RESULT}}` |
| invalid input | rejected safely | `{{TEST}}` | `{{RESULT}}` |

## 9. Database / Migration Verification

Remove if not applicable.

- Architecture/storage decision ref: `{{ARCH_REF_OR_NA}}`
- Migration version/ref: `{{REF}}`
- Migration applied in: `{{ENVIRONMENT}}`
- Existing data impact checked: `{{YES/NO + EVIDENCE}}`
- Backfill verified: `{{YES/NO/NA}}`
- Constraint/index verification: `{{EVIDENCE}}`
- Old/new compatibility verified: `{{EVIDENCE}}`
- Rollback/roll-forward consideration: `{{NOTES}}`

## 10. Regression Check

Identify neighboring behavior selected by risk.

| Flow / Contract | Why At Risk | Verification | Result |
|---|---|---|---|
| `{{FLOW}}` | `{{COUPLING}}` | `{{TEST / MANUAL}}` | `{{RESULT}}` |

## 11. Performance / Operational Verification

Remove if not applicable.

- Performance target/measurement: `{{EVIDENCE}}`
- Workload/capacity assumption validated: `{{YES/NO + EVIDENCE}}`
- Logs/metrics expected: `{{SIGNAL}}`
- Error reporting/monitoring: `{{EVIDENCE}}`
- Release/feature-flag configuration: `{{EVIDENCE}}`
- Architecture redesign trigger observed: `{{NO / YES + DETAIL}}`

## 12. Known Issues / Limitations

| ID | Issue / Limitation | Severity | Impact | Follow-Up |
|---|---|---|---|---|
| KI-001 | `{{ISSUE}}` | `{{BLOCKER/MAJOR/MINOR}}` | `{{IMPACT}}` | `{{TASK/LINK}}` |

If none: `None known within verified scope.`

## 13. Unrun Checks and Residual Risk

| Check / Claim Not Verified | Reason | Residual Risk | Required Before Release? |
|---|---|---|---|
| `{{CHECK_OR_ARCH_CLAIM}}` | `{{REASON}}` | `{{RISK}}` | `{{YES/NO}}` |

## 14. Architecture Conformance Summary

Remove if no module architecture exists.

- Approved system architecture followed: `{{YES / NO / PARTIAL}}`
- Architecture deviations found: `{{NONE_OR_DESCRIPTION}}`
- Approved exception/ADR: `{{NONE_OR_LINK}}`
- Architecture documentation needs update: `{{NO / YES + PATH}}`
- Global architecture promotion required: `{{NO / YES + REASON}}`

A passing implementation must not hide an architecture drift simply because tests are green.

## 15. Final Status

**Result:** `{{PASS | PASS_WITH_LIMITATIONS | FAIL}}`

### Summary

`{{Concise evidence-based conclusion. Do not use "should work" as verification.}}`

### Release / Merge Recommendation

`{{READY | NOT_READY | READY_WITH_EXPLICIT_ACCEPTED_RISK}}`

### Required Follow-Up

- `{{FOLLOW_UP_OR_NONE}}`
