# Code Review — `{{PR_OR_CHANGE_TITLE}}`

**Reviewer:** `{{REVIEWER}}`  
**Change Ref:** `{{PR / COMMIT / DIFF}}`  
**Requirements / Task:** `{{LINKS}}`  
**Date:** `{{YYYY-MM-DD}}`

## 1. Summary

### Intended Change

`{{What the change is supposed to do.}}`

### Reviewed Scope

- `{{FILES / COMPONENTS / DIFF_SCOPE}}`

### Overall Assessment

`{{APPROVE | APPROVE_WITH_MINOR_NOTES | CHANGES_REQUIRED | BLOCKED_BY_MISSING_CONTEXT}}`

`{{One concise reason.}}`

## 2. Correctness

Review against requirements before style.

- [ ] In-scope requirements/acceptance criteria are implemented.
- [ ] Happy path is correct.
- [ ] Important edge/failure behavior is correct.
- [ ] State transitions/concurrency are safe where relevant.
- [ ] Existing behavior outside scope is preserved.

Notes:

`{{NOTES}}`

## 3. Architecture

- [ ] Responsibilities are in the intended component/layer.
- [ ] Dependency direction is preserved.
- [ ] No accidental shared/global abstraction is introduced.
- [ ] External/provider coupling respects boundaries.
- [ ] Public/data contract changes are explicit and approved.

Notes:

`{{NOTES}}`

## 4. Security and Data Integrity

Remove or mark N/A when not relevant.

- [ ] Authentication assumptions are correct.
- [ ] Authorization is enforced at a trusted boundary.
- [ ] User-controlled input is validated.
- [ ] Secrets/PII are not exposed.
- [ ] Data isolation/RLS/policies are preserved.
- [ ] Migration/destructive operations are safe and approved.
- [ ] File/external-service risks are handled where relevant.

Notes:

`{{NOTES}}`

## 5. Testing and Verification

- [ ] Tests target changed behavior.
- [ ] Important negative cases exist.
- [ ] Existing tests were not weakened merely to pass.
- [ ] Integration/contract tests exist where mocks are insufficient.
- [ ] Required static/build/runtime checks were run.
- [ ] Regression scope is appropriate.

Verification evidence reviewed:

- `{{COMMAND / CI / VERIFICATION DOC}}`

## 6. Maintainability / Readability

- [ ] Responsibilities and names are understandable.
- [ ] Control flow is no more complex than necessary.
- [ ] Abstractions are justified by current needs.
- [ ] Duplication is acceptable or intentionally handled.
- [ ] Comments explain non-obvious rationale, not obvious syntax.
- [ ] New dependency is justified if present.

Notes:

`{{NOTES}}`

## 7. Performance / Operations

Only when relevant:

- [ ] Query/network/rendering/resource impact is acceptable.
- [ ] No obvious unbounded work/N+1/regression is introduced.
- [ ] Logging/metrics are appropriate for new operational risk.
- [ ] Rollout/migration/rollback concerns are handled.

Notes:

`{{NOTES_OR_NA}}`

## 8. Scope Discipline

- [ ] No unrelated refactor.
- [ ] No speculative feature.
- [ ] No unexpected dependency or generated changes.
- [ ] Diff is coherent and reviewable.

Notes:

`{{NOTES}}`

## 9. Findings

Severity definitions:

- **BLOCKER** — security/data-loss/critical correctness/build/compatibility issue that must be fixed before merge/release.
- **MAJOR** — significant correctness, architecture, testing, or regression problem; normally must be fixed.
- **MINOR** — real but limited-impact improvement.
- **NIT** — optional polish/preference.

### Finding CR-001 — `{{TITLE}}`

- **Severity:** `{{BLOCKER | MAJOR | MINOR | NIT}}`
- **Location:** `{{PATH:LINE / COMPONENT}}`
- **Problem:** `{{Evidence-based description of what is wrong.}}`
- **Impact:** `{{Why it matters.}}`
- **Recommendation:** `{{Smallest effective correction or question.}}`

### Finding CR-002 — `{{TITLE}}`

- **Severity:** `{{SEVERITY}}`
- **Location:** `{{LOCATION}}`
- **Problem:** `{{PROBLEM}}`
- **Impact:** `{{IMPACT}}`
- **Recommendation:** `{{RECOMMENDATION}}`

If no findings: `No blocking or material findings within reviewed scope.`

## 10. Unverified / Missing Context

List anything that limits review confidence.

- `{{e.g. migration not available, CI pending, requirements unclear}}`

## 11. Final Recommendation

`{{APPROVE / REQUEST_CHANGES / BLOCK}}`

Required before merge:

- `{{FINDING_IDS_OR_NONE}}`

Optional follow-up:

- `{{MINOR_OR_NIT_FOLLOW_UP_OR_NONE}}`
