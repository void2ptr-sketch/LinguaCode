#!/usr/bin/env node
/**
 * Rules audit for .continue/rules/.
 *
 * Checks:
 *  1. Front-matter: parseable, required keys (description, globs|alwaysApply,
 *     lastReviewed, reviewInterval), no duplicate keys.
 *  2. Filename scheme NN.domain.NZ.name.rule.md; NN<->domain mapping; unique NZ per domain.
 *  3. Cross-references to other rules (backtick / markdown refs) resolve to existing rule files.
 *  4. References to `npm run <script>` resolve in package.json scripts.
 *  5. Relative markdown links resolve to existing paths.
 *  6. Every rule file is indexed in CONTINUE.md (References section) and vice versa.
 *  7. lastReviewed falls within reviewInterval (warning only — review cycle signal).
 *
 * Usage: node scripts/audit-rules.mjs
 * Exit code 0 = clean, 1 = violations found.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const ROOT = resolve('.');
const RULES_DIR = resolve('.continue/rules');
const CONTINUE_FILE = join(RULES_DIR, 'CONTINUE.md');
// Rule filenames follow the scheme NN.domain.NZ.name.rule.md (see 01.meta.09).
const RULE_FILE_RE = /(?:NN|\d{2})\.[a-z]+\.[a-z0-9-]+\.rule\.md/;

// NN (fixed domain order number) <-> domain mapping, see 01.meta.09.rules-maintenance.rule.md.
const DOMAIN_TO_NN = {
  meta: '01',
  architecture: '02',
  angular: '03',
  design: '04',
  business: '05',
};
const NN_TO_DOMAIN = Object.fromEntries(
  Object.entries(DOMAIN_TO_NN).map(([d, nn]) => [nn, d]),
);

const violations = [];
const warnings = [];

/** Minimal line-based front-matter parser. Returns { entries, ok, reason }. */
function parseFrontMatter(content) {
  const lines = content.split('\n');
  if (lines[0].trim() !== '---') {
    return { ok: false, reason: 'missing front-matter opening ---' };
  }
  const entries = [];
  let closed = false;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') {
      closed = true;
      break;
    }
    const m = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (m) {
      // Strip trailing inline comments (YAML-style "# ...") from values.
      const value = m[2].replace(/\s+#.*$/, '').trim();
      entries.push({ key: m[1], value, line: i + 1 });
    }
  }
  if (!closed) return { ok: false, reason: 'front-matter not closed (---)' };
  return { ok: true, entries };
}

function ruleFiles() {
  return readdirSync(RULES_DIR).filter((f) => f.endsWith('.rule.md')).sort();
}

function checkFrontMatter(file, content) {
  const { ok, reason, entries } = parseFrontMatter(content);
  if (!ok) {
    violations.push(`FRONT-MATTER: ${file}: ${reason}`);
    return;
  }
  const keys = new Map();
  for (const e of entries) {
    if (keys.has(e.key)) {
      violations.push(`FRONT-MATTER: ${file}:${e.line}: duplicate key '${e.key}'`);
    } else {
      keys.set(e.key, e.line);
    }
  }
  const get = (k) => keys.get(k) !== undefined ? entries.find((e) => e.key === k).value : undefined;
  if (!keys.has('description')) {
    violations.push(`FRONT-MATTER: ${file}: missing required key 'description'`);
  }
  if (!keys.has('globs') && !keys.has('alwaysApply')) {
    violations.push(`FRONT-MATTER: ${file}: missing 'globs' or 'alwaysApply'`);
  }
  const reviewed = get('lastReviewed');
  if (!reviewed || !/^\d{4}-\d{2}-\d{2}$/.test(reviewed)) {
    violations.push(`FRONT-MATTER: ${file}: 'lastReviewed' must be an ISO date (YYYY-MM-DD), got '${reviewed}'`);
    return;
  }
  const interval = get('reviewInterval');
  if (!interval || !/^\d+d$/.test(interval)) {
    violations.push(`FRONT-MATTER: ${file}: 'reviewInterval' must match {n}d (e.g. 90d), got '${interval}'`);
    return;
  }
  const days = parseFloat(interval);
  const ageDays = (Date.now() - Date.parse(reviewed)) / 86_400_000;
  if (ageDays > days) {
    warnings.push(
      `STALE: ${file}: lastReviewed ${reviewed} is ${Math.floor(ageDays)}d old (> ${interval} reviewInterval)`,
    );
  }
}

