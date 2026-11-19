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

// ─── Трансформация languagePair: known/learning → source/target ───────────────

function normalizeLanguagePair(lp) {
  if (!lp) return null;
  if (lp.source !== undefined && lp.target !== undefined) return lp;
  return { source: lp.known ?? null, target: lp.learning ?? null };
}

// ─── Трансформация в v2 ──────────────────────────────────────────────────────

function transformToV2(fixture, cardMap) {
  const now = new Date().toISOString();

  // ─── Вспомогательная: извлекает pinyin из promptLexeme ─────────────────
  function extractPinyin(card) {
    if (card.promptLexeme?.pinyin) return card.promptLexeme.pinyin;
    return null;
  }

  // ─── Вспомогательная: извлекает tones из promptLexeme ─────────────────
  function extractTones(card) {
    if (Array.isArray(card.promptLexeme?.tones)) return card.promptLexeme.tones;
    return null;
  }

  // ─── Вспомогательная: формирует meta с обязательными pinyin/tones ─────
  function buildMeta(card) {
    const baseMeta = card.meta ?? {};
    const meta = { ...baseMeta };
    // pinyin / tones — обязательные поля формата v2 (всегда присутствуют)
    if (meta.pinyin === undefined) meta.pinyin = extractPinyin(card);
    if (meta.tones === undefined) meta.tones = extractTones(card);
    return meta;
  }

  // ─── Вспомогательная: копирует ВСЕ поля карточки (CardBase + kind-specific) ─
  function copyCard(card) {
    return {
      id: card.id,
      kind: card.kind,
      title: card.title,
      appearance: card.appearance,
      // kind-specific fields
      direction: card.direction,
      promptKnown: card.promptKnown,
      optionsLearning: card.optionsLearning,
      optionsKnown: card.optionsKnown,
      correctIndex: card.correctIndex,
      // draw-specific
      referenceHintKnown: card.referenceHintKnown,
      meaningKnown: card.meaningKnown,
      practiceMode: card.practiceMode,
      targetCharacter: card.targetCharacter,
      strokeGuides: card.strokeGuides,
      radicalHint: card.radicalHint,
      characterTargets: card.characterTargets,
      // flip-specific
      front: card.front,
      back: card.back,
      frontLexeme: card.frontLexeme,
      backLexeme: card.backLexeme,
      audioUrl: card.audioUrl,
      // cloze-specific
      options: card.options,
      correctAnswer: card.correctAnswer,
      acceptedAnswers: card.acceptedAnswers,
      // code-select / code-trace
      caption: card.caption,
      prompt: card.prompt,
      code: card.code,
      outputOptions: card.outputOptions,
      question: card.question,
      // memory-specific
      pairs: card.pairs,
      // symbol-specific
      symbols: card.symbols,
      symbolLexemes: card.symbolLexemes,
      // sound-specific
      audioLabelLearning: card.audioLabelLearning,
      // timed-specific
      timeLimitSec: card.timeLimitSec,
      // keyboard-specific
      acceptedAnswersKnown: card.acceptedAnswersKnown,
      acceptedAnswersLearning: card.acceptedAnswersLearning,
      answerMode: card.answerMode,
      // tone-specific
      syllableBase: card.syllableBase,
      toneOptions: card.toneOptions,
      // reading-specific
      // (same as select)
      // references
      courseId: fixture.id,
      lessonId: fixture.lessons?.[0]?.id ?? '',
      scenarioId: '',
      // meta fields
      slug: card.slug,
      authorId: card.authorId,
      requiredTier: card.requiredTier,
      published: card.published,
      languagePairId: card.languagePairId,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }

  // ─── Формируем v2 структуру ────────────────────────────────────────────
  const v2 = {
    formatVersion: 2,
    exportedAt: now,
    sourceAuthorId: 'user-123',
    course: {
      id: fixture.id,
      title: fixture.title,
      description: fixture.description ?? '',
      slug: fixture.slug,
      languagePair: normalizeLanguagePair(fixture.languagePair),
      languagePairId: fixture.languagePairId,
      practiceSettings: fixture.practiceSettings ?? null,
      published: fixture.published ?? false,
      updatedAt: fixture.updatedAt ?? now,
      authoring: fixture.authoring ?? { idea: '', status: 'materialized', ideaUpdatedAt: now, materializedAt: now, lastError: null },
      programIds: fixture.programs.map((p) => p.id),
      order: fixture.order,
      authorId: fixture.authorId,
    },
    programs: fixture.programs.map((program) => ({
      program: {
        id: program.id,
        title: program.title,
        description: program.description ?? '',
        courseId: fixture.id,
        lessonIds: program.lessons.map((l) => l.id),
        order: program.order,
        prerequisiteProgramIds: program.prerequisiteProgramIds,
        requiredTier: program.requiredTier,
        published: program.published,
        updatedAt: program.updatedAt ?? now,
        languagePairId: program.languagePairId,
      },
      order: program.order,
      lessons: program.lessons.map((lesson) => ({
        lesson: {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description ?? '',
          programId: program.id,
          scenarioIds: lesson.scenarios.map((s) => s.id),
          prerequisiteLessonIds: lesson.prerequisiteLessonIds ?? [],
          order: lesson.order,
          published: lesson.published,
          updatedAt: lesson.updatedAt ?? now,
          requiredTier: lesson.requiredTier,
          languagePairId: lesson.languagePairId,
          courseId: fixture.id,
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

          // cardSource: из inline cards[] формируем fixed mode
          const cardIds = cardsArray.map((c) => c.id);

          return {
            scenario: {
              id: scenario.id,
              title: scenario.title,
              description: scenario.description ?? '',
              lessonId: lesson.id,
              courseId: fixture.id,
              programId: program.id,
              authorId: scenario.authorId,
              cardSource: { mode: 'fixed', cardIds },
              order: scenario.order,
              published: scenario.published,
              updatedAt: scenario.updatedAt ?? now,
              requiredTier: scenario.requiredTier,
              languagePairId: scenario.languagePairId,
            },
            order: scenario.order,
            cards: cardsArray.map((card, cardOrder) => {
              const cardCopy = copyCard(card);
              cardCopy.lessonId = lesson.id;
              cardCopy.scenarioId = scenario.id;
              return {
                card: cardCopy,
                order: cardOrder,
                meta: buildMeta(card),
              };
            }),
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

  // Проверка cardIds в scenarios
  for (const pb of v2.programs) {
    for (const lb of pb.lessons) {
      for (const sb of lb.scenarios) {
        // Проверка: card.id → scenarioId
        for (const cb of sb.cards) {
          if (cb.card.scenarioId !== sb.scenario.id) {
            errors.push(`card "${cb.card.id}" scenarioId не совпадает с ${sb.scenario.id}`);
          }
        }
        // Проверка: card.id → lessonId
        for (const cb of sb.cards) {
          if (cb.card.lessonId !== lb.lesson.id) {
            errors.push(`card "${cb.card.id}" lessonId не совпадает с ${lb.lesson.id}`);
          }
        }
        // Проверка: card.id → courseId
        for (const cb of sb.cards) {
          if (cb.card.courseId !== v2.course.id) {
            errors.push(`card "${cb.card.id}" courseId не совпадает с ${v2.course.id}`);
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
