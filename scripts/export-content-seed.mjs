import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEMO_SCENARIOS } from './content-seed/demo-scenarios.mjs';
import { DEMO_COURSES } from './content-seed/demo-courses.mjs';
import {
  buildPerlInterviewCards,
  buildPerlInterviewCardIndexMeta,
  buildPerlInterviewCourse,
  buildPerlInterviewScenarios,
} from './content-seed/perl-interview.mjs';
import {
  buildRadicalsCourse,
  buildRadicalsScenarios,
} from './content-seed/radicals-content.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'public/data');

const manifest = {
  version: 1,
  cardFiles: ['select-cards.json', 'radicals-course-cards.json', 'perl-interview-cards.json'],
  scenarioFiles: [
    '/scenarios/demo-scenarios.json',
    '/scenarios/radicals-scenarios.json',
    '/scenarios/perl-interview-scenarios.json',
  ],
  courseFiles: [
    '/courses/demo-courses.json',
    '/courses/radicals-214-course.json',
    '/courses/perl-interview-course.json',
  ],
};

function writeJson(relativePath, payload) {
  const fullPath = join(dataDir, relativePath.replace(/^\//, ''));
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, `${JSON.stringify(payload, null, 2)}\n`);
}

const perlScenarios = buildPerlInterviewScenarios();
const perlCourse = buildPerlInterviewCourse();

writeJson('content-manifest.json', manifest);
writeJson('scenarios/demo-scenarios.json', { scenarios: DEMO_SCENARIOS });
writeJson('scenarios/radicals-scenarios.json', { scenarios: buildRadicalsScenarios() });
writeJson('scenarios/perl-interview-scenarios.json', { scenarios: perlScenarios });
writeJson('courses/demo-courses.json', DEMO_COURSES);
writeJson('courses/radicals-214-course.json', buildRadicalsCourse());
writeJson('courses/perl-interview-course.json', perlCourse);
writeJson('perl-interview-cards.json', { cards: buildPerlInterviewCards() });

const cardIndexMetaPath = join(dataDir, 'card-index-meta.json');
const existingCardIndexMeta = JSON.parse(readFileSync(cardIndexMetaPath, 'utf8'));
const perlCardIndexMeta = buildPerlInterviewCardIndexMeta();
const metaWithoutStalePerlCards = Object.fromEntries(
  Object.entries(existingCardIndexMeta.metaById).filter(([id]) => !id.startsWith('card-perl-s')),
);
writeJson('card-index-meta.json', {
  metaById: {
    ...metaWithoutStalePerlCards,
    ...perlCardIndexMeta,
  },
});

console.log('Exported content seed:');
console.log(`  scenarios: ${DEMO_SCENARIOS.length} demo + ${buildRadicalsScenarios().length} radicals + ${perlScenarios.length} perl`);
console.log(
  `  courses: ${DEMO_COURSES.courses.length} demo + ${buildRadicalsCourse().courses.length} radicals + ${perlCourse.courses.length} perl`,
);
console.log(`  manifest: public/data/content-manifest.json`);