function checkNaming(file) {
  const m = file.match(/^(\d{2})\.([a-z]+)\.(\d{2})\.(.+)\.rule\.md$/);
  if (!m) {
    violations.push(`NAMING: ${file}: expected NN.domain.NZ.name.rule.md`);
    return null;
  }
  const [, nn, domain, nz] = m;
  if (DOMAIN_TO_NN[domain] !== nn) {
    violations.push(
      `NAMING: ${file}: NN '${nn}' does not match domain '${domain}' (expected '${DOMAIN_TO_NN[domain]}')`,
    );
  }
  if (!NN_TO_DOMAIN[nn]) {
    violations.push(`NAMING: ${file}: unknown domain number '${nn}'`);
  }
  return { nn, domain, nz };
}

function checkRuleReferences(file, content, knownRules) {
  const refs = new Set();
  for (const m of content.matchAll(/`([^`]+?\.rule\.md)`/g)) refs.add(m[1]);
  for (const m of content.matchAll(/\[[^\]]*\]\(([^)#\s]+\.rule\.md)\)/g)) refs.add(m[1]);
  for (const m of content.matchAll(/\.continue\/rules\/([A-Za-z0-9._-]+\.rule\.md)/g)) refs.add(m[1]);
  for (const ref of refs) {
    if (!RULE_FILE_RE.test(ref)) continue; // not a rule filename (e.g. glob '*.rule.md')
    if (ref.startsWith('NN.')) continue; // naming template, not a real rule file
    const base = ref.split('/').pop();
    if (!knownRules.has(base)) {
      violations.push(`RULE-REF: ${file}: references unknown rule '${ref}'`);
    }
  }
  return refs;
}

function checkNpmRefs(file, content, scripts) {
  for (const m of content.matchAll(/`npm run ([a-z0-9:_-]+)`/g)) {
    if (!(m[1] in scripts)) {
      violations.push(`NPM-REF: ${file}: 'npm run ${m[1]}' not found in package.json scripts`);
    }
  }
}

function checkLinks(file, content) {
  for (const m of content.matchAll(/\[[^\]]*\]\(([^)#\s]+)\)/g)) {
    const target = m[1];
    if (
      !target ||
      target.startsWith('#') ||
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('mailto:') ||
      target.startsWith('tel:') ||
      target.startsWith('/')
    ) {
      continue;
    }
    const full = resolve(dirname(join(ROOT, file)), target);
    try {
      statSync(full);
    } catch {
      violations.push(`LINK: ${file}: linked path does not exist: '${target}'`);
    }
  }
}

const scripts = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts;
const files = ruleFiles();
const knownRules = new Set(files);

for (const f of files) {
  const rel = join('.continue/rules', f);
  const content = readFileSync(join(RULES_DIR, f), 'utf8');
  checkFrontMatter(f, content);
  checkNaming(f);
  checkRuleReferences(rel, content, knownRules);
  checkNpmRefs(rel, content, scripts);
  checkLinks(rel, content);
}

// CONTINUE.md: index drift (each rule must be listed; listed rules must exist).
if (statSync(CONTINUE_FILE).isFile()) {
  const continueContent = readFileSync(CONTINUE_FILE, 'utf8');
  const indexed = new Set(
    [...continueContent.matchAll(/\.continue\/rules\/([A-Za-z0-9._-]+\.rule\.md)/g)].map(
      (m) => m[1],
    ),
  );
  for (const f of files) {
    if (!indexed.has(f)) {
      violations.push(`INDEX: ${f}: not listed in ${relLabel(CONTINUE_FILE)} (References section)`);
    }
  }
  for (const f of indexed) {
    if (!knownRules.has(f)) {
      violations.push(`INDEX: ${f}: listed in ${relLabel(CONTINUE_FILE)} but file does not exist`);
    }
  }
  checkRuleReferences(relLabel(CONTINUE_FILE), continueContent, knownRules);
  checkNpmRefs(relLabel(CONTINUE_FILE), continueContent, scripts);
  checkLinks(relLabel(CONTINUE_FILE), continueContent);
}

function relLabel(p) {
  return p.replace(`${ROOT}/`, '') || p;
}

if (warnings.length) {
  console.log(`Rules audit: ${warnings.length} warning(s):\n`);
  for (const w of warnings) console.log('  ' + w);
  console.log();
}

if (violations.length) {
  console.log(`Rules audit: ${violations.length} violation(s) found (${files.length} rule files checked):\n`);
  for (const v of violations) console.log('  ' + v);
  process.exit(1);
} else {
  console.log(
    `Rules audit OK: ${files.length} rule files have valid front-matter, naming, references and index.`,
  );
}