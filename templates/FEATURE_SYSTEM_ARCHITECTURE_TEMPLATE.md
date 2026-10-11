# Feature System Architecture — `{{FEATURE_ID}}: {{FEATURE_NAME}}`

**Status:** `{{DRAFT | REVIEW | APPROVED | SUPERSEDED}}`  
**Owner:** `{{OWNER}}`  
**Requirements:** `{{REQUIREMENTS_PATH}}`  
**Global Architecture:** `{{ARCHITECTURE_BASELINE_PATH}}`  
**Related ADRs:** `{{ADR_LINKS_OR_NONE}}`  
**Created:** `{{YYYY-MM-DD}}`  
**Last Updated:** `{{YYYY-MM-DD}}`

> This document owns **module-level architectural reasoning** for one bounded capability. It explains why the module is shaped the way it is before repository-specific implementation design begins.
>
> It does **not** require every section to be filled. Remove sections that do not apply. Do not invent scale, distributed-system mechanisms, or numeric targets merely to make the document look complete.
>
> Exact file paths, classes/components, framework wiring, UI implementation details, and low-level code mapping belong in `design.md`.

## 1. Architecture Intent

### Capability

`{{What bounded capability does this module provide?}}`

### Architectural Objective

`{{What must this architecture make possible while preserving project constraints?}}`

### In Scope

- `{{RESPONSIBILITY_OR_BOUNDARY}}`
- `{{RESPONSIBILITY_OR_BOUNDARY}}`

### Out of Scope

- `{{EXCLUDED_RESPONSIBILITY}}`
- `{{EXCLUDED_RESPONSIBILITY}}`

### Why a Separate System Architecture Is Needed

`{{Explain the meaningful architecture concern: realtime communication, consistency, scale, data ownership, security, resilience, external integration, cost, etc. If there is no meaningful architecture decision, use a lighter process instead.}}`

## 2. Requirements and Architecture Drivers

Referenced requirements:

- Functional: `{{FR_IDS}}`
- Non-functional: `{{NFR_IDS}}`
- Business rules: `{{BR_IDS}}`
- Constraints: `{{CONSTRAINT_IDS_OR_SUMMARY}}`

Prioritize the drivers that actually shape the architecture.

| Driver | Requirement / assumption | Priority | Architectural consequence |
|---|---|---|---|
| `{{SECURITY / LATENCY / RELIABILITY / SCALE / COST / CONSISTENCY / OFFLINE / REALTIME}}` | `{{DETAIL}}` | `{{H/M/L}}` | `{{CONSEQUENCE}}` |

### Hard Constraints

- `{{PLATFORM_OR_PRODUCT_CONSTRAINT}}`
- `{{COMPATIBILITY_OR_TEAM_CONSTRAINT}}`

### Unknowns That May Change the Architecture

| Unknown / Assumption | Current assumption | Validation plan | Blocking? |
|---|---|---|---|
| `{{UNKNOWN}}` | `{{ASSUMPTION}}` | `{{HOW_TO_VALIDATE}}` | `{{YES/NO}}` |

Do not present assumptions as facts.

## 3. Workload and Capacity Assumptions

Use observed values where available. Otherwise use ranges, qualitative assumptions, or `TBD` with a validation plan.

| Dimension | Initial / current | Expected growth | Source / confidence |
|---|---|---|---|
| Active users / actors | `{{VALUE}}` | `{{VALUE}}` | `{{SOURCE}}` |
| Concurrent users / connections | `{{VALUE_OR_NA}}` | `{{VALUE_OR_NA}}` | `{{SOURCE}}` |
| Requests / events per time unit | `{{VALUE_OR_RANGE}}` | `{{VALUE_OR_RANGE}}` | `{{SOURCE}}` |
| Read : write ratio | `{{VALUE_OR_NA}}` | `{{VALUE_OR_NA}}` | `{{SOURCE}}` |
| Data growth | `{{VALUE_OR_RANGE}}` | `{{VALUE_OR_RANGE}}` | `{{SOURCE}}` |
| Typical payload / object size | `{{VALUE_OR_RANGE}}` | `{{VALUE_OR_RANGE}}` | `{{SOURCE}}` |
| Peak / burst behavior | `{{DESCRIPTION}}` | `{{DESCRIPTION}}` | `{{SOURCE}}` |
| Hot-key / hotspot risk | `{{DESCRIPTION_OR_NA}}` | `{{DESCRIPTION_OR_NA}}` | `{{SOURCE}}` |

