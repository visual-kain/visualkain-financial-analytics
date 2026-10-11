---
id: SPECS-INDEX
title: Feature Specifications
status: active
owner: "Developer"
last_updated: "2026-09-23"
---

# Feature Specifications

## Default package

For a Level 2 or Level 3 module/capability:

```text
F-XXX-feature-name/
├── requirements.md
├── system-architecture.md
├── design.md
├── tasks.md
└── verification.md
```

Each feature is an independently approvable vertical capability.

`system-architecture.md` is required when the capability has meaningful system concerns such as persistent/shared state, realtime/asynchronous communication, external integrations, security boundaries, consistency/concurrency, caching, reliability, performance, scale, or material operational cost.

A Level 1 change may omit `system-architecture.md` when it does not create or change a module-level architectural decision. Do not create empty architecture documents for trivial work.

## Artifact responsibilities

| Artifact | Owns |
|---|---|
| `requirements.md` | Observable behavior, rules, constraints, acceptance criteria, and NFRs |
| `system-architecture.md` | Module boundaries, architecture drivers, data/consistency model, communication, caching, scale, resilience, security, observability, cost, alternatives, and trade-offs |
| `design.md` | Repository-specific implementation mapping: components/paths, API/schema detail, state management, UI behavior, rollout, and test implementation |
| `tasks.md` | Executable scoped work units |
| `verification.md` | Evidence that requirements and architecture claims are satisfied |

Do not duplicate the same decision across artifacts. Requirements constrain architecture; architecture constrains design; design drives tasks.

## Recommended reading order

```text
requirements
  -> system architecture
  -> design
  -> tasks
  -> verification
```

Load only the artifacts relevant to the current task. A UI-only task may not need the full architecture document after its constraints have been summarized in the task, while work that changes data, realtime, caching, security, or service boundaries should read it directly.

## Lifecycle

```text
draft -> review -> approved -> implementing -> verification -> implemented -> superseded
```

Approved requirements, system architecture, and design are contracts. Implementation does not silently rewrite them.

For a normal Level 2/3 module, approval order is:

```text
requirements approved
  -> system architecture approved
  -> implementation design approved
  -> tasks executable
```

If implementation exposes a new architectural constraint, stop the affected task and use the specification-change protocol rather than retroactively justifying the code.

## System architecture guidance

Use:

- `docs/specs/_templates/system-architecture.template.md`
- `docs/architecture/MODULE_ARCHITECTURE_GUIDE.md`

The module architecture is not a checklist demanding Redis, sharding, microservices, queues, or load balancers. It evaluates only the concerns required by the module's actual architecture drivers.

Significant choices must compare credible alternatives and record pros, cons, accepted trade-offs, risks, and review triggers.

## Split the feature before splitting files

When a feature document becomes very large, first determine whether the feature combines independent user capabilities.

Prefer separate features such as:

```text
F-012-cart-management/
F-013-discount-calculation/
F-014-payment-processing/
F-015-receipt-generation/
```

over one oversized checkout specification.

## Advanced package

Use this only after the feature remains complex despite scope reduction:

```text
F-XXX-feature/
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

The feature `README.md` defines reading order and canonical ownership.

Do not split `system-architecture.md` merely because it is long. Split when independent concerns have different owners/change cadence or normal work only needs one concern.

## Promotion to project architecture

A decision remains module-local while it only governs one capability.

Promote it into `docs/architecture/` when it becomes a shared cross-feature invariant. Use an ADR when the decision is cross-feature, expensive to reverse, security-significant, or likely to be questioned later.

Examples:

- local chat-message cache policy -> module architecture;
- shared distributed-cache policy for the whole system -> global architecture + ADR when significant;
- local provider integration -> module architecture;
- project-wide event bus or database partitioning strategy -> global architecture + ADR.

## Authoring responsibility

- Conversational AI may draft requirements, system architecture alternatives, design, tasks, and verification scenarios.
- Human owner approves scope, requirements, architecture trade-offs, design, and acceptance.
- Repository-integrated coding agent validates file paths, existing architecture, commands, schemas/platform configuration, and feasibility against the real repo.
- Coding agent updates execution status and evidence during implementation.
- Automation may validate structure and links but must not choose architecture semantically.

## Traceability

Every task references requirement IDs and the relevant architecture/design constraints. Every acceptance criterion receives evidence. Architecture claims with meaningful risk receive planned evidence. Cross-feature architecture decisions link to ADRs.

See:

- `docs/architecture/MODULE_ARCHITECTURE_GUIDE.md`
- `docs/documentation/MODULARIZATION_GUIDE.md`
