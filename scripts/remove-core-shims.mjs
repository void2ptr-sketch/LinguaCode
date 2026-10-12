#!/usr/bin/env node
/**
 * Removes the core/ shim layer (final step of the FSD migration).
 *
 * 1. Relocates spec files that live inside core/ to the modules they test.
 * 2. Rewrites every import from 'core/...' to a direct import from the
 *    underlying module (entities/*, shared/*, widgets/*, app/*).
 * 3. Deletes src/app/core/.
 *
 * Usage: node scripts/remove-core-shims.mjs [--dry-run]
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = join(ROOT, 'src', 'app');
const CORE_DIR = join(APP_DIR, 'core');
const DRY_RUN = process.argv.includes('--dry-run');

// ── Spec files inside core/ that test real modules ───────────────────────────
const SPEC_MOVES = {
  'core/api/api-url.spec.ts': 'shared/api/api-url.spec.ts',
  'core/api/provide-api.http.spec.ts': 'app/api/provide-api.http.spec.ts',
  'core/layout/data/help-page.data.spec.ts': 'pages/help/help-page.data.spec.ts',
  'core/layout/data/help-usage-scenarios.data.spec.ts':
    'pages/help-usage-scenarios/help-usage-scenarios.data.spec.ts',
  'core/services/journey-analytics.service.spec.ts':
    'entities/journey/lib/journey-analytics.service.spec.ts',
  'core/state/user.store.spec.ts': 'entities/user/model/user.store.spec.ts',
  'core/state/user.persistence.spec.ts': 'entities/user/model/user.persistence.spec.ts',
  'core/state/learning-results.store.spec.ts':
    'entities/learning/model/learning-results.store.spec.ts',
  'core/state/learning-results.persistence.spec.ts':
    'entities/learning/model/learning-results.persistence.spec.ts',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const norm = (p) => p.replace(/\\/g, '/');

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function collectTsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

function resolveModule(fromDir, spec) {
  const base = resolve(fromDir, spec);
  const candidates = [base, `${base}.ts`, join(base, 'index.ts')];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

function parseSpecifiers(list) {
  const specs = [];
  for (const raw of list.split(',')) {
    let p = raw.trim();
    if (!p) continue;
    let isType = false;
    if (p.startsWith('type ')) {
      isType = true;
      p = p.slice(5).trim();
    }
    let name = p;
    let alias = p;
    const asMatch = p.match(/^(.+?)\s+as\s+(.+)$/);
    if (asMatch) {
      name = asMatch[1].trim();
      alias = asMatch[2].trim();
      if (alias.startsWith('type ')) {
        isType = true;
        alias = alias.slice(5).trim();
      }
    }
    specs.push({ name, alias, isType });
  }
  return specs;
}

/** Set of symbol names exported by a module (recursively through export *). */
function collectExports(moduleAbs, visited = new Set()) {
  if (visited.has(moduleAbs)) return new Set();
  visited.add(moduleAbs);
  const symbols = new Set();
  const content = readFileSync(moduleAbs, 'utf8');
  const dir = dirname(moduleAbs);

  for (const m of content.matchAll(
    /export\s+(?:declare\s+)?(?:const|let|var|function|class|enum|interface|type|abstract\s+class)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    symbols.add(m[1]);
  }
  for (const m of content.matchAll(
    /export\s+(?:type\s+)?\{([^}]*)\}(?:\s*from\s*['"]([^'"]+)['"])?/g,
  )) {
    for (const spec of parseSpecifiers(m[1])) symbols.add(spec.alias);
  }
  for (const m of content.matchAll(/export\s*\*\s*from\s*['"]([^'"]+)['"]/g)) {
    const target = resolveModule(dir, m[1]);
    if (target) for (const sym of collectExports(target, visited)) symbols.add(sym);
  }
  return symbols;
}

const isInsideCore = (abs) => norm(abs).startsWith(norm(CORE_DIR) + '/');

