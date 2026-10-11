---
id: DOCS-AI-COLLABORATION
title: AI Collaboration Model
status: template
owner: "Developer"
last_updated: "2026-09-18"
---

# AI Collaboration Model

## 1. Objective

Use the best AI surface for each artifact while keeping the repository as the final source of truth.

```text
Conversation and research
    -> reviewed requirements / architecture / design
    -> repository-integrated implementation
    -> deterministic verification
    -> committed context refresh
```

## 2. Authority model

| Actor | Owns | May draft | Must not decide silently |
|---|---|---|---|
| Human owner | Scope, priority, architecture approval, acceptance | All artifacts | N/A |
| Conversational AI | Analysis, PRD, specs, architecture alternatives, critique | Product, module architecture, and design documents | Repository state, approval, implementation truth |
| Coding agent | Repo inspection, implementation, validation, context tooling | Technical updates grounded in code | Product scope, architecture exceptions |
| Automation | Format, render, validate, compare | Generated views only | Semantic decisions |

## 3. Conversational AI workflow

Use a chat-based AI before implementation for:

1. idea intake;
2. problem framing;
3. PRD drafting;
4. user-flow and UX analysis;
5. project architecture option comparison;
6. feature requirements;
7. module system-architecture analysis;
8. architecture alternatives/pros/cons/trade-off review;
9. preliminary repository implementation design;
10. task decomposition;
11. ADR proposal;
12. documentation modularization review.

For a Level 2/3 module, use this planning chain:

```text
requirements
  -> system-architecture.md
  -> design.md
  -> tasks.md
```

`system-architecture.md` should reason from architecture drivers and constraints. It must not automatically recommend familiar distributed-system components such as sharding, Redis, queues, microservices, CDN, or circuit breakers unless the workload/requirements justify them.

Required output discipline:

- label assumptions;
- use stable IDs;
- name target repository paths;
- separate approved facts from proposals;
- compare credible alternatives for significant architecture choices;
- state both benefits and accepted costs of the selected architecture;
- do not store raw chat transcripts in the repo;
- convert the final result into repository artifacts.

A chat output is a proposal until the human reviews it and a coding agent checks it against the actual repository/platform where necessary.

## 4. Repository-integrated coding-agent workflow

Codex, Claude Code, or a comparable local/repository agent handles work that depends on actual code or environment:

1. read `AGENTS.md`;
2. inspect project commands and global architecture;
3. validate proposed module architecture against current code, schemas, configuration, provider capabilities, and operational constraints;
4. validate implementation design against approved architecture;
5. implement `docs/context/state.yaml` tooling and provider adapters;
6. create hooks or slash commands for the installed agent;
7. implement approved tasks;
8. run checks and architecture-sensitive verification where required;
9. update verification evidence;
10. update execution state through the context CLI or canonical state file;
11. update `docs/handoff/current.md`.

The coding agent must not copy conversational assumptions into approved artifacts without validation. It must not silently replace approved architecture because another pattern is more familiar.

## 5. Context-system bootstrap ownership

The context system is repository infrastructure. It must be created or adapted **inside the real project repository** by a coding agent with terminal access.

Give the coding agent this objective:

```text
Implement the repository context system described in
docs/context/CONTEXT_SYSTEM.md.

Preserve repository-native canonical data:
- docs/context/state.yaml for execution state;
- feature requirements, module system architecture, implementation design,
  verification, and ADRs for durable contracts and decisions;
- docs/handoff/current.md for session delta.

Generate PROJECT_STATE.md and PROGRESS.md one way from state.yaml.
Add deterministic validation.
Add only the provider adapter that matches the active coding agent.
Do not make provider memory the source of truth.
```

## 6. Provider adapters

Provider-specific memory, commands, and hooks are adapters:

```text
Repository context
    -> Claude Code adapter
    -> Codex adapter
    -> another coding-agent adapter
```

Adapters may:

- run context sync on session start;
- expose commands such as `context next`;
- point the agent to generated snapshots;
- warn when handoff or generated context is stale;
- point architecture-sensitive tasks to the relevant `system-architecture.md` sections.

Adapters must not own state. Deleting an adapter must not delete project knowledge.

## 7. Handoff between chat AI and coding agent

A chat AI delivers:

- target paths;
- artifact status;
- requirement references;
- selected module architecture and rejected alternatives;
- architecture assumptions needing repository/platform validation;
- decisions requiring approval;
- unresolved questions;
- a concise implementation brief.

The coding agent responds with:

- repository/platform conflicts;
- affected files;
- architecture feasibility findings;
- implementation plan;
- verification commands/procedures;
- documentation updates required.

## 8. Completion rule

No AI-generated artifact is complete merely because it is well written.

Completion requires the applicable gate:

- product artifact: human approval;
- module/global architecture artifact: human approval and repository/platform feasibility check;
- implementation design: architecture consistency review;
- implementation: tests and review;
- generated context: renderer and validation pass;
- feature: acceptance evidence, architecture evidence proportional to risk, and human acceptance.

See `docs/architecture/MODULE_ARCHITECTURE_GUIDE.md` for module architecture responsibilities and review gates.