### Redesign / Scaling Triggers

Define signals that would justify revisiting the architecture rather than overengineering now.

- `{{TRIGGER, e.g. connection count, queue lag, p95 latency, DB saturation, data volume}}`
- `{{TRIGGER}}`

## 4. System Context and Boundaries

### Context Diagram

```text
{{ACTOR_OR_CLIENT}}
  → {{MODULE_ENTRY_BOUNDARY}}
  → {{MODULE}}
  → {{PERSISTENCE_OR_EXTERNAL_SYSTEM}}
  → {{DOWNSTREAM_CONSUMER_OR_NA}}
```

### Boundary Ownership

| Boundary / Component | Owns | Does not own | Trust level |
|---|---|---|---|
| `{{BOUNDARY}}` | `{{RESPONSIBILITY}}` | `{{NON_RESPONSIBILITY}}` | `{{TRUSTED / UNTRUSTED / MIXED}}` |

### Integration Boundaries

- Upstream callers: `{{CALLERS}}`
- Downstream dependencies: `{{DEPENDENCIES}}`
- External providers: `{{PROVIDERS_OR_NONE}}`
- Shared platform services used: `{{SERVICES_OR_NONE}}`

### Boundary Invariants

- `{{INVARIANT}}`
- `{{INVARIANT}}`

## 5. Logical Components and Responsibility Split

Describe architecture-level responsibilities, not concrete source files.

| Logical component | Responsibility | State / data owned | Dependencies |
|---|---|---|---|
| `{{COMPONENT}}` | `{{RESPONSIBILITY}}` | `{{STATE}}` | `{{DEPENDENCIES}}` |

### Dependency Direction

```text
{{COMPONENT_A}}
  → {{COMPONENT_B}}
  → {{COMPONENT_C}}
```

Rules:

- `{{ALLOWED_DEPENDENCY_RULE}}`
- `{{PROHIBITED_DEPENDENCY_RULE}}`

## 6. Critical Flows

Document only flows whose architecture matters.

### 6.1 Primary Write / Mutation Flow

```text
{{ACTOR}}
  → {{AUTHN_AUTHZ_BOUNDARY}}
  → {{VALIDATION}}
  → {{APPLICATION_OPERATION}}
  → {{SOURCE_OF_TRUTH}}
  → {{SIDE_EFFECT_OR_EVENT}}
  → {{RESULT}}
```

Important guarantees:

- `{{GUARANTEE}}`

Failure / partial-success behavior:

- `{{BEHAVIOR}}`

### 6.2 Primary Read Flow

```text
{{ACTOR}}
  → {{READ_ENTRY}}
  → {{CACHE_OR_QUERY_LAYER_OR_NONE}}
  → {{SOURCE_OF_TRUTH}}
  → {{RESULT}}
```

Important guarantees:

- `{{FRESHNESS_OR_AUTHORIZATION_RULE}}`

### 6.3 Realtime / Async / Event Flow

Remove if not applicable.

```text
{{PRODUCER}}
  → {{PERSIST_OR_ACCEPT}}
  → {{EVENT_TRANSPORT}}
  → {{CONSUMER}}
  → {{ACK / REPLAY / RECONCILIATION}}
```

Important guarantees:

- `{{DELIVERY / ORDERING / REPLAY / DEDUPLICATION_RULE}}`

## 7. Data Ownership and Source of Truth

### Canonical Data

| Data / entity | Source of truth | Writer(s) | Reader(s) | Retention / lifecycle |
|---|---|---|---|---|
| `{{DATA}}` | `{{SOURCE}}` | `{{WRITER}}` | `{{READERS}}` | `{{LIFECYCLE}}` |

