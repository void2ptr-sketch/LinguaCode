#!/usr/bin/env node
/**
 * FSD (Feature-Sliced Design) layer audit for src/app.
 *
 * Checks:
 *  1. Layer direction: app -> pages -> widgets -> features -> entities -> shared
 *     (a module may only import from its own layer or layers below it)
 *  2. No cross-slice imports within the same layer
 *     (e.g. features/card-editor must not import features/card-select)
 *
 * Usage: node scripts/audit-fsd.mjs
 * Exit code 0 = clean, 1 = violations found.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

const ROOT = resolve('src/app');
// FSD layer order: shared (bottom) -> entities -> features -> widgets -> pages -> app (top).
// A module may import from its own layer or any layer BELOW it (lower index).
const LAYERS = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'];
const LAYER_INDEX = Object.fromEntries(LAYERS.map((l, i) => [l, i]));

const violations = [];
let checked = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (entry.endsWith('.ts')) {
      checkFile(full);
    }
  }
}

function layerOf(file) {
  const rel = relative(ROOT, file);
  const first = rel.split('/')[0];
  return LAYER_INDEX[first] !== undefined ? first : null;
}

function sliceOf(file) {
  const rel = relative(ROOT, file);
  const parts = rel.split('/');
  return parts.length >= 2 ? parts[1] : null;
}

function checkFile(file) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const fromLayer = layerOf(file);
  const fromSlice = sliceOf(file);

  lines.forEach((line, idx) => {
    const m = line.match(/(?:from\s+|import\s*\()\s*['"](\.[^'"]+)['"]/);
    if (!m) return;
    const spec = m[1];
    const target = resolve(dirname(file), spec);
    const relTarget = relative(ROOT, target);
    if (relTarget.startsWith('..')) return; // outside src/app
    checked++;

    const toLayer = relTarget.split('/')[0];

    if (!LAYER_INDEX[toLayer]) return; // not a known layer

    // 1. Layer direction
    if (LAYER_INDEX[toLayer] > LAYER_INDEX[fromLayer]) {
      violations.push(
        `LAYER UP: ${relative(ROOT, file)}:${idx + 1} imports '${spec}' (${fromLayer} -> ${toLayer})`
      );
    }

    // 2. Cross-slice within same layer
    if (toLayer === fromLayer && toLayer !== 'app' && toLayer !== 'shared') {
      const toSlice = relTarget.split('/')[1];
      if (toSlice && toSlice !== fromSlice) {
        violations.push(
          `CROSS-SLICE: ${relative(ROOT, file)}:${idx + 1} imports '${spec}' (${fromLayer}/${fromSlice} -> ${toLayer}/${toSlice})`
        );
      }
    }

  });
}

walk(ROOT);

if (violations.length) {
  console.log(`FSD audit: ${violations.length} violation(s) found (${checked} imports checked):\n`);
  for (const v of violations) console.log('  ' + v);
  process.exit(1);
} else {
  console.log(`FSD audit OK: ${checked} imports respect layer direction and slice isolation.`);
}