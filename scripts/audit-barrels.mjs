#!/usr/bin/env node
/**
 * Audit script for barrel files (index.ts).
 *
 * For every directory containing an index.ts it verifies:
 *  1. Every non-spec, non-index .ts file in the directory is re-exported (missing exports).
 *  2. Every export in the barrel resolves to an existing file (broken exports).
 *  3. Spec files are NOT exported from barrels.
 *
 * Usage: node scripts/audit-barrels.mjs [--fix]
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(root, 'src');
const fixMode = process.argv.includes('--fix');

/** Recursively collect all index.ts files. */
function findBarrels(dir) {
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...findBarrels(full));
    } else if (entry.name === 'index.ts') {
      result.push(full);
    }
  }
  return result;
}

/** List .ts files in a directory (non-recursive), excluding index.ts and spec files. */
function listTsFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.ts') && e.name !== 'index.ts')
    .map((e) => e.name);
}

/** Parse `export ... from './path'` statements from a barrel file. */
function parseExports(file) {
  const content = readFileSync(file, 'utf8');
  const exports = [];
  const re = /export\s+(?:type\s+|interface\s+)?[^;]*?\bfrom\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    exports.push(m[1]);
  }
  return exports;
}

/** Resolve a relative module specifier to a file path. */
function resolveSpecifier(fromDir, spec) {
  if (!spec.startsWith('.')) return null; // package import, skip
  const base = join(fromDir, spec);
  const candidates = [base, `${base}.ts`, join(base, 'index.ts')];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

const findings = [];
const barrels = findBarrels(srcDir).sort();

for (const barrel of barrels) {
  const dir = dirname(barrel);
  const relDir = relative(root, dir);
  const files = listTsFiles(dir);
  const exports = parseExports(barrel);

  // 1. Files present but not exported
  const exportedNames = new Set(
    exports
      .map((s) => {
        const resolved = resolveSpecifier(dir, s);
        if (!resolved) return null;
        return basename(resolved, '.ts');
      })
      .filter(Boolean),
  );

  for (const file of files) {
    const name = basename(file, '.ts');
    if (file.endsWith('.spec.ts')) {
      if (exportedNames.has(name)) {
        findings.push({ type: 'spec-exported', barrel: relDir, file });
      }
      continue;
    }
    if (!exportedNames.has(name)) {
      findings.push({ type: 'missing', barrel: relDir, file });
    }
  }

  // 2. Exports that do not resolve
  for (const spec of exports) {
    const resolved = resolveSpecifier(dir, spec);
    if (!resolved) {
      findings.push({ type: 'broken', barrel: relDir, spec });
    }
  }
}

if (findings.length === 0) {
  console.log(`✅ Audit passed: ${barrels.length} barrels, no issues found.`);
  process.exit(0);
}

console.log(`🔍 Audit found ${findings.length} issue(s) across ${barrels.length} barrels:\n`);

const byType = {
  missing: '❌ MISSING (file exists but is not exported)',
  broken: '💥 BROKEN (export does not resolve to a file)',
  'spec-exported': '⚠️  SPEC EXPORTED (spec file re-exported from barrel)',
};

for (const type of Object.keys(byType)) {
  const items = findings.filter((f) => f.type === type);
  if (items.length === 0) continue;
  console.log(`--- ${byType[type]} (${items.length}) ---`);
  for (const f of items) {
    if (f.type === 'broken') {
      console.log(`  ${f.barrel}  ->  export from '${f.spec}'`);
    } else {
      console.log(`  ${f.barrel}  ->  ${f.file}`);
    }
  }
  console.log('');
}

if (fixMode) {
  console.log('🛠  --fix mode is not implemented; apply corrections manually.');
}

process.exit(findings.length > 0 ? 1 : 0);