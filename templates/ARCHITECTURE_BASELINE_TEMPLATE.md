# Architecture Baseline — `{{PROJECT_NAME}}`

**Status:** `{{DRAFT | REVIEW | APPROVED | SUPERSEDED}}`  
**Owner:** `{{OWNER}}`  
**Last Updated:** `{{YYYY-MM-DD}}`

## 1. Purpose

This document defines the shared architecture baseline for `{{PROJECT_NAME}}`. It captures cross-feature boundaries and constraints. Feature-local implementation detail should remain in feature design documents unless it becomes a shared architectural rule.

## 2. System Context

### System Purpose

`{{ONE_PARAGRAPH_SYSTEM_PURPOSE}}`

### Actors and External Systems

| Actor/System | Relationship | Trust Boundary / Notes |
|---|---|---|
| `{{ACTOR_OR_SYSTEM}}` | `{{RELATIONSHIP}}` | `{{NOTES}}` |

### Context Diagram

```text
{{ASCII_OR_MERMAID_CONTEXT_DIAGRAM}}
```

## 3. Technology Stack

| Concern | Technology | Reason / Constraint |
|---|---|---|
| Language/runtime | `{{STACK}}` | `{{WHY}}` |
| Client/framework | `{{STACK}}` | `{{WHY}}` |
| Backend/API | `{{STACK}}` | `{{WHY}}` |
| Database | `{{STACK}}` | `{{WHY}}` |
| Auth | `{{STACK}}` | `{{WHY}}` |
| State | `{{STACK}}` | `{{WHY}}` |
| Testing | `{{STACK}}` | `{{WHY}}` |
| Deployment | `{{STACK}}` | `{{WHY}}` |

Significant stack choices should link to ADRs when appropriate.

## 4. Primary Components

| Component | Responsibility | Owns | Does Not Own |
|---|---|---|---|
| `{{COMPONENT}}` | `{{RESPONSIBILITY}}` | `{{OWNERSHIP}}` | `{{NON_OWNERSHIP}}` |

## 5. Module / Trust Boundaries

Define boundaries that future features must respect.

### Boundary B-001 — `{{NAME}}`

- Inside: `{{WHAT}}`
- Outside: `{{WHAT}}`
- Allowed communication: `{{HOW}}`
- Prohibited shortcut: `{{PROHIBITED}}`
- Rationale: `{{WHY}}`

## 6. Dependency Direction

```text
{{DEPENDENCY_DIAGRAM}}
```

Rules:

1. `{{RULE}}`
2. `{{RULE}}`
3. `{{RULE}}`

Cycles/exceptions: `{{NONE_OR_DOCUMENTED_EXCEPTION}}`.

## 7. Data Flow

### Primary Flow

```text
{{INPUT}}
  → {{VALIDATION}}
  → {{APPLICATION_OR_DOMAIN}}
  → {{PERSISTENCE_OR_EXTERNAL_SERVICE}}
  → {{OUTPUT}}
```

### Data Classification

| Data | Owner | Persistence | Sensitivity | Notes |
|---|---|---|---|---|
| `{{DATA}}` | `{{OWNER}}` | `{{WHERE}}` | `{{PUBLIC/INTERNAL/PII/SECRET}}` | `{{NOTES}}` |

## 8. State Ownership

| State | Owner | Source of Truth | Mutation Path | Invalidation/Sync |
|---|---|---|---|---|
| `{{STATE}}` | `{{OWNER}}` | `{{SOURCE}}` | `{{PATH}}` | `{{RULE}}` |

Avoid multiple writable sources of truth without explicit reconciliation.

## 9. API / Contract Boundary

- API style: `{{REST_GRAPHQL_RPC_INTERNAL_NA}}`
- Contract source: `{{PATH_OR_TOOL}}`
- Validation boundary: `{{BOUNDARY}}`
- Error model: `{{MODEL}}`
- Versioning/backward compatibility: `{{RULE}}`
- Idempotency/retry: `{{RULE_OR_NA}}`
- Public consumers: `{{CONSUMERS_OR_NA}}`

## 10. Database / Persistence

- Primary persistence: `{{DATABASE}}`
- Schema source: `{{SCHEMA_SOURCE}}`
- Migration mechanism: `{{MIGRATION_MECHANISM}}`
- Access boundary: `{{ACCESS_BOUNDARY}}`
- Transaction model: `{{TRANSACTION_RULE}}`
- Authorization/RLS: `{{AUTHZ_RULE}}`
- Backup/recovery assumptions: `{{ASSUMPTIONS}}`

