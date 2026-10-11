---
id: DOCS-INDEX
title: Documentation System
status: template
owner: "Developer"
last_updated: "2026-09-18"
---

# Documentation System

This directory defines how project knowledge is authored, split, approved, and consumed by humans and AI agents.

## Core principle

Split documentation by **responsibility, authority, and change cadence**, not by arbitrary line count.

A long generated reference can be valid. A shorter manual document should still be split when it mixes product scope, architecture, operations, and temporary execution state.

## Documentation layers

| Layer | Purpose | Canonical location | Typical author |
|---|---|---|---|
| Product intent | Problem, users, outcomes, scope | `docs/product/` | Human + conversational AI |
| Architecture | Cross-feature structure and boundaries | `docs/architecture/` | Human + conversational AI, verified by coding agent |
| Decisions | One expensive-to-reverse decision | `docs/adr/` | Human approves; AI drafts |
| Feature contracts | Requirements, design, tasks, acceptance | `docs/specs/` | Human + conversational AI; coding agent validates against repo |
| Execution state | Active features, tasks, blockers | `docs/context/state.yaml` | Coding agent or context CLI |
| Generated context | Compact and full execution views | `docs/context/PROJECT_STATE.md`, `docs/context/PROGRESS.md` | Context renderer only |
| Session delta | Worktree, commands, partial work, exact next step | `docs/handoff/current.md` | Coding agent |
| Operations | Repeatable procedures | `docs/runbooks/` | Coding agent drafts and verifies |
| Quality | Global gates and review rules | `docs/quality/` | Human approves; AI drafts |

## AI responsibility split

### Conversational AI

Examples: ChatGPT Projects, web-based assistants, planning and research chats.

Use it to:

- frame ideas and product problems;
- draft PRDs and user flows;
- compare architecture alternatives;
- draft feature requirements, designs, tasks, and ADR proposals;
- critique scope and documentation structure.

Chat output is a proposal until reviewed and committed. It must not claim repository facts without repository access.

### Repository-integrated coding agent

Examples: Codex, Claude Code, or another agent with code and terminal access.

Use it to:

- inspect the real repository and existing patterns;
- adapt `AGENTS.md` and project commands;
- implement or verify the context tooling;
- create provider-specific hooks or commands;
- execute approved tasks and run checks;
- update task status, verification evidence, execution state, and handoff;
- detect drift between docs and implementation.

The coding agent does not own product or architecture approval.

## Reading order

1. `AGENTS.md`
2. `docs/context/CONTEXT_INDEX.md`
3. Relevant product, architecture, ADR, or feature artifact
4. Relevant code and tests
5. Generated execution state and current handoff when implementation is involved

## Supporting guides

- [`MODULARIZATION_GUIDE.md`](MODULARIZATION_GUIDE.md)
- [`AI_COLLABORATION_MODEL.md`](AI_COLLABORATION_MODEL.md)
