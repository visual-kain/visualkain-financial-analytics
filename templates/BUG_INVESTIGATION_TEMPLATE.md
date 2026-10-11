# Bug Investigation — `{{BUG_ID}}: {{TITLE}}`

**Status:** `{{OBSERVING | REPRODUCED | INVESTIGATING | ROOT_CAUSE_FOUND | FIXING | VERIFIED | CLOSED}}`  
**Severity:** `{{BLOCKER | MAJOR | MINOR}}`  
**Owner:** `{{OWNER}}`  
**First Observed:** `{{YYYY-MM-DD HH:MM}}`  
**Environment:** `{{ENVIRONMENT}}`

## 1. Symptom

`{{Describe only the observed symptom. Avoid embedding a suspected cause.}}`

## 2. Expected Behavior

`{{EXPECTED}}`

## 3. Actual Behavior

`{{ACTUAL}}`

## 4. Impact

- Affected users/systems: `{{SCOPE}}`
- Frequency: `{{ALWAYS / INTERMITTENT / UNKNOWN}}`
- Data/security impact: `{{NONE / DESCRIPTION}}`
- Operational impact: `{{NONE / DESCRIPTION}}`

## 5. Environment

- Commit/version: `{{REF}}`
- Runtime/framework: `{{VERSION}}`
- OS/browser/device: `{{DETAILS_OR_NA}}`
- Database/schema version: `{{VERSION_OR_NA}}`
- Feature flags/config: `{{RELEVANT_SAFE_CONFIG}}`
- External service state: `{{DETAIL_OR_NA}}`

Do not include secrets.

## 6. Reproduction

### Preconditions

- `{{PRECONDITION}}`

### Steps

1. `{{STEP}}`
2. `{{STEP}}`
3. `{{STEP}}`

### Reproducibility

`{{e.g. 5/5, 2/10, production-only, not reproduced locally}}`

### Minimal Reproduction

`{{If available, describe the smallest case.}}`

## 7. Evidence

### Logs / Stack Trace

`{{PATH / SAFE EXCERPT / LINK}}`

### API / Network

`{{REQUEST_RESPONSE_SUMMARY_OR_NA}}`

### Database / State

`{{SAFE_QUERY_OR_STATE_SUMMARY_OR_NA}}`

### Screenshot / Recording

`{{LINK_OR_NA}}`

### Relevant Diff / Recent Change

`{{COMMIT_OR_PR_OR_NONE}}`

## 8. Localization

Expected and actual behavior first diverge at:

`{{COMPONENT / BOUNDARY / STATE TRANSITION}}`

Evidence supporting localization:

- `{{EVIDENCE}}`

## 9. Hypotheses

### H-001 — `{{HYPOTHESIS}}`

Prediction if true: `{{PREDICTION}}`

Evidence for: `{{EVIDENCE}}`

Evidence against: `{{EVIDENCE_OR_NONE}}`

Status: `{{OPEN | REJECTED | SUPPORTED}}`

### H-002 — `{{HYPOTHESIS}}`

Prediction if true: `{{PREDICTION}}`

Status: `{{STATUS}}`

## 10. Experiments

### EXP-001 — `{{EXPERIMENT}}`

- Hypothesis tested: `{{H-XXX}}`
- Change/procedure: `{{PROCEDURE}}`
- Expected if hypothesis true: `{{EXPECTED}}`
- Result: `{{RESULT}}`
- Conclusion: `{{CONCLUSION}}`

Experiments are evidence gathering. Remove temporary diagnostics from production code unless intentionally retained as observability.

## 11. Root Cause

`{{Describe the mechanism that caused the symptom, not merely the line where it appeared.}}`

### Contributing Factors

- `{{FACTOR_OR_NONE}}`

### Why Existing Tests/Monitoring Did Not Catch It

`{{GAP_OR_NA}}`

## 12. Fix Plan

- Smallest root-cause correction: `{{PLAN}}`
- Affected components: `{{AREAS}}`
- Contracts that must remain unchanged: `{{CONSTRAINTS}}`
- Security/data impact: `{{IMPACT}}`
- Architecture/spec change required: `{{NO | YES: LINK/DECISION}}`

## 13. Fix

- Implementation ref: `{{COMMIT_OR_PR}}`
- Changed areas: `{{SUMMARY}}`
- Temporary mitigation used: `{{NONE_OR_DESCRIPTION}}`

## 14. Regression Verification

- [ ] Original reproduction no longer fails.
- [ ] Regression test added/updated where practical: `{{TEST}}`.
- [ ] Relevant static checks pass: `{{EVIDENCE}}`.
- [ ] Build/runtime check passes: `{{EVIDENCE}}`.
- [ ] Neighboring flow checked: `{{FLOW_AND_RESULT}}`.

## 15. Residual Risk

`{{NONE_OR_DESCRIPTION}}`

## 16. Lessons / Durable Follow-Up

Only record lessons that improve future engineering.

- Architecture/doc update: `{{NONE_OR_LINK}}`
- Monitoring improvement: `{{NONE_OR_TASK}}`
- Test infrastructure improvement: `{{NONE_OR_TASK}}`
- Process/context change: `{{NONE_OR_TASK}}`

## 17. Postmortem Decision

Postmortem required? `{{YES/NO}}`

Reason: `{{SECURITY / DATA LOSS / OUTAGE / REPEATED SYSTEMIC FAILURE / NOT WARRANTED}}`
