import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PERL_INTERVIEW_COURSE_ID,
  PERL_INTERVIEW_COURSE_TITLE,
  PERL_INTERVIEW_IDEA_PATH,
} from './content-seed/perl-interview.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const overlayPath = process.argv[2];

if (!overlayPath) {
  console.error('Usage: node scripts/import-perl-interview-idea.mjs <overlay.json>');
  console.error('');
  console.error('Export overlay from browser console:');
  console.error("  copy(localStorage.getItem('lingua-code.user-content.v1'))");
  console.error('Paste into overlay.json, then run this script.');
  process.exit(1);
}

const overlay = JSON.parse(readFileSync(overlayPath, 'utf8'));
const authoring = findPerlInterviewAuthoring(overlay);

if (!authoring?.idea?.trim()) {
  console.error(`No authoring.idea found for «${PERL_INTERVIEW_COURSE_TITLE}» in ${overlayPath}`);
  process.exit(1);
}

writeFileSync(PERL_INTERVIEW_IDEA_PATH, `${authoring.idea.trim()}\n`);
console.log(`Wrote ${PERL_INTERVIEW_IDEA_PATH} (${authoring.idea.trim().length} chars)`);

execFileSync('node', ['scripts/export-content-seed.mjs'], {
  cwd: root,
  stdio: 'inherit',
});

console.log('Regenerated public/data seed with Course.authoring');

function findPerlInterviewAuthoring(overlay) {
  let best = null;
  let bestLength = 0;

  for (const [courseId, entry] of Object.entries(overlay.courses ?? {})) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const title = typeof entry.title === 'string' ? entry.title.trim() : '';
    const matchesTitle = title === PERL_INTERVIEW_COURSE_TITLE;
    const matchesSeedId = courseId === PERL_INTERVIEW_COURSE_ID;
    if (!matchesTitle && !matchesSeedId) {
      continue;
    }

    const authoring = entry.authoring;
    if (!authoring || typeof authoring !== 'object' || typeof authoring.idea !== 'string') {
      continue;
    }

    const length = authoring.idea.trim().length;
    if (length > bestLength) {
      best = authoring;
      bestLength = length;
    }
  }

  return best;
}
