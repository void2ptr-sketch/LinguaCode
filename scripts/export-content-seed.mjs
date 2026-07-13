import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEMO_SCENARIOS } from './content-seed/demo-scenarios.mjs';
import { DEMO_COURSES } from './content-seed/demo-courses.mjs';
import {
  buildPerlInterviewCards,
  buildPerlInterviewCourse,
  buildPerlInterviewScenarios,
} from './content-seed/perl-interview.mjs';
import {
  buildRadicalsCourse,
  buildRadicalsScenarios,
} from './content-seed/radicals-content.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'public/data');

// ─── Загрузка существующего manifest (сохраняет imported-записи) ──────────────

function loadExistingManifest() {
  const manifestPath = join(dataDir, 'content-manifest.json');
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

// ─── Определяем, какие файлы сгенерированы скриптами (не imported) ────────────

const GENERATED_CARD_FILES = new Set([
  'select-cards.json',
  'radicals-course-cards.json',
  'perl-interview-cards.json',
]);

const GENERATED_SCENARIO_FILES = new Set([
  '/scenarios/demo-scenarios.json',
  '/scenarios/radicals-scenarios.json',
  '/scenarios/perl-interview-scenarios.json',
]);

const GENERATED_COURSE_FILES = new Set([
  '/courses/demo-courses.json',
  '/courses/radicals-214-course.json',
  '/courses/perl-interview-course.json',
]);

// ─── Сборка manifest с сохранением imported-записей ───────────────────────────

function buildManifest() {
  const existing = loadExistingManifest();

  const cardFiles = [...GENERATED_CARD_FILES];
  const scenarioFiles = [...GENERATED_SCENARIO_FILES];
  const courseFiles = [...GENERATED_COURSE_FILES];

  if (existing) {
    // Сохраняем imported-записи (те, что не входят в GENERATED_*)
    for (const file of existing.cardFiles) {
      if (!GENERATED_CARD_FILES.has(file) && !cardFiles.includes(file)) {
        cardFiles.push(file);
      }
    }
    for (const file of existing.scenarioFiles) {
      if (!GENERATED_SCENARIO_FILES.has(file) && !scenarioFiles.includes(file)) {
        scenarioFiles.push(file);
      }
    }
    for (const file of existing.courseFiles) {
      if (!GENERATED_COURSE_FILES.has(file) && !courseFiles.includes(file)) {
        courseFiles.push(file);
      }
    }
  }

  return { version: 1, cardFiles, scenarioFiles, courseFiles };
}

function writeJson(relativePath, payload) {
  const fullPath = join(dataDir, relativePath.replace(/^\//, ''));
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, `${JSON.stringify(payload, null, 2)}\n`);
}

const perlScenarios = buildPerlInterviewScenarios();
const perlCourse = buildPerlInterviewCourse();

writeJson('content-manifest.json', buildManifest());
writeJson('scenarios/demo-scenarios.json', { scenarios: DEMO_SCENARIOS });
writeJson('scenarios/radicals-scenarios.json', { scenarios: buildRadicalsScenarios() });
writeJson('scenarios/perl-interview-scenarios.json', { scenarios: perlScenarios });
writeJson('courses/demo-courses.json', DEMO_COURSES);
writeJson('courses/radicals-214-course.json', buildRadicalsCourse());
writeJson('courses/perl-interview-course.json', perlCourse);
writeJson('perl-interview-cards.json', { cards: buildPerlInterviewCards() });

// Метаданные теперь хранятся в карточках (card.meta), отдельный файл card-index-meta.json удалён.
// При экспорте seed метаданные автоматически попадают в карточки.

console.log('Exported content seed:');
console.log(`  scenarios: ${DEMO_SCENARIOS.length} demo + ${buildRadicalsScenarios().length} radicals + ${perlScenarios.length} perl`);
console.log(
  `  courses: ${DEMO_COURSES.courses.length} demo + ${buildRadicalsCourse().courses.length} radicals + ${perlCourse.courses.length} perl`,
);
console.log(`  manifest: public/data/content-manifest.json`);