/** symbol -> targetAbs (first non-core module in the re-export chain). */
function buildCoreBarrelMap(barrelAbs, visited = new Set()) {
  if (visited.has(barrelAbs)) return new Map();
  visited.add(barrelAbs);
  const map = new Map();
  const content = readFileSync(barrelAbs, 'utf8');
  const dir = dirname(barrelAbs);

  for (const m of content.matchAll(/export\s*\*\s*from\s*['"]([^'"]+)['"]/g)) {
    const target = resolveModule(dir, m[1]);
    if (!target) fail(`broken export * in ${barrelAbs}: '${m[1]}'`);
    if (isInsideCore(target)) {
      const sub = buildCoreBarrelMap(target, visited);
      for (const [sym, src] of sub) if (!map.has(sym)) map.set(sym, src);
    } else {
      for (const sym of collectExports(target)) if (!map.has(sym)) map.set(sym, target);
    }
  }

  for (const m of content.matchAll(
    /export\s+(?:type\s+)?\{([^}]*)\}(?:\s*from\s*['"]([^'"]+)['"])?/g,
  )) {
    const specs = parseSpecifiers(m[1]);
    if (m[2] !== undefined) {
      const target = resolveModule(dir, m[2]);
      if (!target) fail(`broken export in ${barrelAbs}: '${m[2]}'`);
      if (isInsideCore(target)) {
        const sub = buildCoreBarrelMap(target, visited);
        for (const spec of specs) {
          const src = sub.get(spec.name) ?? target;
          if (!map.has(spec.alias)) map.set(spec.alias, src);
        }
      } else {
        for (const spec of specs) if (!map.has(spec.alias)) map.set(spec.alias, target);
      }
    } else {
      for (const spec of specs) if (!map.has(spec.alias)) map.set(spec.alias, barrelAbs);
    }
  }
  return map;
}

// ── Core barrel maps ─────────────────────────────────────────────────────────
const CORE_BARRELS = [
  'core',
  'core/models',
  'core/state',
  'core/repositories',
  'core/api',
  'core/domain',
  'core/services',
  'core/layout',
];
const coreMaps = new Map();
for (const rel of CORE_BARRELS) {
  const abs = join(APP_DIR, rel, 'index.ts');
  if (!existsSync(abs)) fail(`missing core barrel: ${rel}/index.ts`);
  coreMaps.set(rel, buildCoreBarrelMap(abs));
}

