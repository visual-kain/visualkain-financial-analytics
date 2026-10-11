# Feature Design — `{{FEATURE_ID}}: {{FEATURE_NAME}}`

**Status:** `{{DRAFT | REVIEW | APPROVED | SUPERSEDED}}`  
**Owner:** `{{OWNER}}`  
**Requirements:** `{{REQUIREMENTS_PATH}}`  
**System Architecture:** `{{SYSTEM_ARCHITECTURE_PATH_OR_NA}}`  
**Last Updated:** `{{YYYY-MM-DD}}`

> Scale this document to complexity. Remove sections that do not apply. A small/normal feature should not be forced to fill a high-risk design template with empty prose.
>
> When an approved module `system-architecture.md` exists, this document is the **repository implementation mapping** for that architecture. Do not silently re-decide architecture drivers, data ownership, consistency, communication, caching, scale, resilience, security boundaries, or other approved system decisions here. If repository inspection invalidates an architecture assumption, stop and update the canonical architecture/ADR first.

## 1. Design Summary

`{{One-paragraph implementation approach and why it fits the existing global/module architecture.}}`

## 2. Requirements and Architecture Covered

Requirements:

- `{{FR_IDS}}`
- `{{NFR_IDS}}`
- `{{BUSINESS_RULE_IDS}}`

Architecture constraints implemented:

- `{{SYSTEM_ARCHITECTURE_SECTION_OR_DECISION}}`
- `{{GLOBAL_ARCHITECTURE_RULE_OR_NA}}`
- `{{ADR_OR_NA}}`

## 3. Current State

Describe repository reality that matters to the change.

- Current components: `{{COMPONENTS}}`
- Current data flow: `{{FLOW}}`
- Existing constraints/patterns: `{{CONSTRAINTS}}`
- Existing limitations: `{{LIMITATIONS}}`

Do not invent current state; validate against the repository.

## 4. Proposed State

### Overview

`{{PROPOSED_IMPLEMENTATION_APPROACH}}`

### Component Changes

| Component / Area | Change | Responsibility After Change | Architecture constraint served |
|---|---|---|---|
| `{{COMPONENT}}` | `{{CHANGE}}` | `{{RESPONSIBILITY}}` | `{{ARCH_REF_OR_NA}}` |

## 5. Flow

```text
{{ACTOR_OR_TRIGGER}}
  → {{COMPONENT}}
  → {{COMPONENT}}
  → {{DATA_OR_SERVICE}}
  → {{RESULT}}
```

Describe error/alternative branches where important. Keep this concrete enough to map to repository code, while preserving the architecture-level flow and guarantees.

## 6. Architecture Mapping and Impact

- Global architecture boundary used: `{{BOUNDARY}}`
- Module architecture document: `{{PATH_OR_NA}}`
- Module architecture decisions implemented: `{{SECTION_IDS_OR_SUMMARY}}`
- New boundary introduced by implementation: `{{NONE_OR_DESCRIPTION}}`
- Dependency direction change: `{{NONE_OR_DESCRIPTION}}`
- Shared architecture impact: `{{NONE_OR_DESCRIPTION}}`
- New architecture decision discovered: `{{NO | YES: STOP_AND_UPDATE_ARCHITECTURE}}`
- ADR required: `{{NO | YES: LINK}}`

If implementation requires changing an approved architecture decision, explain why a repository-local mapping is insufficient and stop the dependent task until the canonical architecture is updated.

## 7. Domain / Data Model

### Entities / Values

| Concept | Change | Invariant | Architecture source |
|---|---|---|---|
| `{{CONCEPT}}` | `{{CHANGE}}` | `{{INVARIANT}}` | `{{ARCH_OR_REQ_REF}}` |

### Identity / Lifecycle

`{{IDENTIFIER_STATE_TRANSITION_NOTES_OR_NA}}`

## 8. API / Contract Changes

Remove if not applicable.

### Endpoint / Operation `{{NAME}}`

- Consumer: `{{CONSUMER}}`
- Request: `{{REQUEST_CONTRACT}}`
- Response: `{{RESPONSE_CONTRACT}}`
- Validation: `{{VALIDATION}}`
- Auth/authz: `{{SECURITY}}`
- Errors: `{{ERRORS}}`
- Idempotency/retry: `{{RULE}}`
- Backward compatibility: `{{COMPATIBILITY}}`
- Architecture contract implemented: `{{ARCH_REF_OR_NA}}`

If a public contract changes, reference the approval/ADR/migration plan.

## 9. Database / Persistence Changes

Remove if not applicable.

- Architecture storage decision: `{{ARCH_REF_OR_NA}}`
- Schema change: `{{CHANGE}}`
- Migration type: `{{ADDITIVE | TRANSFORMATIVE | DESTRUCTIVE}}`
- Existing data impact: `{{IMPACT}}`
- Access/RLS/policy impact: `{{AUTHZ_IMPACT}}`
- Index/query impact: `{{QUERY_IMPACT}}`
- Transaction requirements: `{{TRANSACTION}}`
- Backfill: `{{BACKFILL_OR_NA}}`
- Compatibility window: `{{WINDOW}}`
- Rollback/roll-forward: `{{PLAN}}`

## 10. State Management

