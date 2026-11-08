/**
 * transform-courses.mjs
 *
 * Transforms flat mock data into nested course files:
 *   courses → programs → lessons → scenarios → cards
 *
 * Each course gets its own file.
 * Card IDs are preserved even when card objects are missing (data integrity).
 *
 * Input:
 *   - Course files (courses + lessons arrays)
 *   - Scenario files (scenarios with cardIds)
 *   - Card files (cards)
 *
 * Output:
 *   - One nested JSON file per course:
 *       public/data/<scope>/courses/<courseId>.json
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DATA_ROOT = join(PROJECT_ROOT, 'public', 'data');

// ─── Helpers ───────────────────────────────────────────────────────────────

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function normalizePrereqs(ids) {
  if (Array.isArray(ids)) return ids;
  if (typeof ids === 'string') return ids.length > 0 ? [ids] : [];
  return [];
}

// ─── Step 1: Load all card files → Map<cardId, card> ──────────────────────

const cardFiles = [
  { path: 'demo/cards/demo-cards.json', scope: 'demo' },
  { path: 'chinese/cards/radicals-course-cards.json', scope: 'chinese' },
];

const allCards = new Map();

for (const { path: cardFile } of cardFiles) {
  const full = join(DATA_ROOT, cardFile);
  if (!existsSync(full)) {
    console.warn(`[WARN] Card file not found: ${cardFile}`);
    continue;
  }
  const data = readJson(full);
  const cards = data.cards || [];
  for (const card of cards) {
    allCards.set(card.id, card);
  }
  console.log(`[OK] Cards: ${cardFile} → ${cards.length} cards`);
}

console.log(`\nTotal cards loaded: ${allCards.size}`);

// ─── Step 2: Load all scenario files → Map<scenarioId, scenario> ───────────

// Standard scenario files (bundled)
const bundledScenarioFiles = [
  { path: 'demo/scenarios/demo-scenarios.json', scope: 'demo' },
  { path: 'chinese/scenarios/radicals-scenarios.json', scope: 'chinese' },
  { path: 'perl/scenarios/perl-interview-scenarios.json', scope: 'perl' },
  { path: 'perl/scenarios/perl-db-scenarios.json', scope: 'perl' },
];

const allScenarios = new Map();

for (const { path: scenFile } of bundledScenarioFiles) {
  const full = join(DATA_ROOT, scenFile);
  if (!existsSync(full)) {
    console.warn(`[WARN] Scenario file not found: ${scenFile}`);
    continue;
  }
  const data = readJson(full);
  const scenarios = data.scenarios || [];
  for (const scen of scenarios) {
    allScenarios.set(scen.id, scen);
  }
  console.log(`[OK] Scenarios: ${scenFile} → ${scenarios.length} scenarios`);
}

// ─── Step 2b: Load individual CPP scenario files ──────────────────────────

const cppScenariosDir = join(DATA_ROOT, 'cpp', 'scenarios');
if (existsSync(cppScenariosDir)) {
  const cppFiles = readdirSync(cppScenariosDir);
  let cppCount = 0;
  for (const file of cppFiles) {
    if (!file.endsWith('.json')) continue;
    const full = join(cppScenariosDir, file);
    try {
      const data = readJson(full);
      // Individual scenario files may have { "scenario": {...} } or { "scenarios": [...] }
      const scenarios = data.scenario ? [data.scenario] : (data.scenarios || []);
      for (const scen of scenarios) {
        if (scen.id) {
          allScenarios.set(scen.id, scen);
          cppCount++;
        }
      }
    } catch {
      // skip invalid files
    }
  }
  if (cppCount > 0) {
    console.log(`[OK] CPP scenarios (individual files): ${cppCount} scenarios`);
  }
}

console.log(`\nTotal scenarios loaded: ${allScenarios.size}`);

// ─── Step 3: Process each course ──────────────────────────────────────────

const courseFiles = [
  {
    path: 'demo/courses/demo-courses.json',
    scope: 'demo',
  },
  {
    path: 'chinese/courses/radicals-214-course.json',
    scope: 'chinese',
  },
  {
    path: 'perl/courses/perl-interview-course.json',
    scope: 'perl',
  },
  {
    path: 'perl/courses/perl-db-course.json',
    scope: 'perl',
  },
  {
    path: 'cpp/courses/cpp-complete.course.json',
    scope: 'cpp',
  },
];

const results = [];

for (const { path: courseFile, scope } of courseFiles) {
  const full = join(DATA_ROOT, courseFile);
  if (!existsSync(full)) {
    console.warn(`[WARN] Course file not found: ${courseFile}`);
    continue;
  }

  const data = readJson(full);
  const courses = data.courses || [];
  const lessonsFlat = data.lessons || [];

  for (const course of courses) {
    const courseId = course.id;
    const lessonIds = course.lessonIds || [];

    // Build lesson lookup for this course
    const courseLessons = lessonsFlat
      .filter((l) => l.courseId === courseId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Build nested structure: programs → lessons → scenarios → cards
    const nestedLessons = courseLessons.map((lesson) => {
      const lessonScenarios = (lesson.scenarioIds || [])
        .map((sid) => {
          const scen = allScenarios.get(sid);
          if (!scen) return null;

          // Build cards for this scenario
          const scenCardIds = scen.cardSource?.cardIds || [];
          const scenCards = [];
          const scenMissingCards = [];
          for (const cid of scenCardIds) {
            const card = allCards.get(cid);
            if (card) {
              scenCards.push(card);
            } else {
              scenMissingCards.push(cid);
            }
          }

          // Include cardIds even when card objects are missing (data integrity)
          const nestedScen = {
            id: scen.id,
            title: scen.title,
            description: scen.description,
            order: 0,
            languagePair: scen.languagePair || course.languagePair,
            published: scen.published ?? true,
            cards: scenCards,
          };

          // If there are missing cards, include their IDs as references
          if (scenMissingCards.length > 0) {
            nestedScen._cardIds = scenMissingCards;
          }

          return nestedScen;
        })
        .filter(Boolean);

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order ?? 0,
        prerequisiteLessonIds: normalizePrereqs(lesson.prerequisiteLessonIds),
        scenarios: lessonScenarios,
      };
    });

    // Collect all card info for this course
    let totalCardsResolved = 0;
    let totalMissingCardIds = 0;
    for (const lesson of nestedLessons) {
      for (const scen of lesson.scenarios) {
        totalCardsResolved += scen.cards.length;
        if (scen._cardIds) {
          totalMissingCardIds += scen._cardIds.length;
        }
      }
    }

    const nestedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      languagePair: course.languagePair,
      practiceSettings: course.practiceSettings || null,
      published: course.published ?? true,
      authoring: course.authoring || null,
      updatedAt: course.updatedAt || new Date().toISOString(),
      programs: [
        {
          id: `${course.id}-program`,
          title: course.title,
          description: course.description,
          order: 0,
          prerequisiteProgramIds: [],
          lessons: nestedLessons,
        },
      ],
    };

    // Write individual file per course
    const scopeDir = join(DATA_ROOT, scope, 'courses');
    const outputPath = join(scopeDir, `${courseId}.json`);

    writeJson(outputPath, nestedCourse);

    results.push({
      course: courseId,
      output: `${courseId}.json`,
      lessons: nestedLessons.length,
      scenarios: nestedLessons.reduce((sum, l) => sum + l.scenarios.length, 0),
      cards: totalCardsResolved,
      missingCards: totalMissingCardIds,
    });

    console.log(
      `\n[OK] Course: ${courseId}`
    );
    console.log(`    Output: ${courseId}.json`);
    console.log(
      `    Lessons: ${nestedLessons.length}, Scenarios: ${nestedLessons.reduce((s, l) => s + l.scenarios.length, 0)}, Cards: ${totalCardsResolved}`
    );
    if (totalMissingCardIds > 0) {
      console.log(`    Missing cards: ${totalMissingCardIds} (IDs preserved in _cardIds)`);
    }
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(70));
console.log('TRANSFORMATION SUMMARY');
console.log('='.repeat(70));
console.log(`Cards loaded:       ${allCards.size}`);
console.log(`Scenarios loaded:   ${allScenarios.size}`);
console.log(`Courses processed:  ${results.length}`);
console.log('-'.repeat(70));

for (const r of results) {
  console.log(
    `  ${r.course.padEnd(40)} lessons=${String(r.lessons).padStart(3)}  scenarios=${String(r.scenarios).padStart(3)}  cards=${String(r.cards).padStart(4)}  missing=${String(r.missingCards).padStart(3)}`
  );
}

console.log('='.repeat(70));

let totalMissing = results.reduce((s, r) => s + r.missingCards, 0);
if (totalMissing > 0) {
  console.log(`\n[INFO] ${totalMissing} card IDs preserved as references (_cardIds) — card objects not found in card files.`);
  console.log('       These IDs are in the nested structure and will be resolved when card files are added.');
} else {
  console.log('\n[OK] All scenario card IDs resolved to card objects.');
}
