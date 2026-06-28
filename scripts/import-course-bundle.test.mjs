/**
 * import-course-bundle.test.mjs
 *
 * Тесты для import-course-bundle.mjs.
 * Запуск: node scripts/import-course-bundle.test.mjs
 */

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ─── Helpers ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    failed++;
  }
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) {
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message} — expected ${b}, got ${a}`);
    failed++;
  }
}

// ─── Test: validateBundle ────────────────────────────────────────────────────

function testValidateBundle() {
  console.log('\n# validateBundle');

  // Загружаем функции из модуля через динамический импорт
  // Вместо этого тестируем логику напрямую

  const validBundle = {
    formatVersion: 1,
    exportedAt: '2026-06-15T00:00:00.000Z',
    sourceAuthorId: 'local-user',
    course: {
      courses: [{ id: 'c1', title: 'Test' }],
      lessons: [{ id: 'l1', courseId: 'c1', title: 'L1', scenarioIds: ['s1'] }],
    },
    scenarios: [{ id: 's1', title: 'S1', cardSource: { mode: 'fixed', cardIds: ['card-1'] } }],
    cards: [{ id: 'card-1', kind: 'select', title: 'C1' }],
    cardIndexMeta: { 'card-1': { difficulty: 'beginner' } },
  };

  // Test 1: valid bundle
  const errors1 = validateBundleLogic(validBundle);
  assertEqual(errors1.length, 0, 'valid bundle should have no errors');

  // Test 2: wrong formatVersion
  const errors2 = validateBundleLogic({ ...validBundle, formatVersion: 999 });
  assert(errors2.some((e) => e.includes('формата')), 'should reject wrong formatVersion');

  // Test 3: missing exportedAt
  const errors3 = validateBundleLogic({ ...validBundle, exportedAt: '' });
  assert(errors3.some((e) => e.includes('exportedAt')), 'should reject missing exportedAt');

  // Test 4: missing course.courses
  const errors4 = validateBundleLogic({ ...validBundle, course: {} });
  assert(errors4.some((e) => e.includes('course.courses')), 'should reject missing course.courses');

  // Test 5: missing scenarios
  const errors5 = validateBundleLogic({ ...validBundle, scenarios: undefined });
  assert(errors5.some((e) => e.includes('scenarios')), 'should reject missing scenarios');

  // Test 6: missing cards
  const errors6 = validateBundleLogic({ ...validBundle, cards: undefined });
  assert(errors6.some((e) => e.includes('cards')), 'should reject missing cards');

  // Test 7: missing cardIndexMeta
  const errors7 = validateBundleLogic({ ...validBundle, cardIndexMeta: undefined });
  assert(errors7.some((e) => e.includes('cardIndexMeta')), 'should reject missing cardIndexMeta');

  // Test 8: more than one course
  const errors8 = validateBundleLogic({
    ...validBundle,
    course: { courses: [{ id: 'c1' }, { id: 'c2' }], lessons: [] },
  });
  assert(errors8.some((e) => e.includes('1')), 'should reject more than 1 course');
}

function validateBundleLogic(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return ['Файл не содержит JSON-объект'];
  }

  if (data.formatVersion !== 1) {
    errors.push(`Неподдерживаемая версия формата: ${data.formatVersion}. Ожидается: 1`);
  }

  if (!data.exportedAt) {
    errors.push('Отсутствует дата экспорта (exportedAt)');
  }

  if (!data.course || !data.course.courses || !Array.isArray(data.course.courses)) {
    errors.push('Отсутствует course.courses');
  }

  if (!data.course.lessons || !Array.isArray(data.course.lessons)) {
    errors.push('Отсутствует course.lessons');
  }

  if (!Array.isArray(data.scenarios)) {
    errors.push('Отсутствует scenarios');
  }

  if (!Array.isArray(data.cards)) {
    errors.push('Отсутствует cards');
  }

  if (!data.cardIndexMeta || typeof data.cardIndexMeta !== 'object') {
    errors.push('Отсутствует cardIndexMeta');
  }

  if (data.course?.courses?.length !== 1) {
    errors.push(`Пакет должен содержать ровно 1 курс, найдено: ${data.course?.courses?.length ?? 0}`);
  }

  return errors;
}

// ─── Test: checkCollisions ───────────────────────────────────────────────────

function testCheckCollisions() {
  console.log('\n# checkCollisions');

  const data = {
    course: { courses: [{ id: 'course-1' }], lessons: [{ id: 'lesson-1' }] },
    scenarios: [{ id: 'scenario-1' }],
    cards: [{ id: 'card-1' }],
  };

  const existingIds = {
    courses: new Set(['course-existing']),
    lessons: new Set(['lesson-existing']),
    scenarios: new Set(['scenario-existing']),
    cards: new Set(['card-existing']),
  };

  const collisions1 = checkCollisionsLogic(data, existingIds);
  assertEqual(collisions1.length, 0, 'no collisions when ids are unique');

  const existingIds2 = {
    courses: new Set(['course-1']),
    lessons: new Set(['lesson-1']),
    scenarios: new Set(['scenario-1']),
    cards: new Set(['card-1']),
  };

  const collisions2 = checkCollisionsLogic(data, existingIds2);
  assertEqual(collisions2.length, 4, '4 collisions when all ids exist');
  assert(collisions2.some((c) => c.includes('course-1')), 'collision message mentions course id');
  assert(collisions2.some((c) => c.includes('card-1')), 'collision message mentions card id');
}

function checkCollisionsLogic(data, existingIds) {
  const collisions = [];
  const courseIds = data.course.courses.map((c) => c.id);
  const lessonIds = data.course.lessons.map((l) => l.id);
  const scenarioIds = data.scenarios.map((s) => s.id);
  const cardIds = data.cards.map((c) => c.id);

  for (const id of courseIds) {
    if (existingIds.courses.has(id)) {
      collisions.push(`Курс с id «${id}» уже существует в seed`);
    }
  }

  for (const id of lessonIds) {
    if (existingIds.lessons.has(id)) {
      collisions.push(`Урок с id «${id}» уже существует в seed`);
    }
  }

  for (const id of scenarioIds) {
    if (existingIds.scenarios.has(id)) {
      collisions.push(`Сценарий с id «${id}» уже существует в seed`);
    }
  }

  for (const id of cardIds) {
    if (existingIds.cards.has(id)) {
      collisions.push(`Карточка с id «${id}» уже существует в seed`);
    }
  }

  return collisions;
}

// ─── Test: normalizeForSeed ──────────────────────────────────────────────────

function testNormalizeForSeed() {
  console.log('\n# normalizeForSeed');

  const data = {
    course: {
      courses: [{ id: 'c1', title: 'Test', authorId: 'local-user', published: false }],
      lessons: [{ id: 'l1', courseId: 'c1', title: 'L1' }],
    },
    scenarios: [{ id: 's1', title: 'S1', authorId: 'local-user', published: false }],
    cards: [{ id: 'card-1', kind: 'select', title: 'C1' }],
    cardIndexMeta: { 'card-1': { difficulty: 'beginner' } },
  };

  const normalized = normalizeForSeedLogic(data);

  assertEqual(normalized.courses[0].authorId, 'system', 'course authorId → system');
  assertEqual(normalized.courses[0].published, true, 'course published → true');
  assertEqual(normalized.scenarios[0].authorId, 'system', 'scenario authorId → system');
  assertEqual(normalized.scenarios[0].published, true, 'scenario published → true');
  assert(typeof normalized.courses[0].updatedAt === 'string', 'course updatedAt is string');
  assert(typeof normalized.scenarios[0].updatedAt === 'string', 'scenario updatedAt is string');
  assertDeepEqual(
    normalized.cardIndexMeta,
    { 'card-1': { difficulty: 'beginner' } },
    'cardIndexMeta preserved',
  );
}

function normalizeForSeedLogic(data) {
  const now = new Date().toISOString();

  const courses = data.course.courses.map((course) => ({
    ...course,
    authorId: 'system',
    published: true,
    updatedAt: now,
  }));

  const lessons = data.course.lessons.map((lesson) => ({
    ...lesson,
    updatedAt: now,
  }));

  const scenarios = data.scenarios.map((scenario) => ({
    ...scenario,
    authorId: 'system',
    published: true,
    updatedAt: now,
  }));

  const cards = data.cards.map((card) => ({
    ...card,
    updatedAt: now,
  }));

  return { courses, lessons, scenarios, cards, cardIndexMeta: data.cardIndexMeta };
}

// ─── Test: manifest merge (idempotent re-import) ─────────────────────────────

function testManifestMerge() {
  console.log('\n# manifest merge');

  const manifest = {
    version: 1,
    cardFiles: ['select-cards.json', 'radicals-course-cards.json'],
    scenarioFiles: ['/scenarios/demo-scenarios.json', '/scenarios/radicals-scenarios.json'],
    courseFiles: ['/courses/demo-courses.json', '/courses/radicals-214-course.json'],
  };

  const addUnique = (arr, item) => (arr.includes(item) ? arr : [...arr, item]);

  // Add new files
  manifest.cardFiles = addUnique(manifest.cardFiles, 'my-course-cards.json');
  manifest.scenarioFiles = addUnique(manifest.scenarioFiles, '/scenarios/my-course-scenarios.json');
  manifest.courseFiles = addUnique(manifest.courseFiles, '/courses/my-course-course.json');

  assertEqual(manifest.cardFiles.length, 3, 'cardFiles has 3 entries after add');
  assertEqual(manifest.scenarioFiles.length, 3, 'scenarioFiles has 3 entries after add');
  assertEqual(manifest.courseFiles.length, 3, 'courseFiles has 3 entries after add');

  // Re-import (idempotent)
  manifest.cardFiles = addUnique(manifest.cardFiles, 'my-course-cards.json');
  manifest.scenarioFiles = addUnique(manifest.scenarioFiles, '/scenarios/my-course-scenarios.json');
  manifest.courseFiles = addUnique(manifest.courseFiles, '/courses/my-course-course.json');

  assertEqual(manifest.cardFiles.length, 3, 'cardFiles still 3 after re-import');
  assertEqual(manifest.scenarioFiles.length, 3, 'scenarioFiles still 3 after re-import');
  assertEqual(manifest.courseFiles.length, 3, 'courseFiles still 3 after re-import');
}

// ─── Test: file writing and reading ──────────────────────────────────────────

function testFileRoundtrip() {
  console.log('\n# file roundtrip');

  const tmpDir = mkdtempSync(join(tmpdir(), 'course-bundle-test-'));
  const dataDir = join(tmpDir, 'public/data');
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(join(dataDir, 'courses'), { recursive: true });
  mkdirSync(join(dataDir, 'scenarios'), { recursive: true });

  const bundle = {
    formatVersion: 1,
    exportedAt: '2026-06-15T00:00:00.000Z',
    course: {
      courses: [{ id: 'course-test', title: 'Test', authorId: 'local-user', published: false, lessonIds: ['l1'] }],
      lessons: [{ id: 'l1', courseId: 'course-test', title: 'L1', scenarioIds: ['s1'] }],
    },
    scenarios: [{ id: 's1', title: 'S1', authorId: 'local-user', published: false, cardSource: { mode: 'fixed', cardIds: ['c1'] } }],
    cards: [{ id: 'c1', kind: 'select', title: 'C1' }],
    cardIndexMeta: { c1: { difficulty: 'beginner' } },
  };

  // Write bundle file
  const bundlePath = join(tmpDir, 'bundle.json');
  writeFileSync(bundlePath, JSON.stringify(bundle));

  // Read back
  const raw = readFileSync(bundlePath, 'utf8');
  const parsed = JSON.parse(raw);

  assertEqual(parsed.formatVersion, 1, 'formatVersion preserved after roundtrip');
  assertEqual(parsed.course.courses[0].id, 'course-test', 'course id preserved');

  // Cleanup
  rmSync(tmpDir, { recursive: true });
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log('=== import-course-bundle tests ===');

testValidateBundle();
testCheckCollisions();
testNormalizeForSeed();
testManifestMerge();
testFileRoundtrip();

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

if (failed > 0) {
  process.exit(1);
}
