#!/usr/bin/env node
/**
 * Rewrites stale `core/...` path references in documentation to their new
 * FSD locations, using the mapping from scripts/fsd-mapping-full.json.
 *
 * Handles three spellings:
 *   src/app/core/...   app/core/...   core/...
 *
 * Usage: node scripts/update-docs-core-paths.mjs [--dry-run]
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DRY_RUN = process.argv.includes('--dry-run');

const MAPPING = JSON.parse(
  readFileSync(join(ROOT, 'scripts', 'fsd-mapping-full.json'), 'utf8'),
);
// Longest keys first so `core/models/cards` wins over `core/models`.
const entries = Object.entries(MAPPING)
  .map(([k, v]) => [k.replace(/^\.\//, '').replace(/\/+$/, ''), v.replace(/^\.\//, '').replace(/\/+$/, '')])
  .sort((a, b) => b[0].length - a[0].length);

function rewrite(content) {
  let out = content;
  for (const [oldPath, newPath] of entries) {
    // src/app/core/... -> src/app/<new>
    out = out.split(`src/app/${oldPath}`).join(`src/app/${newPath}`);
    // app/core/... -> app/<new>
    out = out.split(`app/${oldPath}`).join(`app/${newPath}`);
    // bare core/... -> <new> (only when not part of @angular/core/...)
    out = out.split(`@angular/${oldPath}`).join(`@angular/${oldPath}`); // no-op guard
    out = out.replace(new RegExp(`(?<![\\w/@-])${escapeRegExp(oldPath)}`, 'g'), newPath);
  }
  return out;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectMdFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectMdFiles(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

const targets = [
  ...collectMdFiles(join(ROOT, 'docs')),
  join(ROOT, 'README.md'),
  join(ROOT, 'KODA.md'),
  join(ROOT, 'TASKS.md'),
].filter((p) => statSync(p).isFile());

let changed = 0;
for (const file of targets) {
  const content = readFileSync(file, 'utf8');
  const next = rewrite(content);
  if (next !== content) {
    if (DRY_RUN) {
      console.log(`[dry-run] ${file.replace(ROOT + '/', '')}`);
    } else {
      writeFileSync(file, next);
      console.log(`Updated ${file.replace(ROOT + '/', '')}`);
    }
    changed++;
  }
}
console.log(`\nDone: ${changed} file(s) updated.`);