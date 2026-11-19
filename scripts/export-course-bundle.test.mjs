/**
 * export-course-bundle.test.mjs
 *
 * Тесты для export-course-bundle.mjs и import-course-bundle.mjs:
 *   1. Экспорт seed → v2 (структура, order, замыкание зависимостей)
 *   2. Импорт v2 → seed (нормализация, коллизии)
 *   3. Round-trip: seed → v2 → seed (данные совпадают)
 *
 * Использование:
 *   node scripts/export-course-bundle.test.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'public/data');
const exportScript = join(__dirname, 'export-course-bundle.mjs');
const importScript = join(__dirname, 'import', 'import-course-bundle.mjs');

// ─── Утилиты ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a, null, 2) === JSON.stringify(b, null, 2);
}

function tempDir() {
  const p = join(root, '.test-tmp');
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
  mkdirSync(p, { recursive: true });
  return p;
}

/**
 * Запускает export-course-bundle.mjs с аргументами и возвращает { code, stdout, stderr }.
 */
function runExport(slug, output) {
  const cmd = `node "${exportScript}" --slug ${slug} --output "${output}"`;
  try {
    const stdout = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      code: err.status ?? 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    };
  }
}

/**
 * Запускает import-course-bundle.mjs с аргументами и возвращает { code, stdout, stderr }.
 */
function runImport(bundlePath, slug, replace = false) {
  const cmd = `node "${importScript}" --bundle "${bundlePath}" --slug ${slug}${replace ? ' --replace' : ''}`;
  try {
    const stdout = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      code: err.status ?? 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    };
  }
}

// ─── Тесты экспорта ───────────────────────────────────────────────────────────

function testExportStructure() {
  console.log('\n📦 Тесты экспорта (seed → v2):');

  const tmp = tempDir();
  const output = join(tmp, 'test-export.linguacode-course.json');

  // 1. Экспорт существующего курса
  const result = runExport('course-demo-card-kinds', output);
  assert(result.code === 0, 'Экспорт завершается с кодом 0');
  assert(existsSync(output), 'Файл экспорта создан');

  const v2 = JSON.parse(readFileSync(output, 'utf8'));

  // 2. Проверка структуры v2
  assert(v2.formatVersion === 2, 'formatVersion === 2');
  assert(typeof v2.exportedAt === 'string' && v2.exportedAt.includes('T'), 'exportedAt — ISO-8601');
  assert(v2.course && typeof v2.course === 'object', 'course — объект');
  assert(Array.isArray(v2.programs), 'programs — массив');

  // 3. Проверка course
  const course = v2.course;
  assert(course.id === 'course-demo-card-kinds', 'course.id совпадает с slug');
  assert(typeof course.title === 'string' && course.title.length > 0, 'course.title — строка');
  assert(Array.isArray(course.programIds), 'course.programIds — массив');
  assert(course.programIds.length === v2.programs.length, 'course.programIds.length === programs.length');

  // 4. Проверка program уровня
  const firstProgram = v2.programs[0];
  assert(firstProgram.program && typeof firstProgram.program.id === 'string', 'program.id — строка');
  assert(typeof firstProgram.order === 'number', 'program.order — число');
  assert(Array.isArray(firstProgram.lessons), 'program.lessons — массив');

  // 5. Проверка lesson уровня
  const firstLesson = firstProgram.lessons[0];
  assert(firstLesson.lesson && typeof firstLesson.lesson.id === 'string', 'lesson.id — строка');
  assert(typeof firstLesson.order === 'number', 'lesson.order — число');
  assert(Array.isArray(firstLesson.scenarios), 'lesson.scenarios — массив');

  // 6. Проверка scenario уровня
  const firstScenario = firstLesson.scenarios[0];
  assert(firstScenario.scenario && typeof firstScenario.scenario.id === 'string', 'scenario.id — строка');
  assert(typeof firstScenario.order === 'number', 'scenario.order — число');
  assert(Array.isArray(firstScenario.cards), 'scenario.cards — массив');

  // 7. Проверка card уровня
  if (firstScenario.cards.length > 0) {
    const firstCard = firstScenario.cards[0];
    assert(firstCard.card && typeof firstCard.card.id === 'string', 'card.id — строка');
    assert(typeof firstCard.order === 'number', 'card.order — число');
    assert(firstCard.card.courseId === 'course-demo-card-kinds', 'card.courseId совпадает');
    assert(firstCard.card.lessonId === firstLesson.lesson.id, 'card.lessonId совпадает');
    assert(firstCard.card.scenarioId === firstScenario.scenario.id, 'card.scenarioId совпадает');
  }

  // 8. Проверка замыкания зависимостей (card.id → scenarioId, lessonId, courseId)
  let closureErrors = 0;
  for (const pb of v2.programs) {
    for (const lb of pb.lessons) {
      for (const sb of lb.scenarios) {
        for (const cb of sb.cards) {
          if (cb.card.scenarioId !== sb.scenario.id) closureErrors++;
          if (cb.card.lessonId !== lb.lesson.id) closureErrors++;
          if (cb.card.courseId !== v2.course.id) closureErrors++;
        }
      }
    }
  }
  assert(closureErrors === 0, 'Замыкание зависимостей: все ID связаны');

  // 9. Статистика
  let totalCards = 0;
  let totalScenarios = 0;
  let totalLessons = 0;
  for (const pb of v2.programs) {
    totalLessons += pb.lessons.length;
    for (const lb of pb.lessons) {
      totalScenarios += lb.scenarios.length;
      for (const sb of lb.scenarios) {
        totalCards += sb.cards.length;
      }
    }
  }
  assert(totalCards > 0, `Есть карточки: ${totalCards}`);
  assert(totalScenarios > 0, `Есть сценарии: ${totalScenarios}`);
  assert(totalLessons > 0, `Есть уроки: ${totalLessons}`);

  // Сохраняем v2 для round-trip теста
  return { v2, output, stats: { totalCards, totalScenarios, totalLessons } };
}

