#!/usr/bin/env node
/**
 * Checks every relative import in src/app/*.ts resolves to an existing file.
 * Usage: node scripts/check-imports.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, extname } from 'node:path';

const ROOT = resolve('src/app');
const problems = [];
let total = 0;

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

function checkFile(file) {
  const content = readFileSafe(file);
  if (!content) return;
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    const m = line.match(/(?:from\s+|import\s*\()\s*['"](\.[^'"]+)['"]/);
    if (!m) return;
    total++;
    const spec = m[1];
    const base = dirname(file);
    const target = resolve(base, spec);
    // Only accept real files: exact, +.ts, or dir with index.ts
    const isFile = (p) => existsSync(p) && statSync(p).isFile();
    const candidates = [
      target,
      target + '.ts',
      join(target, 'index.ts'),
    ];
    const ok = candidates.some(isFile);
    if (!ok) {
      problems.push(`${relative(ROOT, file)}:${idx + 1} -> '${spec}' (resolved to ${relative(ROOT, target)})`);
    }
  });
}

function readFileSafe(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

walk(ROOT);
if (problems.length) {
  console.log(`Found ${problems.length} broken relative imports (of ${total} checked):\n`);
  for (const p of problems) console.log('  ' + p);
  process.exit(1);
} else {
  console.log(`OK: all ${total} relative imports resolve.`);
}