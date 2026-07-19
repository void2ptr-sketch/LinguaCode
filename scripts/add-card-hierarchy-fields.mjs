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
// 2. Загружаем все курсы и уроки
// ============================================================

const demoCourseFile = loadJSON('courses/demo-courses.json');
const perlInterviewCourseFile = loadJSON('courses/perl-interview-course.json');
const perlDbCourseFile = loadJSON('courses/perl-db-course.json');
const radicalsCourseFile = loadJSON('courses/radicals-214-course.json');

const allCourses = [
  ...demoCourseFile.courses,
  ...perlInterviewCourseFile.courses,
  ...perlDbCourseFile.courses,
  ...radicalsCourseFile.courses,
];

// Уроки лежат на верхнем уровне файла курса (не внутри course.lessons)
const allLessons = [
  ...(demoCourseFile.lessons ?? []),
  ...(perlInterviewCourseFile.lessons ?? []),
  ...(perlDbCourseFile.lessons ?? []),
  ...(radicalsCourseFile.lessons ?? []),
];

// ============================================================
// 3. Строим маппинг: scenarioId -> { courseId, lessonId }
// ============================================================

// Сначала построим: lessonId -> { courseId, scenarioIds[] }
const lessonMap = {};
for (const lesson of allLessons) {
  lessonMap[lesson.id] = {
    courseId: lesson.courseId,
    scenarioIds: lesson.scenarioIds,
  };
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

  for (let i = 0; i < data.cards.length; i++) {
    const card = data.cards[i];

    // Определяем scenarioId для карточки:
    // 1. Из cardToScenarioMap (по cardSource.cardIds в сценариях)
    // 2. Из getCardScenarioId(card), если передан
    // 3. Из data.scenarioId (верхний уровень файла) как fallback
    let scenarioId = cardToScenarioMap[card.id];

    if (!scenarioId && getCardScenarioId) {
      scenarioId = getCardScenarioId(card);
    }

    if (!scenarioId && data.scenarioId) {
      scenarioId = data.scenarioId;
    }

    if (!scenarioId) continue;

    const mapping = scenarioMap[scenarioId];

    if (!card.courseId || !card.lessonId || !card.scenarioId) {
      // Создаём новый объект с полями в правильном порядке:
      // id, kind, title, courseId, lessonId, scenarioId, ...остальные поля
      const ordered = {};
      for (const key of Object.keys(card)) {
        ordered[key] = card[key];
        if (key === 'title') {
          ordered.courseId = mapping?.courseId;
          ordered.lessonId = mapping?.lessonId;
          ordered.scenarioId = scenarioId;
        }
      }
      data.cards[i] = ordered;
      changed++;
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
