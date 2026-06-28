/**
 * import-course-bundle.mjs
 *
 * Импортирует CourseBundle (JSON) в seed-файлы репозитория.
 *
 * Использование:
 *   node scripts/import-course-bundle.mjs --bundle ./path/to/course.linguacode-course.json --slug my-course
 *
 * Опции:
 *   --bundle   Путь к CourseBundle JSON (обязательно)
 *   --slug     Уникальный идентификатор для имен файлов (обязательно)
 *   --replace  Перезаписать существующие файлы seed, если курс с таким id уже есть
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'public/data');

// ─── Парсинг аргументов ───────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { bundle: '', slug: '', replace: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--bundle' && args[i + 1]) {
      opts.bundle = args[++i];
    } else if (args[i] === '--slug' && args[i + 1]) {
      opts.slug = args[++i];
    } else if (args[i] === '--replace') {
      opts.replace = true;
    }
  }

  return opts;
}

// ─── Валидация CourseBundle ───────────────────────────────────────────────────

function validateBundle(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Файл не содержит JSON-объект'] };
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

  return { valid: errors.length === 0, errors };
}

// ─── Проверка коллизий id ─────────────────────────────────────────────────────

function checkCollisions(data, existingIds) {
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

// ─── Загрузка существующего seed ──────────────────────────────────────────────

function loadExistingIds() {
  const ids = { courses: new Set(), lessons: new Set(), scenarios: new Set(), cards: new Set() };

  try {
    const manifest = JSON.parse(readFileSync(join(dataDir, 'content-manifest.json'), 'utf8'));

    for (const file of manifest.courseFiles) {
      try {
        const fixture = JSON.parse(readFileSync(join(dataDir, file.replace(/^\//, '')), 'utf8'));
        for (const course of fixture.courses ?? []) ids.courses.add(course.id);
        for (const lesson of fixture.lessons ?? []) ids.lessons.add(lesson.id);
      } catch { /* файл может отсутствовать */ }
    }

    for (const file of manifest.scenarioFiles) {
      try {
        const fixture = JSON.parse(readFileSync(join(dataDir, file.replace(/^\//, '')), 'utf8'));
        for (const scenario of fixture.scenarios ?? []) ids.scenarios.add(scenario.id);
      } catch { /* файл может отсутствовать */ }
    }

    for (const file of manifest.cardFiles) {
      try {
        const fixture = JSON.parse(readFileSync(join(dataDir, file.replace(/^\//, '')), 'utf8'));
        for (const card of fixture.cards ?? []) ids.cards.add(card.id);
      } catch { /* файл может отсутствовать */ }
    }
  } catch {
    // manifest может отсутствовать при первом запуске
  }

  return ids;
}

// ─── Нормализация для seed ────────────────────────────────────────────────────

function normalizeForSeed(data) {
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

// ─── Запись файлов ────────────────────────────────────────────────────────────

function writeJson(relativePath, payload) {
  const fullPath = join(dataDir, relativePath.replace(/^\//, ''));
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`  ✓ ${relativePath}`);
}

function writeSeedFiles(slug, normalized) {
  const courseFile = `courses/${slug}-course.json`;
  const scenarioFile = `scenarios/${slug}-scenarios.json`;
  const cardsFile = `${slug}-cards.json`;

  writeJson(courseFile, { courses: normalized.courses, lessons: normalized.lessons });
  writeJson(scenarioFile, { scenarios: normalized.scenarios });
  writeJson(cardsFile, { cards: normalized.cards });

  return { courseFile, scenarioFile, cardsFile };
}

// ─── Обновление manifest ──────────────────────────────────────────────────────

function updateManifest(files) {
  const manifestPath = join(dataDir, 'content-manifest.json');
  let manifest;

  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    manifest = { version: 1, cardFiles: [], scenarioFiles: [], courseFiles: [] };
  }

  const addUnique = (arr, item) => (arr.includes(item) ? arr : [...arr, item]);

  manifest.cardFiles = addUnique(manifest.cardFiles, files.cardsFile);
  manifest.scenarioFiles = addUnique(manifest.scenarioFiles, `/${files.scenarioFile}`);
  manifest.courseFiles = addUnique(manifest.courseFiles, `/${files.courseFile}`);

  writeJson('content-manifest.json', manifest);
}

// ─── Обновление card-index-meta ───────────────────────────────────────────────

function updateCardIndexMeta(cardIndexMeta) {
  const metaPath = join(dataDir, 'card-index-meta.json');
  let existing;

  try {
    existing = JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch {
    existing = { metaById: {} };
  }

  existing.metaById = { ...existing.metaById, ...cardIndexMeta };
  writeJson('card-index-meta.json', existing);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const opts = parseArgs();

  if (!opts.bundle || !opts.slug) {
    console.error('Использование:');
    console.error('  node scripts/import-course-bundle.mjs --bundle <path> --slug <slug> [--replace]');
    console.error('');
    console.error('  --bundle   Путь к CourseBundle JSON (обязательно)');
    console.error('  --slug     Уникальный идентификатор для имен файлов (обязательно)');
    console.error('  --replace  Перезаписать существующие файлы seed, если курс с таким id уже есть');
    process.exit(1);
  }

  // 1. Чтение
  let raw;
  try {
    raw = readFileSync(opts.bundle, 'utf8');
  } catch (err) {
    console.error(`Ошибка чтения файла: ${err.message}`);
    process.exit(1);
  }

  // 2. Парсинг
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`Ошибка парсинга JSON: ${err.message}`);
    process.exit(1);
  }

  // 3. Валидация
  const validation = validateBundle(data);
  if (!validation.valid) {
    console.error('Ошибки валидации пакета:');
    for (const error of validation.errors) {
      console.error(`  ✗ ${error}`);
    }
    process.exit(1);
  }

  // 4. Проверка коллизий
  const existingIds = loadExistingIds();
  const collisions = checkCollisions(data, existingIds);

  if (collisions.length > 0) {
    if (opts.replace) {
      console.log('Предупреждение: найдены коллизии id, но используется --replace:');
      for (const c of collisions) {
        console.log(`  ⚠ ${c}`);
      }
    } else {
      console.error('Найдены коллизии id с существующим seed. Используйте --replace для перезаписи:');
      for (const c of collisions) {
        console.error(`  ✗ ${c}`);
      }
      process.exit(1);
    }
  }

  // 5. Нормализация
  const normalized = normalizeForSeed(data);

  // 6. Запись файлов
  console.log(`\nИмпорт курса «${normalized.courses[0]?.title ?? 'без названия'}»:`);
  const files = writeSeedFiles(opts.slug, normalized);

  // 7. Обновление manifest
  updateManifest(files);

  // 8. Обновление card-index-meta
  updateCardIndexMeta(normalized.cardIndexMeta);

  console.log(`\nГотово. Курс добавлен в seed.`);
  console.log(`  slug: ${opts.slug}`);
  console.log(`  course id: ${normalized.courses[0]?.id}`);
  console.log(`  manifest: public/data/content-manifest.json`);
  console.log(`\nНе забудьте проверить изменения и сделать commit.`);
}

main();
