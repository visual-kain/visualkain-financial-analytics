// Extract paper-related rules from visualkaindb globals.css into a scoped stylesheet.
// Usage: node extract-legacy-css.mjs <legacyCss> <outCss> <faRoot>
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const [, , legacyCssPath, outPath, faRoot] = process.argv;
const require = createRequire(path.join(faRoot, 'package.json'));
const postcss = require('postcss');

const SCOPE = '.vk-legacy';
const PAPER_CLASSES = new Set(`client-col-left client-col-right client-detail-row company-info full-width grand-total invoice-client invoice-footer invoice-footer-left invoice-header invoice-items invoice-meta invoice-notes invoice-paper invoice-pay-box invoice-totals kop-garis kop-left kop-logo kop-qr-text kop-right kop-surat kop-text ks-isi-surat ks-paragraph letter-footer-print letter-paper num ph-catatan-box ph-doc-header ph-isi-awal ph-items-print ph-kepada ph-kepada-label ph-kepada-nama ph-meta-table ph-penutup ph-salam ph-ttd-block ph-ttd-company ph-ttd-layout ph-ttd-line ph-ttd-space ph-ttd-spacer ph-ttd-sub po-dp-row po-identity-bar po-items-compact po-kop-label po-note-line po-paper po-paper-footer po-sig-block po-sig-company po-sig-label po-sig-name po-sig-row po-sig-space po-vbar-sep po-vendor-bar techpack-paper total-row tp-acc-frame tp-acc-rotate-hint tp-acc-section tp-date tp-deadline tp-footer-print tp-grid-info tp-header tp-id tp-info tp-logo tp-notes-box tp-prod-item tp-prod-list tp-row tp-sc-image tp-sc-layout tp-sc-note tp-sc-page-title tp-sc-table tp-sc-table-wrap tp-section tp-size-body tp-size-container tp-size-group tp-size-header tp-size-item portrait landscape`.split(/\s+/));
const PAPER_IDS = new Set(['invoicePaper', 'ksPaper', 'phPaper', 'poPaper', 'techpackMainPaper', 'tpAccPaper', 'tpSizeChartPaper']);
const ELEMENT_ONLY = /^(\*|h[1-6]|p|table|thead|tbody|tr|th|td|ul|ol|li|strong|b|img|span|div|a)(\s*[,>+~ ]\s*(h[1-6]|p|table|thead|tbody|tr|th|td|ul|ol|li|strong|b|img|span|div|a))*$/;
const ROOT_SEL = /^(:root|html|body)$/;
const ROOT_DROP_PROPS = new Set(['background', 'background-color', 'min-height', 'overflow', 'overflow-x', 'overflow-y']);

function selectorRelevant(sel) {
  const s = sel.trim();
  if (ROOT_SEL.test(s)) return true;
  if (ELEMENT_ONLY.test(s)) return true;
  const classes = [...s.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
  const ids = [...s.matchAll(/#([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
  return classes.some((c) => PAPER_CLASSES.has(c)) || ids.some((i) => PAPER_IDS.has(i));
}

function scopeSelector(sel) {
  const s = sel.trim();
  if (ROOT_SEL.test(s)) return SCOPE;
  const replaced = s.replace(/^(html\s+)?body\b/, SCOPE);
  if (replaced !== s) return replaced;
  return `${SCOPE} ${s}`;
}

// Screen media: rules for min-width <= 1024 always apply on the A4 preview; max-width rules are mobile
// reflows/scales that the fit-to-width wrapper replaces, so they are dropped.
function mediaPolicy(params) {
  const p = params.replace(/\s+/g, ' ').trim();
  if (/print/.test(p)) return 'print';
  const min = p.match(/min-width:\s*(\d+)px/);
  const max = p.match(/max-width:\s*(\d+)px/);
  if (max) return 'drop';
  if (min) return Number(min[1]) <= 1024 ? 'unwrap' : 'drop';
  return 'keep';
}

const src = readFileSync(legacyCssPath, 'utf8');
const root = postcss.parse(src);
const out = postcss.root();
const report = { kept: 0, dropped: 0, media: {} };

function processRule(rule) {
  const relevant = rule.selectors.filter(selectorRelevant);
  if (relevant.length === 0) {
    report.dropped++;
    return null;
  }
  const clone = rule.clone({ selectors: relevant.map(scopeSelector) });
  const isRoot = relevant.some((s) => ROOT_SEL.test(s.trim()));
  clone.walkDecls((d) => {
    if (isRoot && ROOT_DROP_PROPS.has(d.prop)) d.remove();
    if (d.prop === 'animation' || d.prop === 'animation-name') d.remove();
    // visualkaindb hanya memuat Open Sans 300–700, jadi bobot 800/900 tampil sebagai 700.
    if (d.prop === 'font-weight' && /^(800|900)/.test(d.value)) d.value = d.value.replace(/^(800|900)/, '700');
  });
  if (clone.nodes.length === 0) return null;
  report.kept++;
  return clone;
}

root.each((node) => {
  if (node.type === 'rule') {
    const r = processRule(node);
    if (r) out.append(r);
    return;
  }
  if (node.type === 'atrule' && node.name === 'media') {
    const policy = mediaPolicy(node.params);
    report.media[node.params] = report.media[node.params] || { policy, rules: 0 };
    if (policy === 'drop') return;
    const target = policy === 'unwrap' ? out : postcss.atRule({ name: 'media', params: node.params });
    let count = 0;
    node.each((child) => {
      if (child.type === 'rule') {
        const r = processRule(child);
        if (r) {
          target.append(r);
          count++;
        }
      }
      // @page is injected by the print portal so the finance report keeps its own margins.
    });
    report.media[node.params].rules += count;
    if (policy !== 'unwrap' && count > 0) out.append(target);
  }
});

const header = `/* Generated from visualkaindb src/app/globals.css by extract-legacy-css.mjs. Do not edit by hand; regenerate instead. */\n`;
writeFileSync(outPath, header + out.toString() + '\n');
console.log(JSON.stringify(report, null, 2));