### Derived / Ephemeral Data

| Data | Purpose | Owner | Rebuild / expiry rule |
|---|---|---|---|
| `{{DERIVED_OR_EPHEMERAL_DATA}}` | `{{PURPOSE}}` | `{{OWNER}}` | `{{RULE}}` |

### Writable Source-of-Truth Rule

`{{Explain how duplicate writable sources are avoided or how reconciliation works if more than one writer/source genuinely exists.}}`

## 8. Storage and Persistence Strategy

### Storage Requirements

- Query/access patterns: `{{PATTERNS}}`
- Transaction/atomicity needs: `{{NEEDS}}`
- Relationship model: `{{RELATIONAL / DOCUMENT / KEY_VALUE / OBJECT / OTHER}}`
- Expected growth: `{{GROWTH}}`
- Retention/deletion needs: `{{RETENTION}}`
- Search/index needs: `{{SEARCH}}`

### Selected Storage Approach

`{{SELECTED_APPROACH}}`

Why it fits:

- `{{REASON}}`
- `{{REASON}}`

### Alternatives

| Option | Advantages | Disadvantages | Rejected / selected because |
|---|---|---|---|
| `{{SQL / NOSQL / EXISTING_DB / EXTERNAL_STORE / OTHER}}` | `{{PROS}}` | `{{CONS}}` | `{{REASON}}` |

Do not switch persistence technology merely because the feature is expected to grow. Prefer the existing platform until evidence or requirements justify a change.

## 9. Consistency, Concurrency, Ordering, and Idempotency

### Consistency Model

- Required consistency: `{{STRONG / READ_YOUR_WRITES / EVENTUAL / DOMAIN_SPECIFIC}}`
- Where stale reads are acceptable: `{{RULE_OR_NONE}}`
- Where stale reads are unacceptable: `{{RULE}}`
- Reconciliation behavior: `{{RULE_OR_NA}}`

### Concurrency

- Concurrent mutation risks: `{{RISKS}}`
- Conflict strategy: `{{OPTIMISTIC / PESSIMISTIC / VERSIONING / LAST_WRITE_WINS / DOMAIN_RULE / NA}}`
- Lost-update prevention: `{{RULE}}`

### Ordering

Remove if ordering does not matter.

- Ordering scope: `{{GLOBAL / PER_USER / PER_ROOM / PER_ENTITY / NONE}}`
- Ordering key: `{{KEY_OR_NA}}`
- How out-of-order delivery is handled: `{{RULE}}`

### Idempotency / Duplicate Handling

- Idempotency key / dedupe identity: `{{RULE_OR_NA}}`
- Duplicate side-effect behavior: `{{RULE}}`
- Retry safety: `{{RULE}}`

## 10. Communication Model

Evaluate the communication style rather than defaulting to a fashionable mechanism.

| Concern | Selected model | Why | Failure implication |
|---|---|---|---|
| Request/response | `{{SYNC_HTTP/RPC/LOCAL/OTHER}}` | `{{REASON}}` | `{{IMPLICATION}}` |
| Background work | `{{INLINE / JOB / QUEUE / SCHEDULED / NONE}}` | `{{REASON}}` | `{{IMPLICATION}}` |
| Realtime updates | `{{POLLING / SSE / WEBSOCKET / PROVIDER_REALTIME / NONE}}` | `{{REASON}}` | `{{IMPLICATION}}` |
| Domain/integration events | `{{DIRECT / EVENT_BUS / WEBHOOK / NONE}}` | `{{REASON}}` | `{{IMPLICATION}}` |

### Delivery Semantics

- Delivery expectation: `{{AT_MOST_ONCE / AT_LEAST_ONCE / EFFECTIVELY_ONCE / BEST_EFFORT / NA}}`
- Acknowledgement: `{{RULE_OR_NA}}`
- Replay / catch-up: `{{RULE_OR_NA}}`
- Backpressure / overload: `{{RULE_OR_NA}}`

## 11. Caching Strategy

Remove if caching is not justified.

