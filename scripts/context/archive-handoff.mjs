#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const currentPath = path.join(root, 'docs/handoff/current.md');
const archiveDirectory = path.join(root, 'docs/handoff/archive');

function value(content, key, fallback) {
  const match = content.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)`, 'm'));
  return match?.[1]?.trim() || fallback;
}

function slug(input, fallback) {
  if (!input || /\{\{|none/i.test(input)) return fallback;
  return input.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || fallback;
}

if (!fs.existsSync(currentPath)) {
  console.error('Missing docs/handoff/current.md');
  process.exit(1);
}

const current = fs.readFileSync(currentPath, 'utf8');
const status = value(current, 'status', 'inactive');

if (status !== 'active') {
  console.error('Current handoff is not active; nothing was archived.');
  process.exit(1);
}

const date = value(current, 'session_date', new Date().toISOString().slice(0, 10));
const feature = slug(value(current, 'active_feature', ''), 'no-feature');
const task = slug(value(current, 'active_task', ''), 'no-task');
const fileName = `${date}-${feature}-${task}.md`;
const archivePath = path.join(archiveDirectory, fileName);

fs.mkdirSync(archiveDirectory, { recursive: true });
if (fs.existsSync(archivePath)) {
  console.error(`Archive already exists: docs/handoff/archive/${fileName}`);
  process.exit(1);
}

fs.writeFileSync(archivePath, current);

const reset = `---
status: inactive
owner: "{{SESSION_OWNER}}"
session_date: "{{YYYY-MM-DD}}"
branch: "{{BRANCH}}"
base_commit: "{{COMMIT_BEFORE_SESSION}}"
current_commit: "{{CURRENT_COMMIT_OR_UNCOMMITTED}}"
active_feature: "{{FEATURE_ID_OR_NONE}}"
active_task: "{{TASK_ID_OR_NONE}}"
expires_after: "{{YYYY-MM-DD}}"
---

# Session Handoff

No active handoff. Start the next session by recording one objective, verified branch and worktree state, active feature, active task, completed work, evidence, blockers, and one exact next step.
`;

fs.writeFileSync(currentPath, reset);
console.log(`Archived handoff to docs/handoff/archive/${fileName} and reset current.md.`);