- State owner: `{{OWNER}}`
- Source of truth: `{{SOURCE}}`
- Mutable transitions: `{{TRANSITIONS}}`
- Cache/sync strategy: `{{STRATEGY}}`
- Loading/empty/success/error states: `{{UI_OR_APP_STATES}}`
- Concurrent update handling: `{{RULE_OR_NA}}`
- Architecture consistency/order/idempotency rule implemented: `{{ARCH_REF_OR_NA}}`

## 11. Error and Failure Handling

| Failure | Detection | Handling | User/System Result | Retry/Recovery | Architecture source |
|---|---|---|---|---|---|
| `{{FAILURE}}` | `{{DETECTION}}` | `{{HANDLING}}` | `{{RESULT}}` | `{{RECOVERY}}` | `{{ARCH_REF_OR_NA}}` |

Do not use generic catch-all behavior that hides meaningful errors.

## 12. Security

- Trust boundary: `{{BOUNDARY}}`
- Authentication: `{{RULE}}`
- Authorization: `{{RULE}}`
- Input validation: `{{RULE}}`
- Sensitive data/PII: `{{DATA_AND_HANDLING}}`
- Secrets: `{{RULE_OR_NA}}`
- Abuse/replay/file risks: `{{RISK_OR_NA}}`
- Security tests: `{{TESTS}}`
- Architecture security source: `{{ARCH_REF_OR_NA}}`

## 13. Performance and Resource Impact

- Architecture performance target/driver: `{{ARCH_REF_OR_NA}}`
- Critical path: `{{PATH}}`
- Expected data/load: `{{LOAD}}`
- Network/query changes: `{{CHANGE}}`
- Caching implementation: `{{CACHE_OR_NA}}`
- Memory/storage/bundle impact: `{{IMPACT_OR_NA}}`
- Measurement/target: `{{MEASUREMENT_OR_NA}}`

Do not optimize without a relevant requirement, architecture driver, or observed bottleneck.

## 14. Compatibility and Migration

- Old client/data behavior: `{{OLD_STATE}}`
- New behavior: `{{NEW_STATE}}`
- Coexistence requirement: `{{REQUIREMENT}}`
- Rollout sequence: `{{SEQUENCE}}`
- Rollback constraint: `{{CONSTRAINT}}`
- Deprecation/removal later: `{{FOLLOW_UP_OR_NA}}`
- Architecture migration source: `{{ARCH_REF_OR_NA}}`

## 15. Observability

- Logs: `{{EVENTS_OR_NA}}`
- Metrics: `{{METRICS_OR_NA}}`
- Trace/audit: `{{TRACE_OR_NA}}`
- What indicates failure after release: `{{SIGNAL}}`
- Architecture observability claims: `{{ARCH_REF_OR_NA}}`

## 16. Testing and Verification Design

Map requirement and architecture risk to test level.

| Requirement / Architecture Claim / Risk | Test / Verification | Layer | Notes |
|---|---|---|---|
| `{{FR_OR_ARCH_CLAIM_OR_RISK}}` | `{{TEST}}` | `{{UNIT/INTEGRATION/CONTRACT/E2E/LOAD/MANUAL}}` | `{{NOTES}}` |

Required static/build checks: `{{COMMANDS_OR_REFERENCE}}`.

Architecture-sensitive evidence may include authorization-denial tests, ordering/idempotency tests, reconnect/replay tests, cache invalidation tests, failure injection, load measurement, migration compatibility, or runtime metrics when relevant.

## 17. Implementation Alternatives Considered

Use this section for **repository implementation alternatives** that do not replace the approved system architecture. Architecture-level alternatives belong in `system-architecture.md` or an ADR.

### Option A — `{{OPTION}}`

- Advantages: `{{ADVANTAGES}}`
- Disadvantages: `{{DISADVANTAGES}}`
- Why not selected: `{{REASON}}`

### Option B — `{{OPTION}}`

- Advantages: `{{ADVANTAGES}}`
- Disadvantages: `{{DISADVANTAGES}}`
- Why selected/rejected: `{{REASON}}`

## 18. Implementation Trade-Offs

State local implementation costs accepted while preserving the approved architecture.

- `{{TRADE_OFF}}`
- `{{TRADE_OFF}}`

Do not duplicate the complete architecture decision matrix here.

## 19. Risks and Mitigations

| Risk | Impact | Mitigation / Verification | Architecture relevance |
|---|---|---|---|
| `{{RISK}}` | `{{IMPACT}}` | `{{MITIGATION}}` | `{{ARCH_REF_OR_NA}}` |

## 20. Open Technical Questions

| ID | Question | Blocking? | Owner | Resolution |
|---|---|---|---|---|
| TQ-001 | `{{QUESTION}}` | `{{YES/NO}}` | `{{OWNER}}` | Pending |

If a question can change architecture rather than only implementation mapping, move/escalate it to `system-architecture.md` or the relevant ADR.

## 21. Approval

- Technical owner: `{{NAME}}`
- Status: `{{STATUS}}`
- Approved date: `{{DATE_OR_PENDING}}`
- System architecture status: `{{APPROVED / NA / PENDING}}`
- Related ADRs: `{{LINKS_OR_NONE}}`
