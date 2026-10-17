// Appends `:not(:where(.vk-legacy *))` to globals.css selectors that style the finance report paper,
// so those rules (several with !important) do not leak into the copied visualkaindb papers.
// Usage: node scripts/legacy/isolate-fa-paper-rules.mjs src/app/globals.css
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const postcss = require('postcss');

const file = process.argv[2];
const GUARD = ':not(:where(.vk-legacy *))';
const TARGET = /(\.tp-|\.techpack-|\.invoice-items|#techpackPreviewWrapper|\.invoice-preview-wrapper)/;

const root = postcss.parse(readFileSync(file, 'utf8'));
let changed = 0;
root.walkRules((rule) => {
  if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') return;
  const next = rule.selectors.map((sel) => {
    if (!TARGET.test(sel) || sel.includes(GUARD)) return sel;
    changed++;
    return `${sel.trim()}${GUARD}`;
  });
  rule.selector = next.join(',\n');
});
writeFileSync(file, root.toString());
console.log(`guarded ${changed} selectors`);
