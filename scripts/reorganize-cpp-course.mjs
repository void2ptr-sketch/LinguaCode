#!/usr/bin/env node
/**
 * Reorganize C++ Complete Course: integrate ALL cards from public/data/cpp/cards
 * into the course, grouped into scenarios of 20 cards, organized by lessons.
 *
 * Steps:
 *  1. Create 31 new canonical card files + scenario files from 619 orphan
 *     `*.scenario.cards.json` cards (30 scenarios x 20 cards + 1 x 19 cards).
 *  2. Fix legacy scenario files (cpp.basics.structs.01/02) to canonical format.
 *  3. Update lessonId linkage in orphan `cpp.*.NN` card/scenario files.
 *  4. Extend the course file: add scenarios to existing lessons + 3 new lessons.
 *  5. Update content-manifest.json (add files, bump version).
 *
 * SAFETY: pre-flight check rejects scenario names that already exist in the
 * manifest (prevents overwriting existing canonical content).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CARD_DIR = path.join(ROOT, 'public/data/cpp/cards');
const SCENARIO_DIR = path.join(ROOT, 'public/data/cpp/scenarios');
const COURSE_FILE = path.join(ROOT, 'public/data/cpp/courses/cpp-complete.course.json');
const MANIFEST_FILE = path.join(ROOT, 'public/data/content-manifest.json');

const NOW = new Date().toISOString();
const COURSE_ID = 'course-cpp-complete';

// ---------------------------------------------------------------------------
// 1. Scenario plan: 31 new scenarios from orphan `*.scenario` card files.
//    `sources` = [{ file, indices? }] — indices select a subset of cards.
// ---------------------------------------------------------------------------
const SCENARIO_PLAN = [
  {
    name: 'cpp.advanced.ai-programming.01',
    title: 'ИИ-программирование на C++',
    lessonId: 'lesson-cpp-advanced-advanced',
    sources: [
      { file: 'advanced.ai.programming.scenario.cards.json' },
      { file: 'advanced.ai.programming2.scenario.cards.json' },
      { file: 'advanced.ai.programming3.scenario.cards.json' },
      { file: 'advanced.ai.programming4.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.build-systems.01',
    title: 'Системы сборки и CI/CD',
    lessonId: 'lesson-cpp-advanced-engineering',
    sources: [
      { file: 'advanced.ci.cd.scenario.cards.json' },
      { file: 'advanced.cmake.build.scenario.cards.json' },
      { file: 'advanced.compiler.internals.scenario.cards.json' },
      { file: 'advanced.compiler.internals2.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.compiler-internals.01',
    title: 'Внутренности компилятора и концепции',
    lessonId: 'lesson-cpp-advanced-engineering',
    sources: [
      { file: 'advanced.compiler.internals3.scenario.cards.json' },
      { file: 'advanced.compiler.internals4.scenario.cards.json' },
      { file: 'advanced.concepts.scenario.cards.json' },
      { file: 'advanced.constexpr.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.concurrency-patterns.01',
    title: 'Паттерны конкурентности и параллелизм',
    lessonId: 'lesson-cpp-advanced-concurrency',
    sources: [
      { file: 'advanced.concurrency.patterns.scenario.cards.json' },
      { file: 'advanced.concurrency.patterns2.scenario.cards.json' },
      { file: 'advanced.parallel.programming.scenario.cards.json' },
      { file: 'advanced.parallel.programming2.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.coroutines-modern.01',
    title: 'Корутины, метапрограммирование и современный C++',
    lessonId: 'lesson-cpp-advanced-modern',
    sources: [
      { file: 'advanced.coroutines.scenario.cards.json' },
      { file: 'advanced.modern.cpp.scenario.cards.json' },
      { file: 'advanced.meta.programming.scenario.cards.json' },
      { file: 'advanced.templates.advanced.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.cross-platform-extra.01',
    title: 'Кроссплатформенная разработка',
    lessonId: 'lesson-cpp-advanced-apps',
    sources: [
      { file: 'advanced.cross.platform.scenario.cards.json' },
      { file: 'advanced.cross.platform2.scenario.cards.json' },
      { file: 'advanced.cross.platform3.scenario.cards.json' },
      { file: 'advanced.cross.platform4.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.database-networking.01',
    title: 'Базы данных и сетевые приложения',
    lessonId: 'lesson-cpp-advanced-apps',
    sources: [
      { file: 'advanced.database.programming.scenario.cards.json' },
      { file: 'advanced.database.programming2.scenario.cards.json' },
      { file: 'advanced.database.programming3.scenario.cards.json' },
      { file: 'advanced.network.programming.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.networking-debug.01',
    title: 'Сети, отладка и паттерны проектирования',
    lessonId: 'lesson-cpp-advanced-apps',
    sources: [
      { file: 'advanced.network.programming2.scenario.cards.json' },
      { file: 'advanced.network.programming3.scenario.cards.json' },
      { file: 'advanced.debugging.scenario.cards.json' },
      { file: 'advanced.design.patterns.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.error-handling-extra.01',
    title: 'Обработка ошибок, исключения и управление памятью',
    lessonId: 'lesson-cpp-advanced-memory',
    sources: [
      { file: 'advanced.error.handling.advanced.scenario.cards.json' },
      { file: 'advanced.error.handling.advanced2.scenario.cards.json' },
      { file: 'advanced.exception.handling.scenario.cards.json' },
      { file: 'advanced.memory.management.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.memory-model-extra.01',
    title: 'Модель памяти, препроцессор и SIMD-оптимизация',
    lessonId: 'lesson-cpp-advanced-memory',
    sources: [
      { file: 'advanced.memory.model.scenario.cards.json' },
      { file: 'advanced.memory.model2.scenario.cards.json' },
      { file: 'advanced.macros.preprocessor.scenario.cards.json' },
      { file: 'advanced.simd.optimization.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.embedded-systems.01',
    title: 'Встраиваемые системы',
    lessonId: 'lesson-cpp-advanced-systems',
    sources: [
      { file: 'advanced.embedded.systems.scenario.cards.json' },
      { file: 'advanced.embedded.systems2.scenario.cards.json' },
      { file: 'advanced.embedded.systems3.scenario.cards.json' },
      { file: 'advanced.embedded.systems4.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.game-development.01',
    title: 'Разработка игр на C++',
    lessonId: 'lesson-cpp-advanced-apps',
    sources: [
      { file: 'advanced.game.development.scenario.cards.json' },
      { file: 'advanced.game.development2.scenario.cards.json' },
      { file: 'advanced.game.development3.scenario.cards.json' },
      { file: 'advanced.game.development4.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.graphics-extra.01',
    title: 'Графика и рендеринг',
    lessonId: 'lesson-cpp-advanced-apps',
    sources: [
      { file: 'advanced.graphics.programming.scenario.cards.json' },
      { file: 'advanced.graphics.programming2.scenario.cards.json' },
      { file: 'advanced.graphics.programming3.scenario.cards.json' },
      { file: 'advanced.graphics.programming4.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.performance-extra.01',
    title: 'Продвинутая производительность',
    lessonId: 'lesson-cpp-advanced-systems',
    sources: [
      { file: 'advanced.performance.advanced.scenario.cards.json' },
      { file: 'advanced.performance.advanced2.scenario.cards.json' },
      { file: 'advanced.performance.advanced3.scenario.cards.json' },
      { file: 'advanced.performance.advanced4.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.advanced.security-testing.01',
    title: 'Безопасность и тестирование',
    lessonId: 'lesson-cpp-advanced-engineering',
    sources: [
      { file: 'advanced.security.programming.scenario.cards.json' },
      { file: 'advanced.security.programming2.scenario.cards.json' },
      { file: 'advanced.security.programming3.scenario.cards.json' },
      { file: 'advanced.testing.advanced.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.basics.intro-extra.01',
    title: 'Введение: комментарии и компиляция',
    lessonId: 'lesson-cpp-basics-intro',
    sources: [
      { file: 'basics.intro.comments.scenario.cards.json' },
      { file: 'basics.intro.compilation.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.basics.intro-extra.02',
    title: 'Введение: настройка компилятора и история',
    lessonId: 'lesson-cpp-basics-intro',
    sources: [
      { file: 'basics.intro.compiler.setup.scenario.cards.json' },
      { file: 'basics.intro.history.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.basics.intro-extra.03',
    title: 'Введение: структура программы и операторы',
    lessonId: 'lesson-cpp-basics-intro',
    sources: [
      { file: 'basics.intro.main.structure.scenario.cards.json' },
      { file: 'basics.operators.expressions.scenario.cards.json' },
      { file: 'basics.performance.scenario.cards.json', indices: [0] },
    ],
  },
  {
    name: 'cpp.basics.types-extra.01',
    title: 'Типы данных: практика',
    lessonId: 'lesson-cpp-basics-types',
    sources: [
      { file: 'basics.types.bool.scenario.cards.json' },
      { file: 'basics.types.casting.scenario.cards.json' },
      { file: 'basics.types.char.string.scenario.cards.json' },
      { file: 'basics.types.floating.scenario.cards.json', indices: [0, 1, 2] },
    ],
  },
  {
    name: 'cpp.basics.control-functions.01',
    title: 'Управление потоком: практика',
    lessonId: 'lesson-cpp-basics-control-flow',
    sources: [
      { file: 'basics.control.break.continue.scenario.cards.json' },
      { file: 'basics.control.for.scenario.cards.json' },
      { file: 'basics.control.switch.scenario.cards.json' },
      { file: 'basics.control.while.scenario.cards.json' },
      { file: 'basics.functions.parameters.scenario.cards.json', indices: [0, 1, 2] },
    ],
  },
  {
    name: 'cpp.basics.functions-extra.01',
    title: 'Функции: практика',
    lessonId: 'lesson-cpp-basics-functions',
    sources: [
      { file: 'basics.functions.inline.macros.scenario.cards.json' },
      { file: 'basics.functions.overload.scenario.cards.json' },
      { file: 'basics.functions.recursion.scenario.cards.json' },
      { file: 'basics.functions.parameters.scenario.cards.json', indices: [3, 4, 5, 6] },
    ],
  },
  {
    name: 'cpp.basics.arrays-extra.01',
    title: 'Массивы и векторы: практика',
    lessonId: 'lesson-cpp-basics-arrays-strings',
    sources: [
      { file: 'basics.arrays.1d.scenario.cards.json' },
      { file: 'basics.arrays.2d.scenario.cards.json' },
      { file: 'basics.arrays.vectors.scenario.cards.json' },
      { file: 'basics.vectors.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.basics.strings-extra.01',
    title: 'Строки: практика',
    lessonId: 'lesson-cpp-basics-strings',
    sources: [
      { file: 'basics.strings.scenario.cards.json' },
      { file: 'basics.strings.c.style.scenario.cards.json' },
      { file: 'basics.strings.operations.scenario.cards.json', indices: [0, 1, 2, 3] },
    ],
  },
  {
    name: 'cpp.basics.strings-io.01',
    title: 'Строки и ввод-вывод',
    lessonId: 'lesson-cpp-basics-strings',
    sources: [
      { file: 'basics.strings.std.string.scenario.cards.json' },
      { file: 'basics.strings.streams.scenario.cards.json' },
      { file: 'basics.io.scenario.cards.json' },
      { file: 'basics.io.files.scenario.cards.json' },
      { file: 'basics.files.scenario.cards.json', indices: [0, 1, 2] },
    ],
  },
  {
    name: 'cpp.basics.exceptions-algorithms.01',
    title: 'Исключения, алгоритмы и многопоточность',
    lessonId: 'lesson-cpp-basics-exceptions',
    sources: [
      { file: 'basics.exceptions.scenario.cards.json' },
      { file: 'basics.exceptions.errors.scenario.cards.json' },
      { file: 'basics.algorithms.scenario.cards.json' },
      { file: 'basics.multithreading.async.scenario.cards.json' },
      { file: 'basics.network.programming.scenario.cards.json', indices: [0, 1] },
    ],
  },
  {
    name: 'cpp.basics-review.01',
    title: 'Обзор основ C++',
    lessonId: 'lesson-cpp-mixed-topics',
    sources: [
      { file: 'basics.performance.scenario.cards.json', indices: [1, 2, 3] },
      { file: 'basics.types.floating.scenario.cards.json', indices: [3, 4] },
      { file: 'basics.strings.operations.scenario.cards.json', indices: [4, 5] },
      { file: 'basics.files.scenario.cards.json', indices: [3] },
      { file: 'basics.network.programming.scenario.cards.json', indices: [2, 3] },
      { file: 'basics.streams.files.scenario.cards.json' },
      { file: 'basics.system.programming.scenario.cards.json' },
      { file: 'oop.templates.intro.scenario.cards.json', indices: [2, 3] },
    ],
  },
  {
    name: 'cpp.oop.classes-extra.01',
    title: 'Классы, конструкторы и умные указатели',
    lessonId: 'lesson-cpp-oop-fundamentals',
    sources: [
      { file: 'oop.classes.intro.scenario.cards.json' },
      { file: 'oop.constructors.destructors.scenario.cards.json' },
      { file: 'oop.rules.of.five.scenario.cards.json' },
      { file: 'oop.smart.pointers.scenario.cards.json' },
    ],
  },
  {
    name: 'cpp.oop.inheritance-extra.01',
    title: 'Наследование и полиморфизм: практика',
    lessonId: 'lesson-cpp-oop-inheritance',
    sources: [
      { file: 'oop.inheritance.scenario.cards.json' },
      { file: 'oop.polymorphism.scenario.cards.json' },
      { file: 'oop.interfaces.abstract.scenario.cards.json' },
      { file: 'oop.exceptions.oop.scenario.cards.json' },
      { file: 'oop.templates.intro.scenario.cards.json', indices: [0, 1] },
    ],
  },
  {
    name: 'cpp.stl.containers-extra.01',
    title: 'Контейнеры STL: практика',
    lessonId: 'lesson-cpp-advanced-stl',
    sources: [
      { file: 'stl.containers.map.scenario.cards.json' },
      { file: 'stl.containers.set.scenario.cards.json' },
      { file: 'stl.containers.unordered.map.scenario.cards.json' },
      { file: 'stl.containers.algorithms.scenario.cards.json' },
      { file: 'stl.iterators.scenario.cards.json', indices: [0, 1, 2] },
    ],
  },
  {
    name: 'cpp.stl.utilities-extra.01',
    title: 'Утилиты STL: chrono, filesystem, optional, regex',
    lessonId: 'lesson-cpp-advanced-stl',
    sources: [
      { file: 'stl.chrono.scenario.cards.json' },
      { file: 'stl.filesystem.scenario.cards.json' },
      { file: 'stl.optional.variant.scenario.cards.json' },
      { file: 'stl.regex.scenario.cards.json' },
      { file: 'stl.strings.stl.scenario.cards.json', indices: [0, 1] },
    ],
  },
  {
    name: 'cpp.mixed-topics.01',
    title: 'Смешанные темы: тестирование, шаблоны и STL',
    lessonId: 'lesson-cpp-mixed-topics',
    sources: [
      { file: 'advanced.testing.advanced2.scenario.cards.json' },
      { file: 'advanced.testing.scenario.cards.json' },
      { file: 'oop.templates.specialization.scenario.cards.json' },
      { file: 'oop.templates.intro.scenario.cards.json', indices: [4] },
      { file: 'stl.iterators.scenario.cards.json', indices: [3] },
      { file: 'stl.strings.stl.scenario.cards.json', indices: [2, 3, 4] },
    ],
  },
];

// ---------------------------------------------------------------------------
// 2. Lesson extensions: existing lessons get new scenarioIds appended.
// ---------------------------------------------------------------------------
const LESSON_EXTENSIONS = {
  'lesson-cpp-basics-intro': ['cpp.basics.intro-extra.01.scenario', 'cpp.basics.intro-extra.02.scenario', 'cpp.basics.intro-extra.03.scenario'],
  'lesson-cpp-basics-types': ['cpp.basics.types-extra.01.scenario'],
  'lesson-cpp-basics-control-flow': ['cpp.basics.control-functions.01.scenario'],
  'lesson-cpp-basics-functions': ['cpp.basics.functions-extra.01.scenario'],
  'lesson-cpp-basics-arrays-strings': ['cpp.basics.arrays-extra.01.scenario', 'cpp.basics.arrays.01.scenario', 'cpp.basics.arrays.02.scenario'],
  'lesson-cpp-basics-strings': ['cpp.basics.strings-extra.01.scenario', 'cpp.basics.strings-io.01.scenario', 'cpp.strings-streams.01.scenario', 'cpp.strings-streams.02.scenario'],
  'lesson-cpp-basics-structs': ['cpp.basics.structs.01.scenario', 'cpp.basics.structs.02.scenario'],
  'lesson-cpp-basics-exceptions': ['cpp.basics.exceptions-algorithms.01.scenario', 'cpp.exceptions-errors.01.scenario', 'cpp.exceptions-errors.02.scenario'],
  'lesson-cpp-basics-file-io': ['cpp.io-files.01.scenario', 'cpp.io-files.02.scenario'],
  'lesson-cpp-basics-classes': ['cpp.classes-objects.01.scenario', 'cpp.classes-objects.02.scenario'],
  'lesson-cpp-basics-pointers-references': ['cpp.pointers-references.01.scenario', 'cpp.pointers-references.02.scenario'],
  'lesson-cpp-basics-streams': ['cpp.streams-files.01.scenario', 'cpp.streams-files.02.scenario'],
  'lesson-cpp-basics-multithreading': ['cpp.multithreading-async.01.scenario', 'cpp.multithreading-async.02.scenario'],
  'lesson-cpp-basics-networking': ['cpp.network-programming.01.scenario', 'cpp.network-programming.02.scenario'],
  'lesson-cpp-basics-systems': ['cpp.system-programming.01.scenario', 'cpp.system-programming.02.scenario'],
  'lesson-cpp-basics-templates': ['cpp.templates-intro.01.scenario', 'cpp.templates-intro.02.scenario'],
  'lesson-cpp-oop-fundamentals': ['cpp.oop.classes-extra.01.scenario'],
  'lesson-cpp-oop-inheritance': ['cpp.oop.inheritance-extra.01.scenario'],
  'lesson-cpp-advanced-memory': ['cpp.advanced.error-handling-extra.01.scenario', 'cpp.advanced.memory-model-extra.01.scenario'],
  'lesson-cpp-advanced-modern': ['cpp.advanced.coroutines-modern.01.scenario'],
  'lesson-cpp-advanced-concurrency': ['cpp.advanced.concurrency-patterns.01.scenario'],
  'lesson-cpp-advanced-stl': ['cpp.stl.containers-extra.01.scenario', 'cpp.stl.utilities-extra.01.scenario'],
  'lesson-cpp-advanced-systems': ['cpp.advanced.embedded-systems.01.scenario', 'cpp.advanced.performance-extra.01.scenario'],
  'lesson-cpp-advanced-apps': ['cpp.advanced.cross-platform-extra.01.scenario', 'cpp.advanced.database-networking.01.scenario', 'cpp.advanced.networking-debug.01.scenario', 'cpp.advanced.game-development.01.scenario', 'cpp.advanced.graphics-extra.01.scenario'],
  'lesson-cpp-advanced-engineering': ['cpp.advanced.build-systems.01.scenario', 'cpp.advanced.compiler-internals.01.scenario', 'cpp.advanced.security-testing.01.scenario'],
  'lesson-cpp-advanced-advanced': ['cpp.advanced.ai-programming.01.scenario'],
};

// ---------------------------------------------------------------------------
// 3. New lessons.
// ---------------------------------------------------------------------------
const NEW_LESSONS = [
  {
    id: 'lesson-cpp-basics-performance-1',
    title: 'Урок 34: Производительность (часть 1)',
    description: '10 сценариев: basics.performance.01–10 — оптимизация и производительность C++ (часть 1).',
    scenarioIds: Array.from({ length: 10 }, (_, i) => `cpp.basics.performance.${String(i + 1).padStart(2, '0')}.scenario`),
    prerequisiteLessonIds: ['lesson-cpp-basics-algorithms'],
    order: 33,
  },
  {
    id: 'lesson-cpp-basics-performance-2',
    title: 'Урок 35: Производительность (часть 2)',
    description: '10 сценариев: basics.performance.11–20 — оптимизация и производительность C++ (часть 2).',
    scenarioIds: Array.from({ length: 10 }, (_, i) => `cpp.basics.performance.${String(i + 11).padStart(2, '0')}.scenario`),
    prerequisiteLessonIds: ['lesson-cpp-basics-performance-1'],
    order: 34,
  },
  {
    id: 'lesson-cpp-mixed-topics',
    title: 'Урок 36: Обзор и смешанные темы',
    description: '2 сценария: basics-review.01, mixed-topics.01 — обзор основ и смешанные продвинутые темы.',
    scenarioIds: ['cpp.basics-review.01.scenario', 'cpp.mixed-topics.01.scenario'],
    prerequisiteLessonIds: ['lesson-cpp-advanced-advanced'],
    order: 35,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function loadCards(file) {
  const data = readJson(path.join(CARD_DIR, file));
  return data.cards || [];
}

// Build scenarioId -> lessonId map (for updating orphan cpp.*.NN files).
const scenarioToLesson = new Map();
for (const [lessonId, scenarioIds] of Object.entries(LESSON_EXTENSIONS)) {
  for (const sid of scenarioIds) scenarioToLesson.set(sid, lessonId);
}
for (const lesson of NEW_LESSONS) {
  for (const sid of lesson.scenarioIds) scenarioToLesson.set(sid, lesson.id);
}

// ---------------------------------------------------------------------------
// Pre-flight: reject scenario names that already exist in the manifest
// (prevents overwriting existing canonical content).
// ---------------------------------------------------------------------------
{
  const manifest = readJson(MANIFEST_FILE);
  const existing = new Set([...manifest.cardFiles, ...manifest.scenarioFiles]);
  for (const plan of SCENARIO_PLAN) {
    const cardPath = `/cpp/cards/${plan.name}.cards.json`;
    const scenarioPath = `/cpp/scenarios/${plan.name}.scenario.json`;
    if (existing.has(cardPath) || existing.has(scenarioPath)) {
      throw new Error(
        `Collision: ${plan.name} already exists in the manifest ` +
        `(card=${existing.has(cardPath)}, scenario=${existing.has(scenarioPath)}). ` +
        `Rename the scenario before re-running.`,
      );
    }
  }
  console.log(`Pre-flight OK: ${SCENARIO_PLAN.length} new scenario names are unique.`);
}

// ---------------------------------------------------------------------------
// Step 1: create 31 new card files + scenario files
// ---------------------------------------------------------------------------
const createdCardFiles = [];
const createdScenarioFiles = [];
const usedSourceCards = new Set(); // track original card ids to detect double-use

for (const plan of SCENARIO_PLAN) {
  const scenarioId = `${plan.name}.scenario`;
  const cards = [];
  for (const src of plan.sources) {
    const all = loadCards(src.file);
    const selected = src.indices ? src.indices.map((i) => all[i]) : all;
    for (const card of selected) {
      if (!card) throw new Error(`Missing card in ${src.file}`);
      if (usedSourceCards.has(card.id)) throw new Error(`Card ${card.id} used twice`);
      usedSourceCards.add(card.id);
      cards.push(card);
    }
  }
  if (cards.length !== 20 && cards.length !== 19) {
    throw new Error(`Scenario ${scenarioId} has ${cards.length} cards (expected 20 or 19)`);
  }

  // Re-ID cards to canonical format.
  const newCards = cards.map((card, i) => ({
    ...card,
    id: `${scenarioId}.card-${String(i + 1).padStart(2, '0')}`,
    scenarioId,
    lessonId: plan.lessonId,
    courseId: COURSE_ID,
  }));

  // Write card file.
  const cardFile = path.join(CARD_DIR, `${plan.name}.cards.json`);
  writeJson(cardFile, { cards: newCards });
  createdCardFiles.push(`/cpp/cards/${plan.name}.cards.json`);

  // Write scenario file.
  const scenarioFile = path.join(SCENARIO_DIR, `${plan.name}.scenario.json`);
  writeJson(scenarioFile, {
    scenarios: [
      {
        id: scenarioId,
        title: plan.title,
        description: `Сценарий: ${plan.title}`,
        order: 0,
        lessonId: plan.lessonId,
        courseId: COURSE_ID,
        cardCount: newCards.length,
        authoring: { status: 'materialized', updatedAt: NOW },
        languagePair: { known: 'ru', learning: 'cpp' },
        published: true,
        updatedAt: NOW,
        authorId: 'system',
        cardSource: {
          mode: 'snapshot',
          cardIds: newCards.map((c) => c.id),
          criteria: {},
          frozenAt: NOW,
        },
      },
    ],
  });
  createdScenarioFiles.push(`/cpp/scenarios/${plan.name}.scenario.json`);
  console.log(`Created ${plan.name} (${newCards.length} cards)`);
}

// ---------------------------------------------------------------------------
// Step 2: fix legacy scenario files (cpp.basics.structs.01/02)
// ---------------------------------------------------------------------------
for (const n of ['01', '02']) {
  const name = `cpp.basics.structs.${n}`;
  const cardFile = path.join(CARD_DIR, `${name}.cards.json`);
  const scenarioFile = path.join(SCENARIO_DIR, `${name}.scenario.json`);
  const cards = loadCards(`${name}.cards.json`);
  const scenarioId = `${name}.scenario`;
  writeJson(scenarioFile, {
    scenarios: [
      {
        id: scenarioId,
        title: n === '01' ? 'Структуры в C++' : 'Структуры в C++: практика',
        description: n === '01' ? 'Введение в структуры: объявление, инициализация, доступ к полям.' : 'Структуры: вложенные структуры, массивы структур, передача в функции.',
        order: 0,
        lessonId: 'lesson-cpp-basics-structs',
        courseId: COURSE_ID,
        cardCount: cards.length,
        authoring: { status: 'materialized', updatedAt: NOW },
        languagePair: { known: 'ru', learning: 'cpp' },
        published: true,
        updatedAt: NOW,
        authorId: 'system',
        cardSource: {
          mode: 'snapshot',
          cardIds: cards.map((c) => c.id),
          criteria: {},
          frozenAt: NOW,
        },
      },
    ],
  });
  console.log(`Fixed legacy scenario ${scenarioId}`);
}

// ---------------------------------------------------------------------------
// Step 3: update lessonId linkage in orphan cpp.*.NN card/scenario files
// ---------------------------------------------------------------------------
const orphanCppFiles = fs.readdirSync(CARD_DIR)
  .filter((f) => /^cpp\..*\.\d{2}\.cards\.json$/.test(f))
  .sort();

for (const f of orphanCppFiles) {
  const scenarioId = f.replace(/\.cards\.json$/, '.scenario');
  const lessonId = scenarioToLesson.get(scenarioId);
  if (!lessonId) {
    console.warn(`No lesson mapping for ${scenarioId} — skipping linkage update`);
    continue;
  }
  // Update card file lessonId.
  const cardFile = path.join(CARD_DIR, f);
  const data = readJson(cardFile);
  let changed = false;
  for (const card of data.cards || []) {
    if (card.lessonId !== lessonId) {
      card.lessonId = lessonId;
      changed = true;
    }
  }
  if (changed) writeJson(cardFile, data);

  // Update scenario file lessonId.
  const scenarioFile = path.join(SCENARIO_DIR, `${scenarioId}.json`);
  if (fs.existsSync(scenarioFile)) {
    const sdata = readJson(scenarioFile);
    const sc = sdata.scenarios && sdata.scenarios[0];
    if (sc && sc.lessonId !== lessonId) {
      sc.lessonId = lessonId;
      writeJson(scenarioFile, sdata);
    }
  }
}

// ---------------------------------------------------------------------------
// Step 4: update course file
// ---------------------------------------------------------------------------
const course = readJson(COURSE_FILE);
const lessonsById = new Map(course.lessons.map((l) => [l.id, l]));

// Extend existing lessons.
for (const [lessonId, scenarioIds] of Object.entries(LESSON_EXTENSIONS)) {
  const lesson = lessonsById.get(lessonId);
  if (!lesson) throw new Error(`Lesson not found: ${lessonId}`);
  for (const sid of scenarioIds) {
    if (!lesson.scenarioIds.includes(sid)) lesson.scenarioIds.push(sid);
  }
  lesson.description = `${lesson.scenarioIds.length} сценариев: ${lesson.scenarioIds.map((s) => s.replace(/\.scenario$/, '')).join(', ')}.`;
  lesson.updatedAt = NOW;
}

// Add new lessons.
for (const lesson of NEW_LESSONS) {
  if (lessonsById.has(lesson.id)) throw new Error(`Lesson already exists: ${lesson.id}`);
  course.lessons.push({ ...lesson, courseId: COURSE_ID, updatedAt: NOW });
  lessonsById.set(lesson.id, lesson);
}

// Update course lessonIds (append new lessons).
for (const lesson of NEW_LESSONS) {
  if (!course.courses[0].lessonIds.includes(lesson.id)) course.courses[0].lessonIds.push(lesson.id);
}
course.courses[0].updatedAt = NOW;

writeJson(COURSE_FILE, course);
console.log(`Course updated: ${course.lessons.length} lessons, ${course.courses[0].lessonIds.length} lessonIds`);

// ---------------------------------------------------------------------------
// Step 5: update manifest
// ---------------------------------------------------------------------------
const manifest = readJson(MANIFEST_FILE);

// Collect all orphan cpp.*.NN files that need manifest registration.
const orphanCppCardFiles = [];
const orphanCppScenarioFiles = [];
for (const f of orphanCppFiles) {
  const scenarioId = f.replace(/\.cards\.json$/, '.scenario');
  if (!scenarioToLesson.has(scenarioId)) continue; // already in course (arrays.01/02, structs.01/02)
  orphanCppCardFiles.push(`/cpp/cards/${f}`);
  orphanCppScenarioFiles.push(`/cpp/scenarios/${scenarioId}.json`);
}

const allCardFiles = [...manifest.cardFiles, ...createdCardFiles, ...orphanCppCardFiles];
const allScenarioFiles = [...manifest.scenarioFiles, ...createdScenarioFiles, ...orphanCppScenarioFiles];

manifest.cardFiles = [...new Set(allCardFiles)].sort();
manifest.scenarioFiles = [...new Set(allScenarioFiles)].sort();
manifest.version = (manifest.version || 0) + 1;

writeJson(MANIFEST_FILE, manifest);
console.log(`Manifest updated: version=${manifest.version}, cardFiles=${manifest.cardFiles.length}, scenarioFiles=${manifest.scenarioFiles.length}`);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('---');
console.log(`New card files: ${createdCardFiles.length}`);
console.log(`New scenario files: ${createdScenarioFiles.length}`);
console.log(`Orphan cpp.*.NN card files registered: ${orphanCppCardFiles.length}`);
console.log(`Orphan cpp.*.NN scenario files registered: ${orphanCppScenarioFiles.length}`);
console.log(`Total orphan *.scenario cards used: ${usedSourceCards.size}`);