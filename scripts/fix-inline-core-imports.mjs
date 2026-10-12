#!/usr/bin/env node
/**
 * One-off fixer: rewrites inline type imports of the form
 *   import('...core/...').Symbol
 * to the direct entity module that declares `Symbol`.
 *
 * Usage: node scripts/fix-inline-core-imports.mjs [--dry-run]
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = join(ROOT, 'src', 'app');
const DRY_RUN = process.argv.includes('--dry-run');

// Symbol -> module (relative to src/app) that declares it.
const SYMBOL_TARGETS = {
  AppColorScheme: 'entities/user/model',
  CardIndexMetaOverride: 'entities/card/model',
  CardSearchCriteria: 'entities/card/model',
  ContentLanguage: 'entities/card/model',
  LanguagePair: 'entities/language-pair/model/language-pair.types',
  LearningProficiencyLevel: 'entities/learning/model',
  Lesson: 'entities/course/model',
  RomanizationSystem: 'entities/phonetic/model',
  Scenario: 'entities/scenario/model',
  ScenarioCardSource: 'entities/scenario/model',
  ScenarioCardSort: 'entities/scenario/model',
  UserPreferences: 'entities/user/model',
};

const norm = (p) => p.replace(/\\/g, '/');

function collectTsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

function emitRel(fromFile, targetRel) {
  const targetAbs = join(APP_DIR, targetRel);
  let rel = norm(relative(dirname(fromFile), targetAbs));
  if (rel.endsWith('/index.ts')) rel = rel.slice(0, -'/index.ts'.length);
  else if (rel.endsWith('.ts')) rel = rel.slice(0, -3);
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

let fixed = 0;
for (const file of collectTsFiles(APP_DIR)) {
  const content = readFileSync(file, 'utf8');
  const re = /import\(\s*['"]([^'"]+)['"]\s*\)\.([A-Za-z_$][\w$]*)/g;
  let out = '';
  let last = 0;
  let changed = false;
  let m;
  while ((m = re.exec(content)) !== null) {
    const spec = m[1];
    const symbol = m[2];
    const abs = resolve(dirname(file), spec);
    const rel = norm(relative(APP_DIR, abs));
    const isCore = rel === 'core' || rel.startsWith('core/');
    if (!isCore) {
      out += content.slice(last, m.index + m[0].length);
      last = m.index + m[0].length;
      continue;
    }
    const target = SYMBOL_TARGETS[symbol];
    if (!target) {
      console.error(`❌ no target for '${symbol}' in ${norm(relative(APP_DIR, file))}`);
      process.exit(1);
    }
    const replacement = `import('${emitRel(file, target)}').${symbol}`;
    out += content.slice(last, m.index) + replacement;
    last = m.index + m[0].length;
    changed = true;
  }
  out += content.slice(last);
  if (changed) {
    if (DRY_RUN) {
      console.log(`[dry-run] fix ${norm(relative(APP_DIR, file))}`);
    } else {
      writeFileSync(file, out);
      console.log(`Fixed ${norm(relative(APP_DIR, file))}`);
    }
    fixed++;
  }
}
console.log(`\nDone: ${fixed} file(s) with inline core type imports fixed.`);