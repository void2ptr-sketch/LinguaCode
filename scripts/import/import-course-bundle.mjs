/**
 * import-course-bundle.mjs
 *
 * Импортирует CourseBundle v1/v2 (JSON) в seed-файлы репозитория.
 *
 * Использование:
 *   node scripts/import-course-bundle.mjs --bundle ./path/to/course.linguacode-course.json --slug my-course
 *
 * Опции:
 *   --bundle   Путь к CourseBundle JSON (обязательно)
 *   --slug     Уникальный идентификатор для имен файлов (обязательно)
 *   --replace  Перезаписать существующие файлы seed, если курс с таким id уже есть
 *
 * Поддерживаемые форматы:
 *   v1 — flat format (courses[], lessons[], scenarios[], cards[])
 *   v2 — nested format с обёртками (course, programs[{ program, lessons[{ lesson, scenarios[{ scenario, cards }] }] }])
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
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

  const version = data.formatVersion;

  if (version !== 1 && version !== 2) {
    errors.push(`Неподдерживаемая версия формата: ${version}. Ожидается: 1 или 2`);
    return { valid: false, errors };
  }

  if (version === 2) {
    // v2 validation
    if (!data.exportedAt) {
      errors.push('Отсутствует дата экспорта (exportedAt)');
    }

    if (!data.course || typeof data.course !== 'object') {
      errors.push('Отсутствует course');
    } else {
      const course = data.course;
      if (typeof course.id !== 'string') errors.push('course.id должен быть строкой');
      if (typeof course.title !== 'string') errors.push('course.title должен быть строкой');
      if (!Array.isArray(course.programIds)) errors.push('course.programIds должен быть массивом');
    }

    if (!data.programs || !Array.isArray(data.programs)) {
      errors.push('Отсутствует programs');
    } else {
      for (let i = 0; i < data.programs.length; i++) {
        const pb = data.programs[i];
        if (!pb.program || typeof pb.program.id !== 'string') {
          errors.push(`programs[${i}].program.id должен быть строкой`);
        }
        if (typeof pb.order !== 'number') {
          errors.push(`programs[${i}].order должен быть числом`);
        }
        if (!Array.isArray(pb.lessons)) {
          errors.push(`programs[${i}].lessons должен быть массивом`);
        } else {
          for (let j = 0; j < pb.lessons.length; j++) {
            const lb = pb.lessons[j];
            if (!lb.lesson || typeof lb.lesson.id !== 'string') {
              errors.push(`programs[${i}].lessons[${j}].lesson.id должен быть строкой`);
            }
            if (typeof lb.order !== 'number') {
              errors.push(`programs[${i}].lessons[${j}].order должен быть числом`);
            }
            if (!Array.isArray(lb.scenarios)) {
              errors.push(`programs[${i}].lessons[${j}].scenarios должен быть массивом`);
            } else {
              for (let k = 0; k < lb.scenarios.length; k++) {
                const sb = lb.scenarios[k];
                if (!sb.scenario || typeof sb.scenario.id !== 'string') {
                  errors.push(`programs[${i}].lessons[${j}].scenarios[${k}].scenario.id должен быть строкой`);
                }
                if (!Array.isArray(sb.cards)) {
                  errors.push(`programs[${i}].lessons[${j}].scenarios[${k}].cards должен быть массивом`);
                }
              }
            }
          }
        }
      }
    }
  } else {
    // v1 validation
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

    // cardIndexMeta устарел — метаданные теперь в карточках (card.meta)
    // (если есть — используем как fallback при импорте, но не храним отдельно)

    if (data.course?.courses?.length !== 1) {
      errors.push(`Пакет должен содержать ровно 1 курс, найдено: ${data.course?.courses?.length ?? 0}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Проверка коллизий id ─────────────────────────────────────────────────────

function checkCollisions(data, existingIds) {
  const collisions = [];

  if (data.formatVersion === 2) {
    // v2: extract IDs from nested structure
    const courseIds = [data.course.id];
    const lessonIds = [];
    const scenarioIds = [];
    const cardIds = [];

    for (const pb of data.programs) {
      for (const lb of pb.lessons) {
        lessonIds.push(lb.lesson.id);
        for (const sb of lb.scenarios) {
          scenarioIds.push(sb.scenario.id);
          for (const cb of sb.cards) {
            cardIds.push(cb.card.id);
          }
        }
      }
    }

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
  } else {
    // v1: flat structure
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
        const fixture = JSON.parse(readFileSync(join(dataDir, file.replace(/^\/$/, '')), 'utf8'));

        // v1 flat format: { courses: [...], lessons: [...] }
        for (const course of fixture.courses ?? []) ids.courses.add(course.id);
        for (const lesson of fixture.lessons ?? []) ids.lessons.add(lesson.id);

        // v2 nested format: { id, programs: [{ lessons: [{ scenarios: [{ cards }] }] }] }
        if (fixture.programs && Array.isArray(fixture.programs)) {
          ids.courses.add(fixture.id);
          for (const program of fixture.programs) {
            for (const lesson of program.lessons ?? []) {
              ids.lessons.add(lesson.id);
              for (const scenario of lesson.scenarios ?? []) {
                ids.scenarios.add(scenario.id);
                for (const card of scenario.cards ?? []) {
                  ids.cards.add(card.id);
                }
              }
            }
          }
        }
      } catch { /* файл может отсутствовать */ }
    }

    for (const file of manifest.scenarioFiles) {
      try {
        const fixture = JSON.parse(readFileSync(join(dataDir, file.replace(/^\/$/, '')), 'utf8'));
        for (const scenario of fixture.scenarios ?? []) ids.scenarios.add(scenario.id);
      } catch { /* файл может отсутствовать */ }
    }

    for (const file of manifest.cardFiles) {
      try {
        const fixture = JSON.parse(readFileSync(join(dataDir, file.replace(/^\/$/, '')), 'utf8'));
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
  if (data.formatVersion === 2) {
    return normalizeV2ForSeed(data);
  }
  return normalizeV1ForSeed(data);
}

function normalizeV1ForSeed(data) {
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

  const cards = data.cards.map((card) => {
    const cardMeta = card.meta ?? {};
    // cardIndexMeta из внешнего источника не используется
    if (data.cardIndexMeta && data.cardIndexMeta[card.id]) {
      return {
        ...card,
        meta: { ...cardMeta, ...data.cardIndexMeta[card.id] },
        updatedAt: now,
      };
    }
    return { ...card, meta: cardMeta, updatedAt: now };
  });

  return { courses, lessons, scenarios, cards };
}

/**
 * Трансформирует v2 CourseBundle в flat seed-формат.
 *
 * Распаковывает вложенную структуру:
 *   programs[{ program, lessons[{ lesson, scenarios[{ scenario, cards }] }] }]
 * в flat массивы: courses[], programs[], lessons[], scenarios[], cards[]
 */
function normalizeV2ForSeed(data) {
  const now = new Date().toISOString();

  // Извлекаем course из обёртки
  const course = {
    ...data.course,
    authorId: 'system',
    published: true,
    updatedAt: now,
    // В seed-формате v1 используется courses[] и lessons[], а не programIds
    // Для nested seed-формата (который мы пишем) создаём CoursesNestedFixture
  };

  // Формируем nested структуру для seed
  const programs = [];
  const lessons = [];
  const scenarios = [];
  const cards = [];

  for (const pb of data.programs) {
    const program = {
      ...pb.program,
      order: pb.order,
      lessons: [], // заполним ниже
    };
    programs.push(program);

    for (const lb of pb.lessons) {
      const lesson = {
        ...lb.lesson,
        order: lb.order,
        scenarios: [], // заполним ниже
      };
      lessons.push(lesson);
      program.lessons.push(lesson);

      for (const sb of lb.scenarios) {
        const scenario = {
          ...sb.scenario,
          order: sb.order,
          cards: [], // заполним ниже
          _cardIds: sb.cards.map((c) => c.card.id),
        };
        scenarios.push(scenario);
        lesson.scenarios.push(scenario);

        for (const cb of sb.cards) {
          const card = {
            ...cb.card,
            meta: { ...cb.card.meta, ...cb.meta },
            updatedAt: now,
          };
          cards.push(card);
          scenario.cards.push(card);
        }
      }
    }
  }

  return {
    course,
    programs,
    lessons,
    scenarios,
    cards,
    formatVersion: 2,
  };
}

// ─── Запись файлов ────────────────────────────────────────────────────────────

function writeJson(relativePath, payload) {
  const fullPath = join(dataDir, relativePath.replace(/^\/$/, ''));
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`  ✓ ${relativePath}`);
}

