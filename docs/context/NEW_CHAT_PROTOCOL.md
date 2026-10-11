---
id: CONTEXT-NEW-CHAT
title: Agent Session Initialization Protocol
status: active
owner: Developer
last_updated: 2026-09-18
---

# Agent Session Initialization Protocol

This protocol is for AI agents interacting with the clinic repository.

## Opening prompt

```text
Continue work in this repository. Follow this protocol:

1. Read AGENTS.md.
2. Read docs/context/state.yaml to identify the current active task and overall status.
3. Read the relevant feature specifications in docs/specs/<feature>/ if working on a specific feature.
4. Inspect the relevant code, components, database schemas (e.g., supabase/migrations), and tests.

Return:
- current objective based on state.yaml;
- expected code changes;
- a small execution plan.

Do not resolve conflicts silently. Implement only the selected task after context confirmation.
```

## Architecture-sensitive task rule

Read the relevant module system architecture directly when the selected task touches any of these concerns:

- data ownership/storage/indexing/partitioning;
- Supabase Auth roles or RLS policies;
- financial calculations (e.g., Buku Kas, BPJS);
- scale/capacity (e.g., migrating 7,493 rows of CSV data).

## Session close

Before ending a session or completing a significant task:

1. Update `docs/context/state.yaml` if task status has changed.
2. Update `docs/handoff/current.md` if significant progress was made or if transferring context to another agent.
3. Review `git diff` and ensure code quality matches standards.
4. Report the exact next task or state that the milestone is complete.

## When context tooling is not implemented

The coding agent first completes the bootstrap task in `docs/context/CONTEXT_SYSTEM.md` if necessary, or follows the manual state.yaml update process.
