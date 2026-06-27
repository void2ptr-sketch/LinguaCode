import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEMO_SCENARIOS } from './content-seed/demo-scenarios.mjs';
import { DEMO_COURSES } from './content-seed/demo-courses.mjs';
import {
  buildRadicalsCourse,
  buildRadicalsScenarios,
} from './content-seed/radicals-content.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'public/data');

const manifest = {
  version: 1,
  cardFiles: ['select-cards.json', 'radicals-course-cards.json'],
  scenarioFiles: ['/scenarios/demo-scenarios.json', '/scenarios/radicals-scenarios.json'],
  courseFiles: ['/courses/demo-courses.json', '/courses/radicals-214-course.json'],
};

function writeJson(relativePath, payload) {
  const fullPath = join(dataDir, relativePath.replace(/^\//, ''));
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, `${JSON.stringify(payload, null, 2)}\n`);
}

writeJson('content-manifest.json', manifest);
writeJson('scenarios/demo-scenarios.json', { scenarios: DEMO_SCENARIOS });
writeJson('scenarios/radicals-scenarios.json', { scenarios: buildRadicalsScenarios() });
writeJson('courses/demo-courses.json', DEMO_COURSES);
writeJson('courses/radicals-214-course.json', buildRadicalsCourse());

console.log('Exported content seed:');
console.log(`  scenarios: ${DEMO_SCENARIOS.length} demo + ${buildRadicalsScenarios().length} radicals`);
console.log(
  `  courses: ${DEMO_COURSES.courses.length} demo + ${buildRadicalsCourse().courses.length} radicals`,
);
console.log(`  manifest: public/data/content-manifest.json`);
