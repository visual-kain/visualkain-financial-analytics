---
id: DOCS-MODULARIZATION
title: Documentation Modularization Guide
status: template
owner: "Developer"
last_updated: "2026-09-18"
---

# Documentation Modularization Guide

## 1. Decision rule

Split a document when at least one condition is true:

1. Sections have different canonical owners.
2. Sections change at materially different frequencies.
3. A normal task needs only one section and should not load the rest.
4. A section has its own approval or Definition of Done.
5. The file mixes durable contracts with temporary execution state.
6. Two sections can conflict independently.
7. The file is becoming a merge-conflict hotspot.

Do not split only because a file crosses a precise line count.

## 2. Operational size signals

| Size | Guidance |
|---|---|
| Under 200 lines | Usually safe |
| 200–400 lines | Normal for a focused specification |
| 400–600 lines | Review concern boundaries |
| 600–800 lines | Modularization is usually justified |
| Over 800 lines | Treat as a mandatory architecture review |

Exceptions include generated references, database dictionaries, API references, changelogs, and exhaustive test reports.

## 3. Never use meaningless parts

Avoid:

```text
architecture-part-1.md
architecture-part-2.md
architecture-part-3.md
```

Use responsibility-based names:

```text
architecture/
├── overview.md
├── boundaries.md
├── data/
├── integration/
├── security/
└── deployment/
```

A filename must answer: **what question is this file authoritative for?**

## 4. File-to-folder promotion

Start simple:

```text
docs/architecture/
├── overview.md
├── boundaries.md
├── data-model.md
├── api-contracts.md
└── security.md
```

When a concern grows, promote the file into a folder:

```text
docs/architecture/security/
├── README.md
├── authentication.md
├── authorization.md
├── data-protection.md
└── threat-model.md
```

After promotion:

- remove the old complete source file;
- make the folder `README.md` the index;
- update links and canonical-source tables;
- do not keep two complete versions.

## 5. Architecture split rules

### Global architecture

Global architecture contains cross-feature invariants:

- dependency direction;
- system and trust boundaries;
- shared persistence strategy;
- global authentication and authorization;
- deployment topology;
- integration principles;
- shared caching/eventing/partitioning policies when those are intentionally project-wide.

Canonical location:

```text
docs/architecture/
```

### Module system architecture

A Level 2/3 capability with meaningful system concerns owns its local architecture in:

```text
docs/specs/F-XXX-feature/system-architecture.md
```

This artifact answers module-local questions such as:

- workload and architecture drivers;
- data source of truth and consistency;
- sync/realtime/async communication;
- caching and invalidation;
- scale and capacity strategy;
- reliability/failure handling;
- security/trust boundaries;
- observability and cost;
- alternatives, pros/cons, accepted trade-offs, and review triggers.

Do not copy this document into `docs/architecture/`.

Promote a module-local decision into global architecture only after it becomes an approved reusable rule. Create or supersede an ADR when the promoted choice is significant or expensive to reverse.

### Feature implementation design

Repository-specific implementation decisions remain in:

```text
docs/specs/F-XXX-feature/design.md
```

`design.md` maps approved architecture into concrete components, paths, API/schema details, state management, UI behavior, rollout, and test implementation. It must not become a second system-architecture document.

## 6. ADR split rules

One decision equals one ADR.

Good:

```text
0001-use-supabase-as-direct-backend.md
0002-enforce-rls-for-tenant-isolation.md
0003-use-supabase-auth.md
0004-avoid-edge-functions-for-mvp.md
```

Bad:

```text
0001-all-backend-decisions.md
```

An ADR normally stays between 30 and 120 lines. Review any ADR beyond 200 lines for multiple decisions.

Keep ADRs in one flat numbered directory until navigation genuinely becomes difficult.

## 7. Feature specification split rules

Default Level 2/3 structure:

```text
docs/specs/F-XXX-feature/
├── requirements.md
├── system-architecture.md
├── design.md
├── tasks.md
└── verification.md
```

A Level 1 change may omit `system-architecture.md` when it does not create/change a module-level architectural decision.

When a feature produces a 1,000-line architecture/design package, first ask whether it combines independent vertical capabilities.

Prefer:

```text
F-012-cart-management/
F-013-discount-calculation/
F-014-payment-processing/
F-015-receipt-generation/
```

over one oversized checkout specification.

Only use advanced subfolders after scope reduction:

```text
F-014-payment-processing/
├── README.md
├── requirements/
│   ├── functional.md
│   ├── business-rules.md
│   └── non-functional.md
├── system-architecture/
│   ├── README.md
│   ├── context-and-boundaries.md
│   ├── data-and-consistency.md
│   ├── communication-and-caching.md
│   └── scalability-reliability-security.md
├── design/
│   ├── overview.md
│   ├── repository-mapping.md
│   ├── state-management.md
│   ├── error-handling.md
│   └── ui-ux.md
├── tasks.md
└── verification/
    ├── acceptance-matrix.md
    ├── architecture-evidence.md
    ├── automated-tests.md
    └── manual-scenarios.md
```

The feature `README.md` defines canonical ownership and reading order.

## 8. System-architecture modularization rule

Do not split `system-architecture.md` simply because system design has many possible topics. First remove irrelevant sections and keep only concerns supported by requirements/workload.

Promote it into a folder only when independent concerns genuinely need separate loading/ownership, for example:

```text
system-architecture/
├── README.md
├── context-and-boundaries.md
├── data-and-consistency.md
├── communication-and-caching.md
└── scalability-reliability-security.md
```

The folder `README.md` must state:

- architecture drivers;
- canonical owner for each child;
- required reading order;
- approved alternatives/decision status;
- links to relevant ADRs/global architecture;
- which child documents a coding task must load for each concern.

Do not create one file per system-design buzzword.

## 9. Context size limits

| Artifact | Target |
|---|---|
| `CONTEXT_INDEX.md` | 40–120 lines |
| `PROJECT_STATE.md` | 60–180 generated lines |
| `handoff/current.md` | 60–180 lines |
| `PROGRESS.md` | May be longer; loaded only on demand |

If `PROJECT_STATE.md` contains full backlog history, architecture prose, or all completed tasks, move that material to its canonical artifact.

Module system architecture is durable context but should be loaded progressively. A task should carry the exact architecture constraints it needs and load the full artifact only when the task changes or depends on those decisions.

## 10. Index requirement

Every modular folder has a `README.md` containing:

- purpose;
- canonical ownership;
- reading order;
- child-file table;
- extension rules;
- related artifacts.

## 11. Safe modularization procedure

1. Identify the distinct questions answered by the original file.
2. Assign one canonical destination per question.
3. Create the folder index and child files.
4. Move content without changing meaning.
5. Replace copied text with links.
6. Update references and validation configuration.
7. Verify no second source of truth remains.
8. Commit the move separately from semantic changes when practical.