### Why Cache Is Needed

`{{Observed or requirement-based reason. If there is no reason, do not add caching.}}`

### Cache Ownership

| Cached data | Cache owner | Source of truth | TTL / freshness | Invalidation trigger |
|---|---|---|---|---|
| `{{DATA}}` | `{{OWNER}}` | `{{SOURCE}}` | `{{RULE}}` | `{{TRIGGER}}` |

### Cache Failure Behavior

- Cache unavailable: `{{FALLBACK}}`
- Stale cache: `{{BEHAVIOR}}`
- Stampede/hot-key concern: `{{MITIGATION_OR_NA}}`

### Alternatives Considered

- No cache: `{{WHY_INSUFFICIENT_OR_SELECTED}}`
- Client/local cache: `{{TRADE_OFF}}`
- Shared/distributed cache: `{{TRADE_OFF}}`

## 12. Scalability and Performance

### Critical Path

`{{PATH}}`

### Performance Constraints

- Latency target/budget: `{{REQUIREMENT_OR_TBD}}`
- Throughput/concurrency: `{{REQUIREMENT_OR_TBD}}`
- Payload/data-volume constraint: `{{REQUIREMENT_OR_TBD}}`

### Scaling Model

- Stateless/horizontal scaling applicability: `{{RULE_OR_NA}}`
- Stateful bottleneck: `{{BOTTLENECK_OR_NONE}}`
- Primary expected bottleneck: `{{BOTTLENECK}}`
- Scale-up vs scale-out decision: `{{DECISION}}`

### Partitioning / Sharding

Remove if not justified.

- Why partitioning is needed: `{{REASON}}`
- Partition key: `{{KEY}}`
- Hot-partition risk: `{{RISK}}`
- Rebalancing/migration concern: `{{CONCERN}}`
- Trigger before adopting: `{{THRESHOLD}}`

### Load Balancing

Remove if not applicable.

- Layer requiring balancing: `{{LAYER}}`
- Sticky/session affinity need: `{{YES/NO + WHY}}`
- Health/removal behavior: `{{RULE}}`

### CDN / Edge

Remove if not applicable.

- Content/data suitable for edge: `{{CONTENT}}`
- Cacheability/privacy constraint: `{{CONSTRAINT}}`
- Invalidation/versioning strategy: `{{RULE}}`

## 13. Reliability and Resilience

### Failure Model

| Failure | Detection | Immediate behavior | Recovery | Data/state risk |
|---|---|---|---|---|
| `{{DEPENDENCY_TIMEOUT}}` | `{{SIGNAL}}` | `{{BEHAVIOR}}` | `{{RECOVERY}}` | `{{RISK}}` |
| `{{PARTIAL_FAILURE}}` | `{{SIGNAL}}` | `{{BEHAVIOR}}` | `{{RECOVERY}}` | `{{RISK}}` |

### Retry Policy

- Retry owner: `{{OWNER}}`
- Retryable failures: `{{FAILURES}}`
- Non-retryable failures: `{{FAILURES}}`
- Backoff/jitter: `{{RULE_OR_NA}}`
- Max attempts/time budget: `{{RULE_OR_TBD}}`
- Idempotency protection: `{{RULE}}`

### Circuit Breaker / Bulkhead / Rate Limiting

Use only when justified.

- Mechanism: `{{NONE_OR_MECHANISM}}`
- Failure it prevents: `{{FAILURE}}`
- Trigger/reset: `{{RULE}}`

### Degraded Mode / Fallback

- Safe degraded behavior: `{{BEHAVIOR_OR_NONE}}`
- What must never be silently degraded: `{{INVARIANT}}`

### Recovery and Replay

- Reconnect behavior: `{{RULE_OR_NA}}`
- Missed-event replay/catch-up: `{{RULE_OR_NA}}`
- Recovery source of truth: `{{SOURCE}}`

### Disaster / Data Recovery

Remove if feature-specific recovery differs from project baseline.

- RPO/RTO requirement: `{{REQUIREMENT_OR_INHERIT}}`
- Backup/recovery dependency: `{{DEPENDENCY}}`

