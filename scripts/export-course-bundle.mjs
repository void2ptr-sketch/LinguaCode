/**
 * export-course-bundle.mjs
 *
 * Экспортирует seed-курс (nested format) в CourseBundle v2 формат.
 *
 * Использование:
 *   node scripts/export-course-bundle.mjs --slug <slug> [--output <path>]
 *
 * Опции:
 *   --slug     Уникальный идентификатор курса для экспорта (обязательно)
 *   --output   Путь к выходному файлу (по умолчанию: ./export/<slug>.linguacode-course.json)
 *
 * Пример:
 *   node scripts/export-course-bundle.mjs --slug course-zh-radicals-214
 *   node scripts/export-course-bundle.mjs --slug course-cpp-complete --output ./my-course.json
 *
 * Формат v2 (CourseBundle):
 *   {
 *     formatVersion: 2,
 *     exportedAt: ISO-8601,
 *     course: { ...course, programIds: [...] },
 *     programs: [{ program, order, lessons: [...] }],
 *   }
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'public/data');

// ─── Парсинг аргументов ───────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { slug: '', output: '' };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug' && args[i + 1]) {
      opts.slug = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      opts.output = args[++i];
    }
  }

  return opts;
}

// ─── Загрузка manifest и курса ────────────────────────────────────────────────

function loadManifest() {
  const manifestPath = join(dataDir, 'content-manifest.json');
  if (!existsSync(manifestPath)) {
    console.error('[ERROR] content-manifest.json not found');
    process.exit(1);
  }
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

function findCourseFile(manifest, slug) {
  const candidates = manifest.courseFiles.filter((f) => {
    const clean = f.replace(/^\//, '');
    return clean.endsWith(`/${slug}.json`);
  });

  if (candidates.length === 0) {
    console.error(`[ERROR] Course with slug "${slug}" not found in manifest`);
    console.error(`  Available courses:`);
    for (const f of manifest.courseFiles) {
      const clean = f.replace(/^\//, '');
      const name = clean.replace(/\/courses\//, '').replace(/\.json$/, '');
      console.error(`    - ${name}`);
    }
    process.exit(1);
  }

  if (candidates.length > 1) {
    console.error(`[ERROR] Multiple courses match slug "${slug}":`);
    for (const c of candidates) {
      console.error(`    - ${c}`);
    }
    process.exit(1);
  }

  return candidates[0];
}

function loadCourse(fixturePath) {
  const fullPath = join(dataDir, fixturePath.replace(/^\//, ''));
  if (!existsSync(fullPath)) {
    console.error(`[ERROR] Course file not found: ${fullPath}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(fullPath, 'utf8'));
}

// ─── Загрузка карточек из card-файлов manifest ─────────────────────────────────

/**
 * Загружает все карточки из card-файлов manifest в Map по ID.
 * Используется для подгрузки карточек по _cardIds (C++ курс).
 */
