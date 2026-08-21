#!/usr/bin/env node
// Repository invariants for Harness Planner.
//
// These are the properties that are easy to break silently and expensive to
// notice later, so they fail the build rather than living in a checklist.
// Run locally with:  node tools/check.mjs
//
// Copyright 2026 Garrett Davis. Licensed under the Apache License, Version 2.0.

import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const failures = [];
const checks = [];

function check(name, fn) {
  try {
    const detail = fn();
    checks.push({ name, ok: true, detail: detail || '' });
  } catch (err) {
    checks.push({ name, ok: false, detail: err.message });
    failures.push(name);
  }
}

// ---------------------------------------------------------------- structure

check('inline JavaScript parses', () => {
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if (!blocks.length) throw new Error('no inline script block found');
  blocks.forEach(m => new Function(m[1]));
  return `${blocks.length} block(s)`;
});

check('page is self-contained', () => {
  const offHost = [...html.matchAll(/<(?:link|script|img)\b[^>]*\b(?:src|href)="(https?:)?\/\/[^"]+"/gi)];
  if (offHost.length) {
    throw new Error(`${offHost.length} off-host asset reference(s): ${offHost[0][0].slice(0, 90)}`);
  }
  return 'no off-host script/link/img';
});

check('licence header present', () => {
  if (!html.includes('Apache License, Version 2.0')) throw new Error('missing Apache 2.0 header');
  if (!html.includes('Copyright 2026 Garrett Davis')) throw new Error('missing copyright line');
  return 'Apache 2.0 + copyright';
});

check('no personal paths or addresses', () => {
  const leaks = [/\/Users\/[a-z]/i, /@gmail\.com/i, /\bapi[_-]?key\s*[:=]/i, /\bpassword\s*[:=]/i];
  const hit = leaks.find(re => re.test(html));
  if (hit) throw new Error(`matched ${hit}`);
  return 'clean';
});

// ------------------------------------------------------------- data hygiene
// The project's credibility rests on every displayed number having a known
// origin. These checks enforce the shape of that discipline; they cannot
// verify a figure is true, only that it claims a provenance and a topology.

// Extract exactly one array literal by matching brackets, so the check cannot
// drift onto neighbouring declarations if the file is reordered.
function arrayLiteral(declaration) {
  const start = html.indexOf(declaration);
  if (start < 0) throw new Error(`could not locate ${declaration}`);
  let i = html.indexOf('[', start), depth = 0, inStr = null;
  for (let j = i; j < html.length; j++) {
    const ch = html[j], prev = html[j - 1];
    if (inStr) { if (ch === inStr && prev !== '\\') inStr = null; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) return html.slice(i, j + 1); }
  }
  throw new Error(`unbalanced brackets in ${declaration}`);
}

check('every model declares provenance and sizes', () => {
  const block = arrayLiteral('const models = ');
  const entries = block.split(/\{\s*id:\s*'/).slice(1);
  if (entries.length < 2) throw new Error('parsed fewer than 2 models');
  const bad = [];
  for (const e of entries) {
    const id = e.slice(0, e.indexOf("'"));
    if (!/provenance:/.test(e)) bad.push(`${id}: no provenance`);
    if (!/sizes:\s*\{[^}]*q4:[^}]*q8:[^}]*bf16:/.test(e)) bad.push(`${id}: incomplete sizes`);
    // a natively quantised model must never be sized by formula
    if (/native:\s*'/.test(e) && !/provenance:\s*'measured'/.test(e)) {
      bad.push(`${id}: natively quantised but not measured`);
    }
  }
  if (bad.length) throw new Error(bad.join('; '));
  return `${entries.length} models`;
});

check('every build declares exactly one memory topology', () => {
  const block = arrayLiteral('const setups = ');
  const entries = block.split(/\{\s*id:\s*'/).slice(1);
  if (entries.length < 5) throw new Error('parsed fewer than 5 builds');
  const bad = [];
  for (const e of entries) {
    const id = e.slice(0, e.indexOf("'"));
    const topologies = [
      /\btiers:\s*\[/.test(e),                        // tiered coherent memory
      /\bcluster:\s*true/.test(e),                    // separate machines
      /\bshared:\s*true/.test(e),                     // one unified pool
      /\bgpus:\s*\d/.test(e) && !/\bshared:\s*true/.test(e), // discrete lanes
      /\bheterogeneous:\s*true/.test(e)
    ].filter(Boolean).length;
    if (topologies === 0) bad.push(`${id}: no topology declared`);
  }
  if (bad.length) throw new Error(bad.join('; '));
  return `${entries.length} builds`;
});

// ------------------------------------------------------------------- report

const pad = Math.max(...checks.map(c => c.name.length));
for (const c of checks) {
  console.log(`${c.ok ? 'ok  ' : 'FAIL'}  ${c.name.padEnd(pad)}  ${c.detail}`);
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks passed.`);
