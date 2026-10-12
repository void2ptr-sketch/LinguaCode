#!/usr/bin/env node
/**
 * FSD layer-compliance codemod.
 *
 * Moves widget slices that are consumed by `features/` (or that depend on
 * entity domain types) to their correct FSD layers, then rewrites every
 * relative import in `src/app` so the tree stays consistent.
 *
 * Rationale (FSD layer direction, strictly downward):
 *   app -> pages -> widgets -> features -> entities -> shared
 *
 *   - widgets/code-highlight depends on entities/card/model types and is
 *     used by features/card-editor -> belongs to entities/card/ui.
 *   - widgets/card-editor-discard-dialog is domain-agnostic and used by two
 *     features -> belongs to shared/ui.
 *   - widgets/chinese, widgets/cards, widgets/card-host,
 *     widgets/card-focus-shell, widgets/card-catalog render entity domain
 *     UI and are consumed by features -> belong to entities/ui segments.
 *   - widgets/course-picker, widgets/lesson-picker, widgets/scenario-picker,
 *     widgets/course-display-settings-matrix are entity-specific pickers
 *     consumed by features -> belong to entities/ui segments.
 *   - features smoke specs boot the whole app -> belong to app/.
 *
 * Usage: node scripts/fsd-move-codemod.mjs
 */
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  existsSync,
  mkdirSync,
  renameSync,
} from 'node:fs';
import { join, dirname, resolve, relative, sep, basename } from 'node:path';

const ROOT = resolve('src/app');

// Old relative path (from src/app) -> new relative path (from src/app).
const MOVES = [
  { from: 'widgets/code-highlight', to: 'entities/card/ui/code-highlight' },
  { from: 'widgets/card-editor-discard-dialog', to: 'shared/ui/card-editor-discard-dialog' },
  { from: 'widgets/chinese', to: 'entities/chinese/ui' },
  { from: 'widgets/cards', to: 'entities/card/ui/cards' },
  { from: 'widgets/card-focus-shell', to: 'entities/card/ui/card-focus-shell' },
  { from: 'widgets/card-host', to: 'entities/card/ui/card-host' },
  { from: 'widgets/card-catalog', to: 'entities/card/ui/card-catalog' },
  { from: 'widgets/course-picker', to: 'entities/course/ui/course-picker' },
  { from: 'widgets/lesson-picker', to: 'entities/lesson/ui/lesson-picker' },
  { from: 'widgets/scenario-picker', to: 'entities/scenario/ui/scenario-picker' },
  {
    from: 'widgets/course-display-settings-matrix',
    to: 'entities/course/ui/course-display-settings-matrix',
  },
  { from: 'features/card-select/card-select.smoke.spec.ts', to: 'app/card-select.smoke.spec.ts' },
  { from: 'features/home/home-learning.smoke.spec.ts', to: 'app/home-learning.smoke.spec.ts' },
];

/** Maps an absolute path under src/app through the move table. */
function mapPath(abs) {
  for (const m of MOVES) {
    const fromAbs = join(ROOT, m.from);
    if (abs === fromAbs || abs.startsWith(fromAbs + sep)) {
      return join(ROOT, m.to, relative(fromAbs, abs));
    }
  }
  return abs;
}

/**
 * Resolves a relative import spec to a concrete file (or dir) path.
 * `hadExtension` tells whether the original spec already carried a file
 * extension (e.g. './foo.ts') — used to preserve the original spec style.
 */
function resolveTarget(baseDir, spec) {
  const t = resolve(baseDir, spec);
  if (existsSync(t) && statSync(t).isFile()) return { path: t, hadExtension: true };
  if (existsSync(t + '.ts')) return { path: t + '.ts', hadExtension: false };
  if (existsSync(join(t, 'index.ts'))) return { path: join(t, 'index.ts'), hadExtension: false };
  return { path: t, hadExtension: /\.[a-z0-9]+$/i.test(spec) };
}

const IMPORT_RE = /(?:from\s+|import\s*\()\s*['"](\.[^'"]+)['"]/g;

function rewriteFile(oldFile) {
  const newFile = mapPath(oldFile);
  const content = readFileSync(oldFile, 'utf8');
  let changed = 0;

  const newContent = content.replace(IMPORT_RE, (match, spec) => {
    const { path: oldTarget, hadExtension } = resolveTarget(dirname(oldFile), spec);
    const newTarget = mapPath(oldTarget);
    // If the target is a barrel (index.ts), point at the directory instead.
    const newTargetDir = basename(newTarget) === 'index.ts' ? dirname(newTarget) : newTarget;

    let newRel = relative(dirname(newFile), newTargetDir).split(sep).join('/');
    if (!newRel.startsWith('.')) newRel = './' + newRel;

    // Preserve the original spec style: no extension if the original had none.
    if (!hadExtension) {
      newRel = newRel.replace(/\.[a-z0-9]+$/i, '');
    }

    if (newRel === spec) return match;
    changed++;
    return match.replace(spec, newRel);
  });

  if (changed > 0) {
    writeFileSync(oldFile, newContent);
    console.log(`  rewrote ${changed} import(s) in ${relative(ROOT, oldFile)}`);
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (entry.endsWith('.ts')) {
      rewriteFile(full);
    }
  }
}

console.log('FSD move codemod: rewriting relative imports...');
walk(ROOT);

console.log('FSD move codemod: moving directories...');
for (const m of MOVES) {
  const fromAbs = join(ROOT, m.from);
  const toAbs = join(ROOT, m.to);
  if (!existsSync(fromAbs)) {
    console.log(`  SKIP (missing): ${m.from}`);
    continue;
  }
  mkdirSync(dirname(toAbs), { recursive: true });
  renameSync(fromAbs, toAbs);
  console.log(`  moved ${m.from} -> ${m.to}`);
}

console.log('FSD move codemod: done.');
