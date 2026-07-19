/**
 * Скрипт для добавления полей courseId, lessonId, scenarioId
 * в карточки из public/data/cards/*.json на основе данных
 * из public/data/scenarios/*.json и public/data/courses/*.json.
 *
 * Запуск: node scripts/add-card-hierarchy-fields.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'public', 'data');

// ============================================================
// 1. Загружаем все сценарии
// ============================================================

function loadJSON(relativePath) {
  const fullPath = resolve(DATA_DIR, relativePath);
  return JSON.parse(readFileSync(fullPath, 'utf-8'));
}

const demoScenarios = loadJSON('scenarios/demo-scenarios.json').scenarios;
const perlInterviewScenarios = loadJSON('scenarios/perl-interview-scenarios.json').scenarios;
const perlDbScenarios = loadJSON('scenarios/perl-db-scenarios.json').scenarios;
const radicalsScenarios = loadJSON('scenarios/radicals-scenarios.json').scenarios;

const allScenarios = [
  ...demoScenarios,
  ...perlInterviewScenarios,
  ...perlDbScenarios,
  ...radicalsScenarios,
];

// ============================================================
// 2. Загружаем все курсы с уроками
// ============================================================

const demoCourses = loadJSON('courses/demo-courses.json').courses;
const perlInterviewCourse = loadJSON('courses/perl-interview-course.json').courses;
const perlDbCourse = loadJSON('courses/perl-db-course.json').courses;
const radicalsCourse = loadJSON('courses/radicals-214-course.json').courses;

const allCourses = [
  ...demoCourses,
  ...perlInterviewCourse,
  ...perlDbCourse,
  ...radicalsCourse,
];

// ============================================================
// 3. Строим маппинг: scenarioId -> { courseId, lessonId }
// ============================================================

// Сначала построим: lessonId -> { courseId, scenarioIds[] }
const lessonMap = {};
for (const course of allCourses) {
  for (const lesson of course.lessons ?? []) {
    lessonMap[lesson.id] = {
      courseId: lesson.courseId,
      scenarioIds: lesson.scenarioIds,
    };
  }
}

// Затем: scenarioId -> { courseId, lessonId }
const scenarioMap = {};
for (const [lessonId, lesson] of Object.entries(lessonMap)) {
  for (const scenarioId of lesson.scenarioIds) {
    scenarioMap[scenarioId] = {
      courseId: lesson.courseId,
      lessonId,
    };
  }
}

// Также добавим сценарии без курса (если есть)
for (const scenario of allScenarios) {
  if (!scenarioMap[scenario.id]) {
    scenarioMap[scenario.id] = {
      courseId: scenario.courseId,
      lessonId: undefined,
    };
  }
}

// ============================================================
// 4. Строим маппинг: cardId -> scenarioId (из cardSource)
// ============================================================

const cardToScenarioMap = {};
for (const scenario of allScenarios) {
  const cardSource = scenario.cardSource;
  if (!cardSource) continue;

  if (cardSource.mode === 'fixed' || cardSource.mode === 'snapshot') {
    for (const cardId of cardSource.cardIds ?? []) {
      cardToScenarioMap[cardId] = scenario.id;
    }
  }
  // Для 'criteria' режима не можем определить статически
}

// ============================================================
// 5. Обрабатываем каждый файл карточек
// ============================================================

function processCardFile(filename, getCardScenarioId) {
  const filePath = resolve(DATA_DIR, 'cards', filename);
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));

  let changed = 0;

  if (data.scenarioId) {
    // Файл с общим scenarioId на верхнем уровне (demo-cards.json)
    const scenarioId = data.scenarioId;
    const mapping = scenarioMap[scenarioId];

    for (const card of data.cards) {
      if (!card.courseId || !card.lessonId || !card.scenarioId) {
        card.courseId = mapping?.courseId;
        card.lessonId = mapping?.lessonId;
        card.scenarioId = scenarioId;
        changed++;
      }
    }
  } else {
    // Файл с карточками, где ID карточки определяет сценарий
    for (const card of data.cards) {
      const scenarioId = getCardScenarioId(card);
      if (!scenarioId) continue;

      const mapping = scenarioMap[scenarioId];

      if (!card.courseId || !card.lessonId || !card.scenarioId) {
        card.courseId = mapping?.courseId;
        card.lessonId = mapping?.lessonId;
        card.scenarioId = scenarioId;
        changed++;
      }
    }
  }

  if (changed > 0) {
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`  ${filename}: обновлено ${changed} карточек`);
  } else {
    console.log(`  ${filename}: изменений не требуется`);
  }
}

// demo-cards.json — имеет scenarioId на верхнем уровне
console.log('\nОбработка demo-cards.json...');
processCardFile('demo-cards.json');

// perl-interview-cards.json — ID карточек вида card-perl-sXX-qYY-...
console.log('\nОбработка perl-interview-cards.json...');
processCardFile('perl-interview-cards.json', (card) => {
  // card-perl-s01-q01-c1 -> scenario-perl-s01-q01
  const match = card.id.match(/^(card-perl-s\d+-q\d+)/);
  return match ? match[1] : null;
});

// perl-db-cards.json — ID карточек вида card-perl-db-sXX-qYY-...
console.log('\nОбработка perl-db-cards.json...');
processCardFile('perl-db-cards.json', (card) => {
  const match = card.id.match(/^(card-perl-db-s\d+-q\d+)/);
  return match ? match[1] : null;
});

// radicals-course-cards.json — ID карточек вида draw-radical-NNN
console.log('\nОбработка radicals-course-cards.json...');
processCardFile('radicals-course-cards.json', (card) => {
  // Нужно определить, к какому сценарию относится радикал.
  // Сценарии: scenario-radicals-01 (1-20), 02 (21-40), ..., 11 (201-214)
  const match = card.id.match(/^draw-radical-(\d+)/);
  if (!match) return null;

  const num = parseInt(match[1], 10);
  const scenarioIndex = Math.min(Math.floor((num - 1) / 20), 10); // 0-based
  const scenarioNum = String(scenarioIndex + 1).padStart(2, '0');
  return `scenario-radicals-${scenarioNum}`;
});

console.log('\nГотово!');
