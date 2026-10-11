#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'context.config.json');
const failures = [];
const warnings = [];

function normalize(filePath) {
  return filePath.split(path.sep).join('/');
}

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(absolute(relativePath));
}

function read(relativePath) {
  return fs.readFileSync(absolute(relativePath), 'utf8');
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const item = path.join(directory, entry.name);
    const relative = normalize(path.relative(root, item));

    if (entry.isDirectory()) {
      if (['.git', 'node_modules', '.context-cache'].includes(entry.name)) return [];
      return walk(item);
    }

    return [relative];
  });
}

function frontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;
    result[pair[1]] = pair[2].replace(/^['"]|['"]$/g, '').trim();
  }
  return result;
}

function isTemplateFile(file) {
  return file.includes('/_templates/') || file.endsWith('.template.md');
}

function hasPlaceholder(value) {
  return /\{\{[^}]+\}\}/.test(value);
}

if (!fs.existsSync(configPath)) failures.push('Missing context.config.json.');

const config = fs.existsSync(configPath)
  ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
  : {
      templateMode: false,
      requiredFiles: [],
      generatedFiles: [],
      placeholderSensitiveFiles: []
    };

for (const file of config.requiredFiles ?? []) {
  if (!exists(file)) failures.push(`Missing required file: ${file}`);
}

for (const file of config.generatedFiles ?? []) {
  if (!exists(file)) continue;
  const content = read(file);
  if (!/GENERATED FILE|GENERATED:/.test(content)) {
    failures.push(`Generated file is missing a generated-file banner: ${file}`);
  }
}

const markdownFiles = walk(root).filter((file) => file.endsWith('.md'));
const validStatuses = new Set([
  'template',
  'draft',
  'review',
  'approved',
  'implementing',
  'verification',
  'implemented',
  'superseded',
  'active',
  'inactive',
  'pending',
  'partial',
  'verified',
  'rejected',
  'proposed',
  'accepted',
  'deprecated'
]);

const idOwners = new Map();

for (const file of markdownFiles) {
  const content = read(file);
  const meta = frontmatter(content);

  if (!isTemplateFile(file) && meta.id && !hasPlaceholder(meta.id)) {
    const previous = idOwners.get(meta.id);
    if (previous) failures.push(`Duplicate frontmatter id '${meta.id}' in ${previous} and ${file}.`);
    else idOwners.set(meta.id, file);
  }

  if (meta.status && !hasPlaceholder(meta.status)) {
    const status = meta.status.toLowerCase();
    if (!validStatuses.has(status)) failures.push(`Invalid status '${meta.status}' in ${file}.`);
  }

  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of content.matchAll(linkPattern)) {
    let target = match[1].trim().split(/\s+['"]/)[0];
    if (!target || /^(https?:|mailto:|#)/.test(target) || hasPlaceholder(target)) continue;

    target = target.split('#')[0].split('?')[0];
    if (!target) continue;

    const resolved = target.startsWith('/')
      ? path.join(root, target.slice(1))
      : path.resolve(root, path.dirname(file), target);

    if (!fs.existsSync(resolved)) failures.push(`Broken relative link in ${file}: ${match[1]}`);
  }
}

const statePath = 'docs/context/state.yaml';
if (exists(statePath)) {
  const state = read(statePath);
  if (!/^schema_version:\s*\d+/m.test(state)) failures.push('state.yaml is missing schema_version.');
  if (!/^features:\s*(\[\])?\s*$/m.test(state) && !/^features:\s*$/m.test(state)) {
    warnings.push('Could not confidently detect the features collection in state.yaml.');
  }

  if (!config.templateMode && hasPlaceholder(state)) {
    failures.push('Unresolved placeholder in docs/context/state.yaml.');
  }
}

if (!config.templateMode) {
  for (const file of config.placeholderSensitiveFiles ?? []) {
    if (exists(file) && hasPlaceholder(read(file))) {
      failures.push(`Unresolved placeholder in active core file: ${file}`);
    }
  }

  for (const file of config.generatedFiles ?? []) {
    if (exists(file) && /renderer has not been bootstrapped/i.test(read(file))) {
      failures.push(`Context renderer is not bootstrapped: ${file}`);
    }
  }
}

const handoffPath = 'docs/handoff/current.md';
if (exists(handoffPath)) {
  const meta = frontmatter(read(handoffPath));
  if (meta.status === 'active' && meta.expires_after && !hasPlaceholder(meta.expires_after)) {
    const expiry = new Date(`${meta.expires_after}T23:59:59Z`);
    if (!Number.isNaN(expiry.valueOf()) && expiry < new Date()) {
      warnings.push(`Active handoff expired on ${meta.expires_after}; revalidate before use.`);
    }
  }
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\nContext validation failed with ${failures.length} error(s).`);
  process.exit(1);
}

console.log(
  `Context validation passed: ${markdownFiles.length} Markdown files, ${idOwners.size} unique active IDs.`
);
