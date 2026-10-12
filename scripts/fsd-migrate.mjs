#!/usr/bin/env node
/**
 * FSD migration helper.
 *
 * Moves files/directories according to a mapping (old path -> new path,
 * both relative to src/app) and rewrites ALL relative imports across
 * src/app so the project stays compilable after each phase.
 *
 * Usage:
 *   node scripts/fsd-migrate.mjs <mapping.json>
 *
 * The mapping file is a flat JSON object:
 *   { "core/models/cards": "entities/card/model", ... }
 *
 * Notes:
 * - Only relative imports (starting with '.') are rewritten.
 * - Directory prefixes are matched longest-first, so mapping a directory
 *   covers every file below it.
 * - Barrel files (index.ts) that re-export moved modules may need manual
 *   fixes afterwards (the script rewrites their relative paths, but a
 *   barrel in `shared` must not re-export from `entities`/`widgets`).
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = join(ROOT, 'src', 'app');

const mappingFile = process.argv[2];
if (!mappingFile) {
  console.error('Usage: node scripts/fsd-migrate.mjs <mapping.json>');
  process.exit(1);
}

const norm = (p) => p.replace(/^\.\//, '').replace(/\/+$/, '');
const MAPPING = JSON.parse(readFileSync(join(ROOT, mappingFile), 'utf8'));
const mapping = {};
for (const [k, v] of Object.entries(MAPPING)) mapping[norm(k)] = norm(v);

// ── 1. Move files/directories ────────────────────────────────────────────────
// When a directory is moved into an existing directory, its contents are
// merged recursively instead of nesting the source directory inside.
function movePath(oldAbs, newAbs) {
  if (
    statSync(oldAbs).isDirectory() &&
    existsSync(newAbs) &&
    statSync(newAbs).isDirectory()
  ) {
    for (const entry of readdirSync(oldAbs)) {
      movePath(join(oldAbs, entry), join(newAbs, entry));
    }
    rmSync(oldAbs, { recursive: true });
    return;
  }
  mkdirSync(dirname(newAbs), { recursive: true });
  renameSync(oldAbs, newAbs);
}

let moved = 0;
for (const [oldPath, newPath] of Object.entries(mapping)) {
  const oldAbs = join(APP_DIR, oldPath);
  const newAbs = join(APP_DIR, newPath);
  if (!existsSync(oldAbs)) {
    console.warn(`SKIP (missing): ${oldPath}`);
    continue;
  }
  movePath(oldAbs, newAbs);
  moved++;
}
console.log(`Moved ${moved} paths.`);

// ── 2. Resolve a path (relative to src/app) to its new location ──────────────
function mapPath(rel) {
  if (mapping[rel]) return mapping[rel];
  const prefixes = Object.keys(mapping)
    .filter((p) => rel.startsWith(p + '/'))
    .sort((a, b) => b.length - a.length);
  if (prefixes.length === 0) return null;
  return mapping[prefixes[0]] + rel.slice(prefixes[0].length);
}

// ── 3. Rewrite relative imports in every .ts file under src/app ──────────────
function collectTsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

// Reverse mapping: new path -> old path (longest-prefix aware).
const reverse = {};
for (const [oldP, newP] of Object.entries(mapping)) reverse[newP] = oldP;

function findOldPath(newRel) {
  if (reverse[newRel]) return reverse[newRel];
  const prefixes = Object.keys(reverse)
    .filter((p) => newRel.startsWith(p + '/'))
    .sort((a, b) => b.length - a.length);
  if (prefixes.length === 0) return null;
  return reverse[prefixes[0]] + newRel.slice(prefixes[0].length);
}

let rewrittenFiles = 0;
let rewrittenImports = 0;
for (const file of collectTsFiles(APP_DIR)) {
  const content = readFileSync(file, 'utf8');
  const fileDir = dirname(file);
  const fileRel = relative(APP_DIR, file).split(sep).join('/');
  const oldFileRel = findOldPath(fileRel);
  // Imports of moved files are resolved from their ORIGINAL location,
  // because the specifiers were written relative to it.
  const baseDir = oldFileRel
    ? dirname(join(APP_DIR, oldFileRel))
    : fileDir;
  const newContent = content.replace(
    /((?:from\s+|import\s*\(\s*))['"]([^'"]+)['"]/g,
    (match, prefix, spec) => {
      if (!spec.startsWith('.')) return match;
      const abs = resolve(baseDir, spec);
      const rel = relative(APP_DIR, abs).split(sep).join('/');
      const newRel = mapPath(rel);
      // Unmoved file + unmoved target => nothing to do.
      if (!oldFileRel && !newRel) return match;
      const targetAbs = newRel ? join(APP_DIR, newRel) : abs;
      let newSpec = relative(fileDir, targetAbs).split(sep).join('/');
      if (!newSpec.startsWith('.')) newSpec = './' + newSpec;
      if (newSpec === spec) return match;
      rewrittenImports++;
      return `${prefix}'${newSpec}'`;
    },
  );
  if (newContent !== content) {
    writeFileSync(file, newContent);
    rewrittenFiles++;
  }
}
console.log(
  `Rewrote imports in ${rewrittenFiles} files (${rewrittenImports} imports).`,
);

// ── 4. Remove empty directories left behind ──────────────────────────────────
function removeEmptyDirs(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      removeEmptyDirs(full);
      if (readdirSync(full).length === 0) rmSync(full, { recursive: true });
    }
  }
}
removeEmptyDirs(APP_DIR);
console.log('Done.');