## 14. Security, Privacy, and Abuse Resistance

### Trust Boundaries

- Untrusted inputs: `{{INPUTS}}`
- Trusted decision boundary: `{{BOUNDARY}}`

### Authentication and Authorization

- Identity source: `{{SOURCE}}`
- Authorization decision point: `{{BOUNDARY}}`
- Resource/tenant ownership rule: `{{RULE}}`
- Privileged/service role use: `{{RULE_OR_NONE}}`

### Sensitive Data

| Data | Sensitivity | Storage/transit handling | Logging/telemetry rule |
|---|---|---|---|
| `{{DATA}}` | `{{PII/SECRET/SENSITIVE/NORMAL}}` | `{{HANDLING}}` | `{{RULE}}` |

### Abuse / Threat Considerations

- Enumeration / IDOR: `{{MITIGATION}}`
- Replay / duplicate side effects: `{{MITIGATION}}`
- Rate abuse / spam: `{{MITIGATION_OR_NA}}`
- File/content risks: `{{MITIGATION_OR_NA}}`
- Forged callbacks/webhooks: `{{MITIGATION_OR_NA}}`

Formal threat model required: `{{YES/NO + REASON}}`.

## 15. Observability and Operability

### Signals

| Signal | What it proves / detects | Owner | Alert / review threshold |
|---|---|---|---|
| `{{METRIC / LOG / TRACE / AUDIT}}` | `{{PURPOSE}}` | `{{OWNER}}` | `{{THRESHOLD_OR_NA}}` |

### Critical Events

- `{{EVENT}}`
- `{{EVENT}}`

### Sensitive Logging Constraints

- `{{DATA_NOT_TO_LOG}}`

### Post-Release Failure Signals

- `{{SIGNAL}}`
- `{{SIGNAL}}`

## 16. Cost and Operational Complexity

Architecture cost includes infrastructure, engineering effort, failure modes, and maintenance—not only cloud price.

| Cost driver | Expected impact | Growth behavior | Mitigation / budget rule |
|---|---|---|---|
| `{{DB / EGRESS / REALTIME_CONNECTION / QUEUE / CACHE / STORAGE / CDN}}` | `{{IMPACT}}` | `{{GROWTH}}` | `{{RULE}}` |

### Operational Burden

- New service/provider introduced: `{{YES/NO + WHY}}`
- New operational skill/runbook required: `{{YES/NO + DETAIL}}`
- New failure mode introduced: `{{DETAIL}}`
- Vendor lock-in impact: `{{IMPACT}}`

## 17. Compatibility, Migration, and Rollout

Remove or simplify if no existing state/clients are affected.

### Current State

`{{CURRENT_ARCHITECTURAL_STATE}}`

### Target State

`{{TARGET_ARCHITECTURAL_STATE}}`

### Compatibility

- Existing clients: `{{BEHAVIOR}}`
- Existing data: `{{BEHAVIOR}}`
- External integrations: `{{BEHAVIOR}}`

### Migration / Rollout Sequence

1. `{{STEP}}`
2. `{{STEP}}`
3. `{{VERIFY}}`
4. `{{CLEANUP_LATER_IF_SAFE}}`

### Rollback / Roll-Forward Reality

- Code rollback possible: `{{YES/NO + CONDITION}}`
- Data rollback possible: `{{YES/NO + CONDITION}}`
- Safer recovery path: `{{ROLLBACK / ROLL_FORWARD / DEPENDS}}`

## 18. Alternatives and Decision Matrix

Compare credible alternatives. Do not create fake strawman options.

| Criterion | Weight / priority | Option A | Option B | Option C |
|---|---|---|---|---|
| Requirement fit | `{{H/M/L}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` |
| Complexity | `{{H/M/L}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` |
| Reliability | `{{H/M/L}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` |
| Performance/scale | `{{H/M/L}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` |
| Security | `{{H/M/L}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` |
| Cost/operations | `{{H/M/L}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` |
| Reversibility | `{{H/M/L}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` |
| Team familiarity | `{{H/M/L}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` | `{{ASSESSMENT}}` |

