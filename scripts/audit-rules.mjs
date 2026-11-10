#!/usr/bin/env node
/**
 * Audit script for .continue/rules/ — checks lastReviewed dates against
 * reviewInterval and warns about overdue rules.
 *
 * Checks:
 *  1. Every *.rule.md and CONTINUE.md must have lastReviewed + reviewInterval
 *     in YAML front-matter.
 *  2. If (lastReviewed + reviewInterval) < today → violation.
 *
 * Usage: node scripts/audit-rules.mjs
 * Exit code 0 = clean, 1 = violations found.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const RULES_DIR = resolve('.continue/rules');
const today = new Date();
today.setHours(0, 0, 0, 0);

const violations = [];
let checked = 0;

// ── helpers ────────────────────────────────────────────────────────────────

/** Parse YAML front-matter (--- ... ---) and return key-value map. */
function parseFrontMatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const result = {};
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(\w[\w-]*):\s*(.+)$/);
      if (!kv) continue;
      // Strip inline YAML comments (e.g. "90d   # the period ...")
      let val = kv[2].trim();
      const comment = val.match(/^(\S+)(?:\s+#.*)?$/);
      if (comment) val = comment[1];
      result[kv[1].trim()] = val;
    }
  return result;
}

/** Parse "90d" → 90 (days). Returns null on failure. */
function parseInterval(raw) {
  if (!raw) return null;
  const m = String(raw).match(/^(\d+)\s*d$/i);
  return m ? Number(m[1]) : null;
}

/** Parse "2026-10-18" → Date (UTC). Returns null on failure. */
function parseDate(raw) {
  if (!raw) return null;
  const [y, m, d] = String(raw).split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

// ── walk ───────────────────────────────────────────────────────────────────

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (entry === 'CONTINUE.md' || entry.endsWith('.rule.md')) {
      checkRule(full);
    }
  }
}

function checkRule(file) {
  const content = readFileSync(file, 'utf8');
  const fm = parseFrontMatter(content);
  const rel = relative(RULES_DIR, file);

  if (!fm) {
    violations.push(`NO FRONTMATTER: ${rel}`);
    checked++;
    return;
  }

  const lastReviewed = parseDate(fm.lastReviewed);
  const intervalDays = parseInterval(fm.reviewInterval);

  if (!lastReviewed || !intervalDays) {
    violations.push(
      `MISSING FIELDS: ${rel} (lastReviewed=${fm.lastReviewed ?? '—'}, reviewInterval=${fm.reviewInterval ?? '—'})`,
    );
    checked++;
    return;
  }

  const nextReview = new Date(lastReviewed);
  nextReview.setUTCDate(nextReview.getUTCDate() + intervalDays);

  if (today >= nextReview) {
    const diff = Math.floor((today - nextReview) / 86_400_000);
    violations.push(
      `OVERDUE: ${rel} — lastReviewed=${fm.lastReviewed}, interval=${fm.reviewInterval}, due=${nextReview.toISOString().slice(0, 10)}, ${diff}d overdue`,
    );
  }

  checked++;
}

// ── main ───────────────────────────────────────────────────────────────────

if (!statSync(RULES_DIR).isDirectory()) {
  console.error(`Rules directory not found: ${RULES_DIR}`);
  process.exit(2);
}

walk(RULES_DIR);

if (violations.length === 0) {
  console.log(`✅ Rules audit OK: ${checked} rules checked, all within review interval.`);
  process.exit(0);
}

console.log(`🔍 Rules audit: ${violations.length} issue(s) found (${checked} rules checked):\n`);
for (const v of violations) console.log('  ' + v);
console.log();

process.exit(1);
