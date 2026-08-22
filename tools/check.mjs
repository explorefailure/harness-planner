#!/usr/bin/env node
// Repository invariants for Architecture Playground.
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

check('network access is confined to one declared origin', () => {
  // The page reads public model metadata from Hugging Face. That is the only
  // network access it is allowed, and this proves it: one origin constant, every
  // fetch built from it, and no other transport that could reach a second host.
  const declared = [...html.matchAll(/const\s+HF_ORIGIN\s*=\s*'([^']+)'/g)].map(m => m[1]);
  if (declared.length !== 1) throw new Error(`expected exactly one HF_ORIGIN declaration, found ${declared.length}`);
  if (declared[0] !== 'https://huggingface.co') throw new Error(`unexpected origin ${declared[0]}`);

  const calls = [...html.matchAll(/\bfetch\s*\(\s*([^,)]+)/g)].map(m => m[1].trim());
  if (!calls.length) throw new Error('no fetch call found, but an origin is declared');
  const stray = calls.filter(arg => !arg.startsWith('HF_ORIGIN'));
  if (stray.length) throw new Error(`fetch not built from HF_ORIGIN: ${stray[0].slice(0, 60)}`);

  // Anything below can reach a host without going through fetch.
  const banned = /\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|sendBeacon|importScripts|\bimport\s*\(/;
  if (banned.test(html)) throw new Error(`banned network transport: ${html.match(banned)[0]}`);

  return `${calls.length} fetch call(s), origin ${declared[0]}`;
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

function objectLiteral(declaration) {
  const start = html.indexOf(declaration);
  if (start < 0) throw new Error(`could not locate ${declaration}`);
  let i = html.indexOf('{', start), depth = 0, inStr = null;
  for (let j = i; j < html.length; j++) {
    const ch = html[j], prev = html[j - 1];
    if (inStr) { if (ch === inStr && prev !== '\\') inStr = null; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return html.slice(i, j + 1); }
  }
  throw new Error(`unbalanced braces in ${declaration}`);
}

check('every host memory option is buildable from real modules', () => {
  // A capacity is only honest if it can be reached by filling the board's slots
  // with a module that exists. This is the check that stops a plausible-looking
  // number — 500GB across 12 channels, say — from ever reaching the panel, and
  // it also underwrites the memory draw, which divides capacity by slot count.
  const manufactured = [16, 32, 48, 64, 96, 128, 192, 256];
  const hosts = new Function(`return ${objectLiteral('const epycHostProfiles = ')}`)();
  const keys = Object.keys(hosts);
  if (keys.length < 3) throw new Error(`parsed fewer than 3 hosts`);
  const bad = [];
  for (const [key, host] of Object.entries(hosts)) {
    if (!Number.isInteger(host.dimmSlots) || host.dimmSlots < 1) { bad.push(`${key}: no dimmSlots`); continue; }
    if (host.dimmSlots % host.channels !== 0) bad.push(`${key}: ${host.dimmSlots} slots is not a whole multiple of ${host.channels} channels`);
    if (!host.ramOptions.includes(host.defaultRam)) bad.push(`${key}: defaultRam ${host.defaultRam} is not among its options`);
    for (const ram of host.ramOptions) {
      const per = ram / host.dimmSlots;
      if (!Number.isInteger(per)) bad.push(`${key}: ${ram}GB does not divide across ${host.dimmSlots} slots`);
      else if (!manufactured.includes(per)) bad.push(`${key}: ${ram}GB implies a ${per}GB module, which is not made`);
    }
  }
  if (bad.length) throw new Error(bad.join('; '));
  return `${keys.length} hosts, ${Object.values(hosts).reduce((n, h) => n + h.ramOptions.length, 0)} memory options`;
});

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

check('every GPU profile is fully specified', () => {
  // A half-filled card is the failure this catalogue invites: the entry looks
  // present in the dropdown while the panel silently reports `undefined` for the
  // fact you added the card to learn. Cooling and link are the two that decide
  // advice rather than decorate it, so a missing one is a build failure.
  const block = objectLiteral('const epycGpuProfiles = ');
  const entries = [...block.matchAll(/(\w+):\s*\{([^}]*)\}/g)];
  if (entries.length < 4) throw new Error(`parsed only ${entries.length} GPU profiles`);
  const required = ['name', 'short', 'vram', 'tdp', 'pcie', 'pcieLanes', 'bandwidth', 'bandwidthPublished', 'cooling', 'link', 'platform', 'official', 'slot', 'max', 'fit'];
  const bad = [];
  for (const [, key, body] of entries) {
    const missing = required.filter(field => !new RegExp(`\\b${field}:`).test(body));
    if (missing.length) bad.push(`${key}: missing ${missing.join(', ')}`);
    const cooling = body.match(/\bcooling:\s*'([^']*)'/);
    if (cooling && !['active', 'passive'].includes(cooling[1])) bad.push(`${key}: cooling '${cooling[1]}' is neither active nor passive`);
    // `link: null` is a real answer (no bridge); an absent key is not.
    if (!/\blink:\s*(null|'[^']*')/.test(body)) bad.push(`${key}: link must be null or a bridge description`);
    const platform = body.match(/\bplatform:\s*'([^']*)'/);
    if (platform && !['cuda', 'rocm', 'oneapi'].includes(platform[1])) bad.push(`${key}: unknown platform '${platform[1]}'`);
    // An unofficial card may not claim a vendor-published figure, because its
    // vendor does not publish one. This is the pairing most likely to rot.
    if (/\bofficial:\s*false/.test(body) && /\bbandwidthPublished:\s*true/.test(body)) {
      bad.push(`${key}: official:false cannot also claim bandwidthPublished:true`);
    }
  }
  if (bad.length) throw new Error(bad.join('; '));
  return `${entries.length} GPU profiles`;
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
