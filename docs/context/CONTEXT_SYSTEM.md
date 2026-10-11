---
id: CONTEXT-SYSTEM
title: Repository Context System
status: template
owner: "Developer"
last_updated: "2026-09-18"
---

# Repository Context System

## 1. Purpose

Provide every new coding-agent session with current project state without copying chat history or relying on provider memory.

## 2. Canonical model

```text
Feature specs and ADRs       docs/context/state.yaml
(durable contracts)          (mutable execution state)
          \                       /
           \                     /
            -> context renderer
                 ├── PROJECT_STATE.md
                 └── PROGRESS.md

docs/handoff/current.md
(session-specific delta)
```

## 3. Source rules

| Information | Canonical source |
|---|---|
| Product intent | `docs/product/` |
| Architecture | `docs/architecture/` |
| Decisions | `docs/adr/` |
| Feature behavior and design | `docs/specs/` |
| Task and feature execution status | `docs/context/state.yaml` |
| Compact generated status | `docs/context/PROJECT_STATE.md` |
| Full generated progress board | `docs/context/PROGRESS.md` |
| Current worktree/session delta | `docs/handoff/current.md` |

Generated views are never edited manually.

## 4. Who implements this system

A repository-integrated coding agent—Codex, Claude Code, or equivalent—must implement or adapt the context tooling in the actual project repository.

A conversational AI may design the schema or review the workflow, but it must not invent local paths, commands, hooks, or repository state.

## 5. Coding-agent bootstrap task

The coding agent must:

1. inspect the project runtime and available scripting language;
2. preserve `docs/context/state.yaml` as the canonical execution state;
3. implement a one-way renderer for `PROJECT_STATE.md` and `PROGRESS.md`;
4. implement deterministic validation;
5. make writes idempotent;
6. prevent duplicate IDs and invalid statuses;
7. detect generated views that are stale;
8. add commands such as `context:sync`, `context:validate`, `context:next`, and task transitions where useful;
9. add the provider adapter matching the active coding agent;
10. keep provider memory outside the canonical data flow.

## 6. Provider adapter contract

An adapter may:

- run sync at session start;
- expose slash commands or agent commands;
- load the compact snapshot automatically;
- warn when handoff or generated context is stale.

An adapter must not:

- become the only copy of project state;
- write semantic decisions automatically;
- summarize raw chat into approved requirements;
- hide repository changes outside Git.

## 7. Recommended views

### `PROJECT_STATE.md`

Contains:

- active feature and task;
- active track or phase;
- next tasks;
- current blockers and highest risks;
- branch and verified commit;
- links to active specs and ADRs.

Target: 60–180 lines.

### `PROGRESS.md`

Contains:

- all features and execution tasks;
- statuses and commits;
- blockers and deferred work;
- concise verification summaries.

Load only on demand.

### `handoff/current.md`

Contains worktree-specific facts:

- objective;
- changed files;
- commands and results;
- partial implementation;
- uncommitted work;
- exact next action.

## 8. Lifecycle

```text
Task status changes
  -> update state.yaml through CLI
  -> render generated views
  -> validate
  -> commit

Session implementation changes
  -> update handoff/current.md

Requirement or architecture changes
  -> update spec or ADR
  -> update affected execution state
  -> render and validate
```

## 9. Portability

Prefer repository-relative paths and runtime discovery.

Do not hardcode:

- operating-system usernames;
- absolute project paths;
- provider-specific memory directories;
- one developer's Python or Node installation.

Provider-specific paths belong in local adapter configuration and must be overrideable.

## 10. Acceptance criteria

The context system is ready when:

- a new coding-agent session identifies the active task without chat history;
- generated views exactly match `state.yaml`;
- repeated sync produces no diff;
- invalid task IDs and statuses fail validation;
- moving the repository to another machine preserves canonical knowledge;
- deleting provider memory does not remove project state.