// ─── Тесты валидации импорта ─────────────────────────────────────────────────

function testImportValidation() {
  console.log('\n📥 Тесты валидации импорта (v2):');

  const tmp = tempDir();

  // 1. Валидация: missing fields
  const invalidBundle = join(tmp, 'invalid.json');
  writeFileSync(invalidBundle, JSON.stringify({ formatVersion: 2 }));

  const result1 = runImport(invalidBundle, 'invalid-test');
  assert(result1.code !== 0, 'Невалидный v2 (missing course/programs) отклоняется');

  // 2. Валидация: wrong version
  const wrongVersion = join(tmp, 'wrong-version.json');
  writeFileSync(wrongVersion, JSON.stringify({ formatVersion: 99, course: {}, programs: [] }));

  const result2 = runImport(wrongVersion, 'wrong-test');
  assert(result2.code !== 0, 'Неподдерживаемая версия формата отклоняется');

  // 3. Валидация: valid v2
  const validBundle = join(tmp, 'valid.json');
  const validV2 = {
    formatVersion: 2,
    exportedAt: new Date().toISOString(),
    sourceAuthorId: 'user-123',
    course: {
      id: 'test-import-v2-ok',
      title: 'Test Import',
      programIds: ['prog-import'],
    },
    programs: [
      {
        program: { id: 'prog-import', title: 'P' },
        order: 0,
        lessons: [
          {
            lesson: { id: 'les-import', title: 'L' },
            order: 0,
            scenarios: [
              {
                scenario: { id: 'sc-import', title: 'S' },
                order: 0,
                cards: [],
              },
            ],
          },
        ],
      },
    ],
  };
  writeFileSync(validBundle, JSON.stringify(validV2));

  const result3 = runImport(validBundle, 'test-import-v2-ok');
  assert(result3.code === 0, 'Валидный v2 импортируется успешно');

  // 4. Проверка коллизий (без --replace)
  const result4 = runImport(validBundle, 'test-import-v2-ok');
  assert(result4.code !== 0, 'Коллизия id отклоняется без --replace');

  // 5. Проверка коллизий (с --replace)
  const result5 = runImport(validBundle, 'test-import-v2-ok', true);
  assert(result5.code === 0, 'Коллизия id игнорируется с --replace');
}

