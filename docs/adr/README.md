---
id: ADR-INDEX
title: Architecture Decision Records
status: active
owner: Developer
last_updated: 2026-09-18
---

# Architecture Decision Records

## Rule

One expensive-to-reverse decision equals one ADR.

```text
0001-use-supabase-as-direct-backend.md
0002-enforce-rls-for-tenant-isolation.md
0003-use-supabase-auth.md
```

Do not create one `all-architecture-decisions.md`.

## When to create an ADR

Create one when a decision:

- changes system or trust boundaries;
- introduces a framework, provider, database, or major dependency;
- changes authentication or authorization;
- changes persistence, public APIs, or event contracts;
- creates migration or compatibility obligations;
- affects multiple features;
- is expensive to reverse.

## Size guidance

An ADR is normally 30–120 lines. Review ADRs over 200 lines for multiple decisions.

## Lifecycle

```text
proposed -> accepted
         -> rejected
accepted -> deprecated
accepted -> superseded
```

Never rewrite accepted history to make the past look cleaner. Create a new ADR and link `supersedes` / `superseded_by`.

## Ownership

- Conversational AI may analyze alternatives and draft the ADR.
- Repository-integrated coding agent verifies feasibility and affected code.
- Human owner accepts or rejects the decision.
- Automation may validate numbering, metadata, and links only.

## Index

| ADR | Status | Decision | Superseded by |
|---|---|---|---|
| `ADR-001` | accepted | Next.js + Supabase as primary stack | — |
| `ADR-002` | accepted | Supabase Storage for medical photo uploads | — |
| `ADR-003` | accepted | Hybrid Storage Architecture with Cloudinary Fallback | — |

Use `ADR.template.md` for new records.