function loadAllCardsFromManifest(manifest) {
  const cardMap = new Map(); // cardId -> card

  for (const file of manifest.cardFiles) {
    try {
      const fullPath = join(dataDir, file.replace(/^\//, ''));
      const data = JSON.parse(readFileSync(fullPath, 'utf8'));
      if (Array.isArray(data.cards)) {
        for (const card of data.cards) {
          cardMap.set(card.id, card);
        }
      }
    } catch {
      // Card file may not exist — skip
    }
  }

  return cardMap;
}

// ─── Сбор карточек из двух источников ─────────────────────────────────────────

/**
 * Собирает все карточки из nested scenarios:
 * 1. Inline cards[] ( populated in demo courses )
 * 2. _cardIds fallback ( used in C++ course ) — загружает из card-файлов
 *
 * @param {object} fixture — seed-курс
 * @param {Map} cardMap — карта всех карточек из manifest (для _cardIds)
 */
function collectCardsFromScenarios(fixture, cardMap) {
  const cardMapResult = new Map(); // id -> { card, order }

  for (const program of fixture.programs) {
    for (const lesson of program.lessons) {
      for (const scenario of lesson.scenarios) {
        // Inline cards
        if (Array.isArray(scenario.cards) && scenario.cards.length > 0) {
          for (let i = 0; i < scenario.cards.length; i++) {
            const card = scenario.cards[i];
            if (!cardMapResult.has(card.id)) {
              cardMapResult.set(card.id, { card, order: i, scenarioId: scenario.id, lessonId: lesson.id, courseId: fixture.id });
            }
          }
        } else if (Array.isArray(scenario._cardIds) && scenario._cardIds.length > 0) {
          // _cardIds: загружаем карточки из manifest
          for (const cardId of scenario._cardIds) {
            const card = cardMap.get(cardId);
            if (card && !cardMapResult.has(card.id)) {
              cardMapResult.set(card.id, { card, order: 0, scenarioId: scenario.id, lessonId: lesson.id, courseId: fixture.id });
            }
          }
        }
      }
    }
  }

  return cardMapResult;
}

/**
 * Собирает cardSource для сценария:
 * - если cards[] не пустой → cardIds из cards[].id
 * - иначе → cardIds из _cardIds
 */
function getCardIdsForScenario(scenario) {
  if (Array.isArray(scenario.cards) && scenario.cards.length > 0) {
    return scenario.cards.map((c) => c.id);
  }
  if (Array.isArray(scenario._cardIds)) {
    return scenario._cardIds;
  }
  return [];
}

// ─── Трансформация в v2 ──────────────────────────────────────────────────────

function transformToV2(fixture, cardMap) {
  const now = new Date().toISOString();

  // Собираем cardSource для каждого сценария
  const scenarioCardSources = new Map();
  for (const program of fixture.programs) {
    for (const lesson of program.lessons) {
      for (const scenario of lesson.scenarios) {
        const cardIds = getCardIdsForScenario(scenario);
        scenarioCardSources.set(scenario.id, { mode: 'fixed', cardIds });
      }
    }
  }

  // Формируем v2 структуру
  const v2 = {
    formatVersion: 2,
    exportedAt: now,
    course: {
      id: fixture.id,
      title: fixture.title,
      description: fixture.description ?? '',
      languagePair: fixture.languagePair,
      practiceSettings: fixture.practiceSettings ?? null,
      published: fixture.published ?? false,
      authoring: fixture.authoring,
      programIds: fixture.programs.map((p) => p.id),
    },
    programs: fixture.programs.map((program) => ({
      program: {
        id: program.id,
        title: program.title,
        description: program.description ?? '',
        lessonIds: program.lessons.map((l) => l.id),
        prerequisiteProgramIds: program.prerequisiteProgramIds ?? [],
      },
      order: program.order,
      lessons: program.lessons.map((lesson) => ({
        lesson: {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description ?? '',
          scenarioIds: lesson.scenarios.map((s) => s.id),
          prerequisiteLessonIds: lesson.prerequisiteLessonIds ?? [],
        },
        order: lesson.order,
        scenarios: lesson.scenarios.map((scenario) => {
          // Для inline cards[] используем напрямую, для _cardIds — загружаем из cardMap
          let cardsArray = scenario.cards ?? [];
          if (cardsArray.length === 0 && Array.isArray(scenario._cardIds)) {
            cardsArray = scenario._cardIds
              .map((cardId) => cardMap.get(cardId))
              .filter(Boolean);
          }

          return {
            scenario: {
              id: scenario.id,
              title: scenario.title,
              description: scenario.description ?? '',
              languagePair: scenario.languagePair ?? null,
              published: scenario.published ?? false,
              cardSource: scenarioCardSources.get(scenario.id) ?? { mode: 'fixed', cardIds: [] },
            },
            order: scenario.order,
            cards: cardsArray.map((card, cardOrder) => ({
              card: {
                id: card.id,
                kind: card.kind,
                title: card.title,
                appearance: card.appearance,
                direction: card.direction,
                promptKnown: card.promptKnown,
                optionsLearning: card.optionsLearning,
                optionsKnown: card.optionsKnown,
                correctIndex: card.correctIndex,
                courseId: fixture.id,
                lessonId: lesson.id,
                scenarioId: scenario.id,
              },
              order: cardOrder,
              meta: card.meta ?? null,
            })),
          };
        }),
      })),
    })),
  };

  return v2;
}

// ─── Проверка замыкания зависимостей ──────────────────────────────────────────

function verifyDependencyClosure(v2) {
  const errors = [];
  const course = v2.course;

  // Проверка programIds
  const programIds = new Set(v2.programs.map((p) => p.program.id));
  for (const pid of course.programIds) {
    if (!programIds.has(pid)) {
      errors.push(`course.programIds содержит несуществующий programId: ${pid}`);
    }
  }

  // Проверка lessonIds в programs
  for (const pb of v2.programs) {
    const lessonIds = new Set(pb.lessons.map((l) => l.lesson.id));
    for (const lid of pb.program.lessonIds) {
      if (!lessonIds.has(lid)) {
        errors.push(`program "${pb.program.id}" lessonIds содержит несуществующий lessonId: ${lid}`);
      }
    }

    // Проверка scenarioIds в lessons
    for (const lb of pb.lessons) {
      const scenarioIds = new Set(lb.scenarios.map((s) => s.scenario.id));
      for (const sid of lb.lesson.scenarioIds) {
        if (!scenarioIds.has(sid)) {
          errors.push(`lesson "${lb.lesson.id}" scenarioIds содержит несуществующий scenarioId: ${sid}`);
        }
      }

      // Проверка cardIds в cardSource
      for (const sb of lb.scenarios) {
        const cardIds = new Set(sb.cards.map((c) => c.card.id));
        for (const cid of sb.scenario.cardSource.cardIds) {
          if (!cardIds.has(cid)) {
            errors.push(`scenario "${sb.scenario.id}" cardSource.cardIds содержит несуществующий cardId: ${cid}`);
          }
        }
      }
    }
  }

  return errors;
}

// ─── Запись файла ─────────────────────────────────────────────────────────────

function writeBundle(outputPath, v2) {
  const full = resolve(outputPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(v2, null, 2)}\n`);
  console.log(`  ✓ ${outputPath}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const opts = parseArgs();

  if (!opts.slug) {
    console.error('Использование:');
    console.error('  node scripts/export-course-bundle.mjs --slug <slug> [--output <path>]');
    console.error('');
    console.error('  --slug     Уникальный идентификатор курса для экспорта (обязательно)');
    console.error('  --output   Путь к выходному файлу (по умолчанию: ./export/<slug>.linguacode-course.json)');
    process.exit(1);
  }

  // 1. Загрузка manifest и курса
  const manifest = loadManifest();
  const fixturePath = findCourseFile(manifest, opts.slug);
  const fixture = loadCourse(fixturePath);

  console.log(`\nЭкспорт курса «${fixture.title}» (slug: ${opts.slug}):`);
  console.log(`  источник: ${fixturePath}`);

  // 2. Загружаем все карточки из manifest (для _cardIds fallback)
  const cardMap = loadAllCardsFromManifest(manifest);
  console.log(`  загружено карточек из manifest: ${cardMap.size}`);

  // 3. Трансформация в v2
  const v2 = transformToV2(fixture, cardMap);

  // 4. Проверка замыкания зависимостей
  const closureErrors = verifyDependencyClosure(v2);
  if (closureErrors.length > 0) {
    console.error('\nОшибки замыкания зависимостей:');
    for (const err of closureErrors) {
      console.error(`  ✗ ${err}`);
    }
    process.exit(1);
  }

  // 5. Подсчёт статистики
  let totalLessons = 0;
  let totalScenarios = 0;
  let totalCards = 0;
  for (const pb of v2.programs) {
    totalLessons += pb.lessons.length;
    for (const lb of pb.lessons) {
      totalScenarios += lb.scenarios.length;
      for (const sb of lb.scenarios) {
        totalCards += sb.cards.length;
      }
    }
  }
  console.log(`  program: ${v2.programs.length}`);
  console.log(`  lessons: ${totalLessons}`);
  console.log(`  scenarios: ${totalScenarios}`);
  console.log(`  cards (inline): ${totalCards}`);

  // 6. Запись
  const outputPath = opts.output || join(root, 'export', `${opts.slug}.linguacode-course.json`);
  writeBundle(outputPath, v2);

  console.log(`\nГотово. Файл: ${outputPath}`);
}

main();
