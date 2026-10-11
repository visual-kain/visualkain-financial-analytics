---
id: ARCH-MODULE-GUIDE
title: Module System Architecture Guide
status: template
owner: "Developer"
last_updated: "2026-09-18"
---

# Module System Architecture Guide

## 1. Purpose

Every meaningful product module should have an explicit system-architecture view before implementation details are finalized. The objective is not to produce enterprise-style diagrams for their own sake. The objective is to make the module's boundaries, quality attributes, data strategy, failure behavior, scaling model, security posture, and trade-offs reviewable before code makes those decisions expensive to reverse.

A module can be a bounded capability such as group chat, checkout, notifications, media upload, search, billing, or collaborative editing. A small UI-only change is not automatically a module.

Use `docs/specs/_templates/system-architecture.template.md` for the artifact.

## 2. Architecture levels

Keep these four levels distinct.

| Level | Canonical artifact | Question answered |
|---|---|---|
| Project architecture | `docs/architecture/` | What shared boundaries and invariants govern the whole system? |
| Module system architecture | `docs/specs/<feature>/system-architecture.md` | How should this bounded capability behave as a system under its requirements and quality constraints? |
| Feature implementation design | `docs/specs/<feature>/design.md` | How is the approved module architecture mapped into this repository's components, APIs, state, schema, UI, and rollout? |
| ADR | `docs/adr/` | Why was a significant cross-feature or expensive-to-reverse decision selected? |

Do not duplicate the same truth across all four artifacts. Link downward and upward instead.

## 3. When the artifact is required

Create `system-architecture.md` for every Level 2 or Level 3 capability that has one or more meaningful system concerns, including:

- persistent or shared state;
- client/server or service boundaries;
- realtime or asynchronous communication;
- external integrations;
- concurrency, ordering, or consistency requirements;
- authentication or authorization boundaries;
- caching or invalidation;
- non-trivial reliability/failure recovery;
- meaningful performance or scale requirements;
- operational or cost impact.

Level 1 changes may omit the artifact when they do not introduce or change a module-level architectural decision. Record the reason in the task/design rather than creating an empty architecture document.

## 4. Lifecycle

Use this order for a normal module:

```text
requirements
  -> system architecture
  -> architecture review / trade-off decision
  -> implementation design
  -> tasks
  -> implementation
  -> verification
```

The system architecture must not be written after implementation merely to justify the chosen code. If implementation discovers a new architectural constraint, use the specification-change protocol and update the architecture intentionally.

## 5. Architecture drivers first

Do not start by choosing Redis, Kafka, WebSockets, microservices, sharding, or another familiar technology. Start from the forces that shape the module.

Capture:

- primary user/system flows;
- expected load and growth assumptions;
- latency sensitivity;
- availability/reliability needs;
- consistency and ordering requirements;
- data volume and lifecycle;
- security/privacy constraints;
- compatibility constraints;
- team/operational constraints;
- cost sensitivity;
- reversibility requirements.

Unknown numbers stay assumptions with a validation plan. Do not invent precise capacity targets to make the document look complete.

## 6. Decision areas

Evaluate only the areas that are relevant to the module.

### Data and persistence

Consider:

- SQL vs. NoSQL based on access patterns, relationships, transactions, consistency, and operational constraints;
- entity ownership and source of truth;
- indexes and dominant query patterns;
- retention and archival;
- transaction boundaries;
- partitioning/sharding only when scale or isolation justifies it;
- migration and backward compatibility.

### Communication

Consider:

- synchronous request/response;
- realtime channels such as WebSocket/SSE/platform-native realtime;
- asynchronous events, queues, or jobs;
- delivery semantics;
- idempotency and duplicate handling;
- ordering requirements;
- backpressure and rate limits.

### Caching

A cache design is incomplete without invalidation.

Document:

- what is cached and why;
- cache location/owner;
- key strategy;
- TTL or freshness rule;
- invalidation/update strategy;
- cache-miss behavior;
- stampede/hot-key risk where relevant;
- source of truth when cache and persistence disagree.

### Scalability

Consider the simplest credible path from current load to expected load:

- horizontal vs. vertical scaling;
- stateless application nodes;
- load balancing;
- partitioning/sharding triggers;
- read replicas;
- fan-out strategy;
- CDN/edge delivery for static or media-heavy paths;
- bounded work and pagination;
- background processing.

Do not introduce distributed-system complexity before the workload requires it.

### Reliability and failure handling

Design degraded behavior, not only the happy path.

Consider:

- timeout ownership;
- bounded retry with backoff/jitter where safe;
- circuit breaker only when repeated downstream failure justifies it;
- idempotency for repeatable side effects;
- partial failure and compensation;
- queue backlog/replay;
- stale data behavior;
- dependency outage behavior;
- graceful degradation;
- recovery and reconciliation.

### Security and trust

Identify:

- trust boundaries;
- authentication source;
- authorization decision point;
- tenant/resource isolation;
- input validation;
- secrets and privileged credentials;
- PII/sensitive-data handling;
- abuse, replay, enumeration, and rate-limit concerns;
- file/media risks when applicable.

UI visibility is not authorization.

### Observability

Define signals that prove the architecture is healthy:

- logs that support diagnosis without leaking sensitive data;
- metrics for latency, errors, saturation, queue depth, cache hit rate, or other module-specific health;
- traces for critical distributed flows when useful;
- audit events for sensitive operations;
- alert/release signals for important failure modes.

### Cost and resource efficiency

Record dominant cost drivers rather than vague "optimize cost" statements. Examples include database reads/writes, egress, realtime connections, queue volume, storage growth, media delivery, model inference, or serverless invocation count.

For each material cost driver, state the expected control: caching, batching, retention, compression, tiering, rate limiting, capacity boundary, or another justified mechanism.

## 7. Alternatives and trade-offs are mandatory

For any significant architectural choice, compare credible alternatives before selecting one.

A useful comparison includes:

| Criterion | Option A | Option B | Option C |
|---|---|---|---|
| Requirement fit | | | |
| Complexity | | | |
| Consistency/reliability | | | |
| Scalability | | | |
| Operational burden | | | |
| Cost | | | |
| Security impact | | | |
| Reversibility | | | |
| Team familiarity | | | |

Do not create fake alternatives. If only one option satisfies a hard constraint, state that constraint explicitly.

The selected option must include both benefits and accepted costs. "Best practice" is not a decision rationale by itself.

## 8. Example: group chat module

A group-chat architecture review would usually examine questions such as:

- Who owns group membership and authorization?
- What is the source of truth for messages?
- What delivery model is required: polling, realtime subscription, WebSocket, or provider-native realtime?
- Is message ordering global, per group, or best effort?
- What consistency is required for send, edit, delete, read receipt, and membership changes?
- How are duplicate sends made idempotent?
- Is fan-out performed on write, on read, or delegated to a realtime provider?
- How are reconnect, missed events, and history catch-up handled?
- Are presence and typing indicators durable or ephemeral?
- How are attachments stored and delivered; does CDN/object storage matter?
- What can be cached, and how is it invalidated?
- What happens when realtime delivery fails but persistence succeeds?
- Which metrics expose lag, delivery failure, connection saturation, or hot groups?
- Which cost grows fastest: realtime connections, reads, writes, storage, or media egress?

The document should answer only the questions that materially affect the product. It should not implement a FAANG-scale chat architecture for an MVP with hundreds of users.

## 9. Promotion rule

A module-local architecture decision remains in `system-architecture.md` while it only governs that capability.

Promote it when it becomes a shared invariant:

```text
module-local decision
  -> repeated/shared need
  -> architecture review
  -> ADR when significant
  -> update docs/architecture/
```

Examples:

- one chat module uses a local cache: keep local;
- all modules adopt one distributed-cache policy: promote;
- one feature uses an external provider: local unless it establishes a project-wide integration boundary;
- a new global event bus or database partitioning strategy: project architecture + ADR.

## 10. Architecture review gate

Before approving a module architecture, verify:

- [ ] Requirements and NFRs are referenced.
- [ ] Scope and external boundaries are explicit.
- [ ] Workload assumptions are stated and uncertain values are labeled.
- [ ] State/data ownership is clear.
- [ ] Consistency, ordering, and concurrency semantics are explicit where relevant.
- [ ] Communication model is justified.
- [ ] Caching includes invalidation or is explicitly unnecessary.
- [ ] Scale strategy is proportional to expected demand.
- [ ] Failure and recovery paths are designed.
- [ ] Security/trust boundaries are explicit.
- [ ] Observability covers the module's important failure modes.
- [ ] Material cost drivers are understood.
- [ ] Credible alternatives and pros/cons are documented.
- [ ] Selected trade-offs are explicit.
- [ ] Migration/compatibility is safe when existing data/clients are affected.
- [ ] Architecture can be verified through tests, measurements, or runtime evidence.
- [ ] ADR/promotion needs were evaluated.

## 11. Maintenance triggers

Review/update the module architecture when:

- requirements materially change;
- a major scale assumption becomes false;
- storage or communication strategy changes;
- a new trust boundary or external dependency is added;
- consistency or ordering semantics change;
- a major incident exposes an architectural weakness;
- the module becomes shared infrastructure;
- an accepted ADR supersedes a local decision.

Do not update it for routine file moves or implementation details that do not change system behavior.

## 12. Authoring and approval

- Conversational AI may explore architecture alternatives and draft the artifact.
- Repository-integrated agents validate assumptions against actual code, platform configuration, schemas, and available tooling.
- Human owner approves significant trade-offs and high-impact architecture decisions.
- Implementation agents execute the approved architecture; they do not silently replace it with a more familiar pattern.