function writeSeedFiles(slug, normalized) {
  // Для v2 пишем nested format (как в seed-файлах)
  if (normalized.formatVersion === 2) {
    const courseFile = `courses/${slug}.json`;
    const nestedFixture = {
      id: normalized.course.id,
      title: normalized.course.title,
      description: normalized.course.description,
      languagePair: normalized.course.languagePair,
      practiceSettings: normalized.course.practiceSettings,
      published: normalized.course.published,
      authoring: normalized.course.authoring,
      updatedAt: normalized.course.updatedAt,
      programs: normalized.programs,
    };
    writeJson(courseFile, nestedFixture);
    return { courseFile };
  }

  // Для v1 пишем legacy flat format
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

  // Для v2 (nested format) — только courseFile
  if (files.courseFile) {
    manifest.courseFiles = addUnique(manifest.courseFiles, `/${files.courseFile}`);
  }
  if (files.scenarioFile) {
    manifest.scenarioFiles = addUnique(manifest.scenarioFiles, `/${files.scenarioFile}`);
  }
  if (files.cardsFile) {
    manifest.cardFiles = addUnique(manifest.cardFiles, files.cardsFile);
  }

  writeJson('content-manifest.json', manifest);
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
  const courseTitle =
    data.formatVersion === 2
      ? normalized.course?.title ?? 'без названия'
      : normalized.courses?.[0]?.title ?? 'без названия';
  console.log(`\nИмпорт курса «${courseTitle}»:`);
  const files = writeSeedFiles(opts.slug, normalized);

  // 7. Обновление manifest
  updateManifest(files);

  const courseId =
    data.formatVersion === 2 ? normalized.course?.id : normalized.courses?.[0]?.id;
  console.log(`\nГотово. Курс добавлен в seed.`);
  console.log(`  slug: ${opts.slug}`);
  console.log(`  course id: ${courseId}`);
  console.log(`  format: v${data.formatVersion}`);
  console.log(`  manifest: public/data/content-manifest.json`);
  console.log(`\nНе забудьте проверить изменения и сделать commit.`);
}

main();