### Option A — `{{NAME}}`

**Description:** `{{DESCRIPTION}}`

**Pros**

- `{{PRO}}`
- `{{PRO}}`

**Cons**

- `{{CON}}`
- `{{CON}}`

**Risks**

- `{{RISK}}`

### Option B — `{{NAME}}`

**Description:** `{{DESCRIPTION}}`

**Pros**

- `{{PRO}}`

**Cons**

- `{{CON}}`

**Risks**

- `{{RISK}}`

### Selected Architecture

`{{SELECTED_OPTION_AND_REASON}}`

Why the rejected options were not selected now:

- `{{REASON}}`

## 19. Accepted Trade-Offs

State costs intentionally accepted by the selected architecture.

| Trade-off | Benefit gained | Cost accepted | Why acceptable now | Review trigger |
|---|---|---|---|---|
| `{{TRADE_OFF}}` | `{{BENEFIT}}` | `{{COST}}` | `{{RATIONALE}}` | `{{TRIGGER}}` |

Examples of valid trade-offs include accepting eventual consistency for lower coupling, accepting provider lock-in for faster delivery, or postponing sharding until measured scale requires it. Do not treat these examples as defaults.

## 20. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation / verification | Owner |
|---|---|---|---|---|
| `{{RISK}}` | `{{L/M/H}}` | `{{L/M/H}}` | `{{MITIGATION}}` | `{{OWNER}}` |

## 21. Architecture Verification Plan

Architecture claims require evidence proportional to risk. Do not claim capacity, ordering, resilience, authorization, or cost properties solely from design intent.

| Architecture claim / risk | Evidence method | Layer / environment | Pass condition |
|---|---|---|---|
| `{{CLAIM}}` | `{{TEST / LOAD TEST / CONTRACT TEST / FAILURE INJECTION / MANUAL / METRIC}}` | `{{LAYER}}` | `{{CONDITION}}` |

Examples of claims to verify when relevant:

- authorization isolation;
- message/event ordering within the required scope;
- duplicate request idempotency;
- reconnect/replay behavior;
- cache invalidation/freshness;
- timeout/retry behavior;
- graceful dependency failure;
- latency/throughput target;
- migration compatibility;
- sensitive-data logging constraints.

## 22. Impact on Global Architecture and ADRs

- Uses existing global boundary: `{{BOUNDARY}}`
- Changes shared architecture: `{{NO | YES: DESCRIPTION}}`
- Introduces shared reusable rule: `{{NO | YES: DESCRIPTION}}`
- ADR required: `{{NO | YES: ADR_LINK_OR_PENDING}}`
- Global architecture docs to update after approval: `{{NONE_OR_PATHS}}`

If this feature cannot satisfy its requirements without violating the current architecture baseline, stop and resolve the architecture change deliberately rather than encoding the exception only in implementation.

## 23. Open Architecture Questions

| ID | Question | Owner | Blocking? | Evidence / decision needed | Status |
|---|---|---|---|---|---|
| AQ-001 | `{{QUESTION}}` | `{{OWNER}}` | `{{YES/NO}}` | `{{NEEDED}}` | Pending |

## 24. Design Handoff

After architecture approval, `design.md` should map this architecture into repository reality.

Implementation design must identify:

- concrete components/files after repository inspection;
- interfaces/contracts that implement the approved boundaries;
- exact schema/API/state changes;
- framework-specific state and lifecycle behavior;
- tests and verification commands;
- migration/rollout implementation details.

Implementation design must **not** silently replace the architecture selected here. If repository inspection invalidates an architecture assumption, update this document/ADR through the approved change process first.

## 25. Approval

- Architecture/technical owner: `{{NAME}}`
- Decision owner: `{{NAME_OR_SAME}}`
- Status: `{{DRAFT | REVIEW | APPROVED | SUPERSEDED}}`
- Approved date: `{{DATE_OR_PENDING}}`
- Conditions / accepted risks: `{{NOTES_OR_NONE}}`
