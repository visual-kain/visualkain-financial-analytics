#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const statePath = path.join(root, 'docs/context/PROJECT_STATE.md');
const start = '<!-- GENERATED:GIT_FACTS:START -->';
const end = '<!-- GENERATED:GIT_FACTS:END -->';

function git(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return 'unavailable';
  }
}

if (!fs.existsSync(statePath)) {
  console.error('Missing docs/context/PROJECT_STATE.md');
  process.exit(1);
}

const branch = git(['branch', '--show-current']);
const head = git(['rev-parse', '--short', 'HEAD']);
const status = git(['status', '--short']) || 'clean';
const recent = git(['log', '-5', '--pretty=format:- `%h` %s']);
const updated = new Date().toISOString();

const block = `${start}\n## Generated Git Facts\n\n- Refreshed at: ${updated}\n- Branch: \`${branch}\`\n- HEAD: \`${head}\`\n- Worktree:\n\n\`\`\`text\n${status}\n\`\`\`\n\nRecent commits:\n\n${recent}\n${end}`;

let content = fs.readFileSync(statePath, 'utf8');
const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
content = pattern.test(content)
  ? content.replace(pattern, block)
  : `${content.trimEnd()}\n\n${block}\n`;

fs.writeFileSync(statePath, content);
console.log('Updated generated Git facts in docs/context/PROJECT_STATE.md.');