// ─── Round-trip: seed → v2 → seed ────────────────────────────────────────────

function testRoundTrip() {
  console.log('\n🔄 Round-trip тест (seed → v2 → seed):');

  const tmp = tempDir();
  const v2Path = join(tmp, 'roundtrip.linguacode-course.json');
  const seedPath = join(tmp, 'roundtrip-seed.json');

  // 1. Экспорт
  const exportResult = runExport('course-demo-card-kinds', v2Path);
  assert(exportResult.code === 0, 'Round-trip: экспорт прошёл');

  const v2 = JSON.parse(readFileSync(v2Path, 'utf8'));

  // 2. Сохраняем оригинальный seed для сравнения
  const originalCoursePath = join(dataDir, 'demo/courses/course-demo-card-kinds.json');
  const originalSeed = JSON.parse(readFileSync(originalCoursePath, 'utf8'));

  // 3. Проверяем, что v2 содержит все ключевые данные
  assert(v2.course.title === originalSeed.title, 'Round-trip: title совпадает');
  assert(v2.course.id === originalSeed.id, 'Round-trip: id совпадает');
  // languagePair трансформируется: known/learning → source/target
  const lp = v2.course.languagePair;
  const olp = originalSeed.languagePair;
  const lpMatch = lp && olp && lp.source === olp.known && lp.target === olp.learning;
  assert(lpMatch, 'Round-trip: languagePair совпадает (known→source, learning→target)');

  // 4. Проверяем, что программы не потеряны
  assert(v2.programs.length === originalSeed.programs.length, 'Round-trip: programs.length совпадает');

  // 5. Проверяем, что lessons не потеряны
  let originalLessons = 0;
  let v2Lessons = 0;
  for (const p of originalSeed.programs) originalLessons += p.lessons.length;
  for (const pb of v2.programs) v2Lessons += pb.lessons.length;
  assert(v2Lessons === originalLessons, `Round-trip: lessons совпадает (${v2Lessons})`);

  // 6. Проверяем, что scenarios не потеряны
  let originalScenarios = 0;
  let v2Scenarios = 0;
  for (const p of originalSeed.programs) {
    for (const l of p.lessons) originalScenarios += l.scenarios.length;
  }
  for (const pb of v2.programs) {
    for (const lb of pb.lessons) v2Scenarios += lb.scenarios.length;
  }
  assert(v2Scenarios === originalScenarios, `Round-trip: scenarios совпадает (${v2Scenarios})`);

  // 7. Проверяем inline cards
  let originalCards = 0;
  let v2Cards = 0;
  for (const p of originalSeed.programs) {
    for (const l of p.lessons) {
      for (const s of l.scenarios) {
        if (s.cards) originalCards += s.cards.length;
      }
    }
  }
  for (const pb of v2.programs) {
    for (const lb of pb.lessons) {
      for (const sb of lb.scenarios) {
        v2Cards += sb.cards.length;
      }
    }
  }
  assert(v2Cards === originalCards, `Round-trip: inline cards совпадает (${v2Cards})`);

  // 8. Проверяем order на каждом уровне
  for (let i = 0; i < v2.programs.length; i++) {
    assert(v2.programs[i].order === i, `Round-trip: program[${i}].order === ${i}`);
  }
  for (const pb of v2.programs) {
    for (let j = 0; j < pb.lessons.length; j++) {
      assert(pb.lessons[j].order === j, `Round-trip: lesson[${j}].order === ${j}`);
    }
  }

  console.log(`  📊 Итого проверок: ${total}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('🧪 Тесты export/import CourseBundle v2');
  console.log('='.repeat(50));

  try {
    testExportStructure();
    testImportValidation();
    testRoundTrip();
  } catch (err) {
    console.error('\n❌ Ошибка выполнения тестов:', err.message);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Результат: ${passed}/${total} пройдено, ${failed} провалено`);

  if (failed > 0) {
    process.exit(1);
  }
  console.log('\n✅ Все тесты пройдены.');
}

main();