// ── Import rewriting ─────────────────────────────────────────────────────────
function emitRel(fromFile, targetAbs) {
  let rel = norm(relative(dirname(fromFile), targetAbs));
  if (rel.endsWith('/index.ts')) rel = rel.slice(0, -'/index.ts'.length);
  else if (rel.endsWith('.ts')) rel = rel.slice(0, -3);
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

/**
 * Rewrites imports in `content` (a file located at `fromFile`).
 * - core/ imports are resolved via coreMaps and split per target module.
 * - if rewriteAllRelative, every other relative import is re-emitted
 *   relative to `emitTo` (used when relocating spec files).
 */
function rewriteImports(content, fromFile, emitTo, rewriteAllRelative) {
  const re = /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
  let out = '';
  let last = 0;
  let changed = false;
  let m;
  while ((m = re.exec(content)) !== null) {
    const start = m.index;
    const end = m.index + m[0].length;
    const specList = m[1];
    const specifier = m[2];
    const isTypeOnly = m[0].startsWith('import type');

    // Package imports (e.g. '@angular/core') never need rewriting.
    if (!specifier.startsWith('.')) {
      out += content.slice(last, end);
      last = end;
      continue;
    }

    const abs = resolve(dirname(fromFile), specifier);
    const rel = norm(relative(APP_DIR, abs));
    const isCore = rel === 'core' || rel.startsWith('core/');

    if (!isCore && !rewriteAllRelative) {
      out += content.slice(last, end);
      last = end;
      continue;
    }

    const specs = parseSpecifiers(specList);
    let replacement;
    if (isCore) {
      const coreMap = coreMaps.get(rel);
      if (!coreMap) fail(`no core barrel map for '${rel}' (imported in ${fromFile})`);
      const groups = new Map();
      for (const spec of specs) {
        const target = coreMap.get(spec.name);
        if (!target) {
          fail(`cannot resolve '${spec.name}' from '${rel}' (imported in ${fromFile})`);
        }
        if (!groups.has(target)) groups.set(target, { value: [], type: [] });
        const g = groups.get(target);
        (spec.isType || isTypeOnly ? g.type : g.value).push(spec);
      }
      const parts = [];
      for (const [target, g] of groups) {
        const relPath = emitRel(emitTo, target);
        if (g.value.length === 0) {
          const names = g.type
            .map((s) => (s.alias === s.name ? s.name : `${s.name} as ${s.alias}`))
            .join(', ');
          parts.push(`import type { ${names} } from '${relPath}'`);
        } else {
          const list = [];
          for (const s of g.value) list.push(s.alias === s.name ? s.name : `${s.name} as ${s.alias}`);
          for (const s of g.type) {
            list.push(s.alias === s.name ? `type ${s.name}` : `type ${s.name} as ${s.alias}`);
          }
          parts.push(`import { ${list.join(', ')} } from '${relPath}'`);
        }
      }
      replacement = parts.join('\n');
    } else {
      // Non-core relative import in a relocated file: re-emit with new path.
      const relPath = emitRel(emitTo, abs);
      const list = specs
        .map((s) => {
          const base = s.alias === s.name ? s.name : `${s.name} as ${s.alias}`;
          return s.isType ? `type ${base}` : base;
        })
        .join(', ');
      replacement = isTypeOnly
        ? `import type { ${list} } from '${relPath}'`
        : `import { ${list} } from '${relPath}'`;
    }

    out += content.slice(last, start) + replacement;
    last = end;
    changed = true;
  }
  out += content.slice(last);
  return { content: out, changed };
}

// ── Main ─────────────────────────────────────────────────────────────────────
let moved = 0;
let rewritten = 0;

// 1. Relocate spec files (resolve imports against the OLD location, emit
//    paths relative to the NEW location).
for (const [oldRel, newRel] of Object.entries(SPEC_MOVES)) {
  const oldAbs = join(APP_DIR, oldRel);
  if (!existsSync(oldAbs)) {
    console.warn(`SKIP (missing): ${oldRel}`);
    continue;
  }
  const newAbs = join(APP_DIR, newRel);
  const content = readFileSync(oldAbs, 'utf8');
  const { content: newContent, changed } = rewriteImports(content, oldAbs, newAbs, true);
  if (DRY_RUN) {
    console.log(`[dry-run] move ${oldRel} -> ${newRel}${changed ? ' (imports rewritten)' : ''}`);
  } else {
    mkdirSync(dirname(newAbs), { recursive: true });
    writeFileSync(newAbs, newContent);
    rmSync(oldAbs);
    console.log(`Moved ${oldRel} -> ${newRel}${changed ? ' (imports rewritten)' : ''}`);
  }
  moved++;
  if (changed) rewritten++;
}

// 2. Rewrite core/ imports in every remaining file (excluding core/ itself).
for (const file of collectTsFiles(APP_DIR)) {
  if (isInsideCore(file)) continue;
  const content = readFileSync(file, 'utf8');
  const { content: newContent, changed } = rewriteImports(content, file, file, false);
  if (changed) {
    if (DRY_RUN) {
      console.log(`[dry-run] rewrite ${norm(relative(APP_DIR, file))}`);
    } else {
      writeFileSync(file, newContent);
      console.log(`Rewrote ${norm(relative(APP_DIR, file))}`);
    }
    rewritten++;
  }
}

// 3. Delete core/.
if (DRY_RUN) {
  console.log(`[dry-run] delete ${norm(relative(APP_DIR, CORE_DIR))}/`);
} else {
  rmSync(CORE_DIR, { recursive: true, force: true });
  console.log(`Deleted ${norm(relative(APP_DIR, CORE_DIR))}/`);
}

console.log(`\nDone: ${moved} spec(s) relocated, ${rewritten} file(s) rewritten.`);