---
id: ARCH-INDEX
title: Architecture Documentation
status: template
owner: "Developer"
last_updated: "2026-09-18"
---

# Architecture Documentation

Architecture files define cross-feature structure, boundaries, and invariants. Module-level system architecture lives with the module specification and must not be copied into global architecture unless the rule becomes shared.

## Architecture levels

| Level | Canonical path | Purpose |
|---|---|---|
| Project / global architecture | `docs/architecture/` | Shared boundaries, ownership, integration principles, security model, deployment topology, and cross-feature invariants |
| Module system architecture | `docs/specs/<feature>/system-architecture.md` | System design for one bounded capability: workload, data/consistency, communication, caching, scale, resilience, security, observability, cost, alternatives, trade-offs |
| Feature implementation design | `docs/specs/<feature>/design.md` | Concrete mapping of approved architecture into repository components, contracts, schema/state/UI, rollout, and tests |
| Architecture decision record | `docs/adr/` | Rationale/history for significant cross-feature or expensive-to-reverse choices |

Use `MODULE_ARCHITECTURE_GUIDE.md` for the per-module architecture process and `docs/specs/_templates/system-architecture.template.md` for the artifact.

## Reading order

For project-level architecture:

1. [`overview.md`](overview.md)
2. [`boundaries.md`](boundaries.md)
3. Read only the relevant concern:
   - data and persistence;
   - integrations and public contracts;
   - security and trust boundaries;
   - deployment and environments.

For feature/module work:

1. relevant project architecture constraint;
2. feature `requirements.md`;
3. feature `system-architecture.md`;
4. feature `design.md`;
5. relevant ADRs and code only as needed.

The base template intentionally starts with a small flat global structure. Promote a concern into a folder only when it develops independent subconcerns.

## Canonical ownership

| Question | Canonical path |
|---|---|
| System shape and shared runtime flow | `overview.md` |
| Component, trust, and dependency boundaries | `boundaries.md` |
| Shared domain model and persistence | `data-model.md` or `data/` after promotion |
| APIs, events, and external services shared across modules | `api-contracts.md` or `integration/` after promotion |
| Authentication, authorization, protection | `security.md` or `security/` after promotion |
| Runtime topology and environments | `deployment/` when needed |
| How one module behaves as a system | `docs/specs/<feature>/system-architecture.md` |
| How one module maps into repository implementation | `docs/specs/<feature>/design.md` |
| Why a major choice was selected | `docs/adr/` |

## Global vs. module architecture rule

Global architecture answers questions that many modules must obey. Module architecture answers questions that are local to one bounded capability.

Keep local examples local:

- group-chat message ordering;
- checkout idempotency;
- media-upload processing pipeline;
- search-index refresh strategy;
- notification fan-out.

Promote a rule when it becomes shared:

```text
module-local decision
  -> repeated/shared need
  -> architecture review
  -> ADR when significant
  -> docs/architecture/ update
```

Do not create a second copy of the module document under `docs/architecture/`.

## File-to-folder promotion

Example:

```text
security.md
```

becomes:

```text
security/
├── README.md
├── authentication.md
├── authorization.md
├── data-protection.md
└── threat-model.md
```

After promotion, remove the old complete source file and update links. Do not keep two authoritative versions.

The same rule applies to a complex module. A feature may promote `system-architecture.md` into a `system-architecture/` folder only when independent concerns genuinely need separate ownership or loading.

## Scope rule

Only document a rule in this global directory when it affects multiple features or defines a shared boundary.

Keep feature-local system reasoning in `docs/specs/<feature>/system-architecture.md` and repository-specific implementation detail in `docs/specs/<feature>/design.md`.

## Suggested complex global structure

```text
docs/architecture/
├── README.md
├── MODULE_ARCHITECTURE_GUIDE.md
├── overview.md
├── boundaries.md
├── data/
│   ├── README.md
│   ├── domain-model.md
│   ├── persistence.md
│   └── migration-strategy.md
├── integration/
│   ├── README.md
│   ├── api-boundaries.md
│   ├── external-services.md
│   └── event-contracts.md
├── security/
│   ├── README.md
│   ├── authentication.md
│   ├── authorization.md
│   ├── data-protection.md
│   └── threat-model.md
└── deployment/
    ├── README.md
    ├── topology.md
    └── environments.md
```

Follow:

- `docs/architecture/MODULE_ARCHITECTURE_GUIDE.md`
- `docs/documentation/MODULARIZATION_GUIDE.md`
