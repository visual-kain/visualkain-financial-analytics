# Project Constitution — `{{PROJECT_NAME}}`

**Status:** `{{DRAFT | APPROVED | SUPERSEDED}}`  
**Owner:** `{{OWNER}}`  
**Effective Date:** `{{YYYY-MM-DD}}`  
**Last Reviewed:** `{{YYYY-MM-DD}}`

## 1. Purpose

This constitution defines the durable engineering principles and governance rules for `{{PROJECT_NAME}}`. It explains **why** the project is engineered in a particular way and which decisions require stronger control.

It is distinct from `AGENTS.md`:

- Constitution: governing principles and durable policy.
- `AGENTS.md`: actionable repository instructions and commands.

## 2. Project Context

- Product/system purpose: `{{PURPOSE}}`
- Lifecycle stage: `{{STAGE}}`
- Expected scale/criticality: `{{SCALE_AND_CRITICALITY}}`
- Primary constraints: `{{CONSTRAINTS}}`

## 3. Engineering Principles

### 3.1 Specification and Scope

- Non-trivial changes require enough specification to make behavior, constraints, and verification explicit.
- Documentation depth scales with complexity/risk.
- Feature work must remain inside approved scope.
- `{{PROJECT_SPECIFIC_SCOPE_RULE}}`

### 3.2 Simplicity

- Prefer the simplest design that satisfies known requirements.
- Avoid speculative abstractions and premature platform complexity.
- Reuse existing project patterns unless a deliberate design change is approved.
- `{{SIMPLICITY_RULE}}`

### 3.3 Evidence

- Completion claims require appropriate verification evidence.
- Unrun checks are reported explicitly with residual risk.
- `{{EVIDENCE_RULE}}`

### 3.4 Reversibility

- Prefer reversible/additive changes when uncertainty or data risk is high.
- Expensive-to-reverse decisions require explicit rationale.
- `{{REVERSIBILITY_RULE}}`

## 4. Architecture Principles

- Architecture defines boundaries, ownership, and dependency direction.
- Cross-boundary shortcuts require explicit justification and approval where significant.
- Feature-local designs do not silently redefine global architecture.
- External services are contained behind project-owned boundaries when replacement/coupling risk justifies it.
- `{{ARCHITECTURE_PRINCIPLE}}`

### Architecture Decision Threshold

Create an ADR when a decision is `{{PROJECT_ADR_THRESHOLD}}`.

## 5. Quality Standards

Applicable quality attributes:

- correctness: `{{CORRECTNESS_EXPECTATION}}`
- maintainability: `{{MAINTAINABILITY_EXPECTATION}}`
- performance: `{{PERFORMANCE_EXPECTATION}}`
- reliability: `{{RELIABILITY_EXPECTATION}}`
- accessibility: `{{ACCESSIBILITY_EXPECTATION_OR_NA}}`
- observability: `{{OBSERVABILITY_EXPECTATION_OR_NA}}`

### Quality Gate Principle

Cheap deterministic checks should run routinely; expensive verification should be risk-based.

## 6. Dependency Policy

Before adding/replacing a significant dependency, evaluate:

- problem solved;
- existing/native alternative;
- project fit;
- maintenance health;
- security history;
- runtime/bundle/deployment impact;
- license/compliance impact;
- exit/replacement cost.

Approval rule: `{{DEPENDENCY_APPROVAL_POLICY}}`.

## 7. Testing Policy

- Testing is risk-based, not coverage-percentage theater.
- Critical business/security/data contracts require automated regression protection where practical.
- Integration boundaries require integration/contract evidence when mocks are insufficient.
- No meaningful test may be disabled solely to make CI pass.
- Coverage policy: `{{COVERAGE_POLICY_OR_NONE}}`.
- Required release test gates: `{{RELEASE_TEST_GATES}}`.

## 8. Security Policy

- Never commit secrets or production credentials.
- Enforce authorization at trusted boundaries.
- Treat PII and sensitive data explicitly.
- Destructive production/data operations require explicit approval.
- Security-sensitive changes require explicit verification.
- Production access policy: `{{PRODUCTION_ACCESS_POLICY}}`.
- Additional security requirements: `{{SECURITY_REQUIREMENTS}}`.

## 9. Documentation Policy

- Repository artifacts are the durable source of truth.
- Raw conversation history is not canonical documentation.
- Each major type of truth should have one canonical owner.
- Link to canonical sources instead of copying full content.
- `AGENTS.md` remains high-signal and frequently relevant.
- Major truth changes trigger context refresh.
- Documentation retention/archive policy: `{{DOC_RETENTION_POLICY}}`.

## 10. AI Usage Policy

AI may:

- analyze and explain;
- draft requirements/design/tasks;
- propose alternatives;
- inspect repository state when tools allow;
- implement approved tasks;
- write/update tests;
- run deterministic checks;
- draft evidence-grounded documentation.

AI must not silently decide:

- product direction;
- breaking architecture changes;
- security exceptions;
- destructive database migration;
- production infrastructure changes;
- major dependency replacement;
- public contract breakage.

Project-specific approval boundary: `{{AI_APPROVAL_BOUNDARY}}`.

## 11. Compatibility Policy

- Public/external contract compatibility: `{{COMPATIBILITY_RULE}}`
- Supported client/version window: `{{VERSION_WINDOW_OR_NA}}`
- Migration approach: `{{MIGRATION_PRINCIPLE}}`
- Deprecation policy: `{{DEPRECATION_POLICY_OR_NA}}`

## 12. Governance and Exceptions

### Rule Changes

A durable constitution change requires:

1. reason/context;
2. impact analysis;
3. owner approval;
4. update to affected repository instructions/templates;
5. decision-log/ADR entry where useful.

### Exceptions

Temporary exceptions must document:

- rule being bypassed;
- reason;
- risk;
- owner/approval;
- expiration or review trigger;
- remediation if temporary.

## 13. Review Triggers

Review this constitution when:

- product criticality changes materially;
- architecture/platform changes significantly;
- team/release model changes;
- security/compliance obligations change;
- repeated process friction suggests a governance rule is disproportionate;
- major incident reveals a missing principle.