### Core Invariants

- `{{INVARIANT}}`
- `{{INVARIANT}}`

## 11. External Services

| Service | Purpose | Data Sent | Auth | Failure Strategy | Replacement/Coupling Notes |
|---|---|---|---|---|---|
| `{{SERVICE}}` | `{{PURPOSE}}` | `{{DATA}}` | `{{AUTH}}` | `{{FAILURE}}` | `{{NOTES}}` |

## 12. Authentication

- Identity provider/mechanism: `{{AUTH}}`
- Session/token lifecycle: `{{LIFECYCLE}}`
- Client storage rule: `{{RULE}}`
- Revocation/expiry: `{{RULE}}`

## 13. Authorization

- Authorization decision point: `{{TRUSTED_BOUNDARY}}`
- Role/permission model: `{{MODEL}}`
- Resource/tenant ownership: `{{RULE}}`
- Default policy: `{{ALLOW_OR_DENY}}`
- Verification strategy: `{{TESTS}}`

## 14. Error and Failure Handling

### Error Model

`{{HOW_ERRORS_ARE_REPRESENTED_AND_PROPAGATED}}`

### Failure Categories

| Category | Handling | Retry? | User/System Signal | Logging |
|---|---|---|---|---|
| validation | `{{HANDLING}}` | No | `{{SIGNAL}}` | `{{RULE}}` |
| authorization | `{{HANDLING}}` | No | `{{SIGNAL}}` | `{{RULE}}` |
| transient dependency | `{{HANDLING}}` | `{{YES/NO}}` | `{{SIGNAL}}` | `{{RULE}}` |
| internal unexpected | `{{HANDLING}}` | `{{RULE}}` | `{{SIGNAL}}` | `{{RULE}}` |

## 15. Security Baseline

- Secrets: `{{SECRET_POLICY}}`
- Input validation: `{{RULE}}`
- PII: `{{RULE}}`
- File/storage security: `{{RULE_OR_NA}}`
- Audit/logging: `{{RULE}}`
- Production access: `{{RULE}}`
- Threat model location: `{{PATH_OR_NA}}`

## 16. Performance / Scalability

State known constraints rather than speculative future architecture.

- Expected load/data volume: `{{EXPECTATION}}`
- Critical latency path: `{{PATH_OR_NA}}`
- Caching strategy: `{{STRATEGY_OR_NONE}}`
- Scaling constraint: `{{CONSTRAINT}}`
- Performance measurement: `{{METHOD}}`

## 17. Observability

- Logs: `{{LOGGING_STRATEGY}}`
- Metrics: `{{METRICS_STRATEGY}}`
- Tracing: `{{TRACING_OR_NA}}`
- Error reporting: `{{ERROR_REPORTING}}`
- Audit events: `{{AUDIT_OR_NA}}`

## 18. Testing Strategy

- Unit: `{{SCOPE}}`
- Integration: `{{SCOPE}}`
- Contract: `{{SCOPE_OR_NA}}`
- UI/component: `{{SCOPE_OR_NA}}`
- E2E: `{{SCOPE_OR_NA}}`
- Migration/security: `{{SCOPE_OR_NA}}`
- Build targets: `{{TARGETS}}`

## 19. Deployment Model

- Environments: `{{ENVIRONMENTS}}`
- Build artifact: `{{ARTIFACT}}`
- Deployment mechanism: `{{MECHANISM}}`
- Configuration management: `{{CONFIG}}`
- Migration order: `{{ORDER_OR_NA}}`
- Rollback/roll-forward: `{{STRATEGY}}`

## 20. Known Constraints

- **C-001:** `{{CONSTRAINT}}`
- **C-002:** `{{CONSTRAINT}}`

## 21. Risks

| ID | Risk | Impact | Mitigation / Evidence Needed |
|---|---|---|---|
| AR-001 | `{{RISK}}` | `{{IMPACT}}` | `{{MITIGATION}}` |

## 22. Architecture Decisions

| ADR | Decision | Status |
|---|---|---|
| `{{ADR_LINK}}` | `{{DECISION}}` | `{{STATUS}}` |

## 23. Open Questions

| ID | Question | Blocking? | Owner | Status |
|---|---|---|---|---|
| AQ-001 | `{{QUESTION}}` | `{{YES/NO}}` | `{{OWNER}}` | Pending |

## 24. Approval and Change Rule

- Architecture owner: `{{OWNER}}`
- Approved date: `{{DATE}}`
- Cross-feature or expensive-to-reverse architecture changes require: `{{APPROVAL_AND_ADR_RULE}}`
