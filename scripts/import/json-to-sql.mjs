#!/usr/bin/env node

/**
 * Конвертация JSON из public/data/ в SQL INSERT-скрипт (BIGINT/SERIAL).
 * Schema: app_data (backend Liquibase).
 * Использует существующие language_pair_id из БД (39-76).
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

// ─── Language pair ID mapping из БД (Liquibase) ────────────────────────────

const LANGUAGE_PAIR_IDS = {
  'ru-en': 39, 'ru-zh': 40, 'ru-ja': 41, 'ru-ko': 42, 'ru-es': 43,
  'ru-perl': 44, 'ru-cplus': 45, 'ru-java': 46, 'ru-haskell': 47,
  'en-ru': 48, 'en-zh': 49, 'en-ja': 50, 'en-ko': 51, 'en-es': 52,
  'zh-ru': 53, 'zh-en': 54, 'zh-ja': 55, 'zh-ko': 56, 'zh-es': 57,
  'ja-ru': 58, 'ja-en': 59, 'ja-zh': 60, 'ja-ko': 61, 'ja-es': 62,
  'ko-ru': 63, 'ko-en': 64, 'ko-zh': 65, 'ko-ja': 66, 'ko-es': 67,
  'es-ru': 68, 'es-en': 69, 'es-zh': 70, 'es-ja': 71, 'es-ko': 72,
  'perl-ru': 73, 'cplus-ru': 74, 'java-ru': 75, 'haskell-ru': 76,
};

// ─── ID mapping: string ID → sequential BIGINT ──────────────────────────────

const idCache = new Map();
let nextId = 1;

function stringToId(str) {
  if (!idCache.has(str)) {
    idCache.set(str, nextId++);
  }
  return idCache.get(str);
}

const SYSTEM_USER_ID = 1;

// ─── Helpers ───────────────────────────────────────────────────────────────

function sqlBigInt(n) {
  if (n === null || n === undefined) return 'NULL';
  return String(n);
}

function sqlString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function getLanguagePairId(known, learning) {
  const key = `${known}-${learning}`;
  return LANGUAGE_PAIR_IDS[key] || null;
}

// ─── Pre-scan: build course → program → lesson mapping ─────────────────────

async function buildCourseStructure(manifest) {
  const courseMap = new Map();

  for (const file of manifest.courseFiles) {
    const filePath = path.join(ROOT, 'public/data', file);
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    if (!Array.isArray(data.courses)) continue;

    for (const course of data.courses) {
      const programStringId = `${course.id}-program`;
      const lessons = [];
      if (Array.isArray(data.lessons)) {
        for (const lesson of data.lessons) {
          if (course.lessonIds && course.lessonIds.includes(lesson.id)) {
            lessons.push(lesson.id);
          }
        }
      }
      courseMap.set(course.id, {
        programStringId,
        lessons,
        languagePair: course.languagePair,
      });
    }
  }
  return courseMap;
}

// ─── Transform functions ───────────────────────────────────────────────────

function transformCard(card, courseMap) {
  const id = stringToId(card.id);
  let difficulty = null;
  if (card.meta?.difficulty) {
    const diffMap = { beginner: 'BEGINNER', intermediate: 'INTERMEDIATE', advanced: 'ADVANCED' };
    difficulty = diffMap[card.meta.difficulty];
  }

  const dataObj = {};
  const systemFields = new Set(['id', 'kind', 'title', 'meta', 'courseId', 'lessonId', 'scenarioId']);
  for (const [key, value] of Object.entries(card)) {
    if (!systemFields.has(key)) dataObj[key] = value;
  }

  const tags = card.meta?.tags || [];
  const lessonId = card.lessonId ? stringToId(card.lessonId) : null;
  const scenarioId = card.scenarioId ? stringToId(card.scenarioId) : null;

  let programId = null, courseId = null, languagePairId = null;
  if (card.courseId && courseMap.has(card.courseId)) {
    const cd = courseMap.get(card.courseId);
    programId = stringToId(cd.programStringId);
    courseId = stringToId(card.courseId);
    if (cd.languagePair) {
      languagePairId = getLanguagePairId(cd.languagePair.known, cd.languagePair.learning);
    }
  }

  return {
    id, kind: card.kind.toUpperCase().replace(/-/g, '_'), title: card.title,
    dataJson: JSON.stringify(dataObj), tags: JSON.stringify(tags), difficulty,
    language_pair_id: languagePairId, course_id: courseId,
    program_id: programId, lesson_id: lessonId, scenario_id: scenarioId,
  };
}

function transformScenario(scenario, courseMap) {
  const id = stringToId(scenario.id);
  const cardSource = scenario.cardSource ? JSON.stringify(scenario.cardSource) : null;

  let lessonId = null, courseId = null, programId = null, languagePairId = null;
  if (scenario.courseId && courseMap.has(scenario.courseId)) {
    const cd = courseMap.get(scenario.courseId);
    if (cd.lessons.length > 0) lessonId = stringToId(cd.lessons[0]);
    courseId = stringToId(scenario.courseId);
    programId = stringToId(cd.programStringId);
    if (cd.languagePair) languagePairId = getLanguagePairId(cd.languagePair.known, cd.languagePair.learning);
  }
  if (scenario.languagePair) {
    languagePairId = getLanguagePairId(scenario.languagePair.known, scenario.languagePair.learning);
  }

  return {
    id, title: scenario.title, scenarioDescription: scenario.description || '',
    author_id: SYSTEM_USER_ID, cardSource, published: scenario.published,
    languagePairId, courseId, programId, lessonId,
  };
}

function transformCourse(course, courseMap) {
  const id = stringToId(course.id);
  const cd = courseMap.get(course.id);
  const programId = stringToId(cd.programStringId);
  const languagePairId = cd.languagePair
    ? getLanguagePairId(cd.languagePair.known, cd.languagePair.learning)
    : null;

  return {
    id, title: course.title, courseDescription: course.description || '',
    author_id: SYSTEM_USER_ID, languagePairId, published: course.published, programId,
  };
}

function transformLesson(lesson, programId, languagePair) {
  const id = stringToId(lesson.id);
  let prereqIds = [];
  if (lesson.prerequisiteLessonIds) {
    prereqIds = Array.isArray(lesson.prerequisiteLessonIds)
      ? lesson.prerequisiteLessonIds : [lesson.prerequisiteLessonIds];
  }
  const mappedPrereqs = prereqIds.map(p => stringToId(p));

  return {
    id, program_id: programId, title: lesson.title,
    lessonDescription: lesson.description || '',
    prerequisiteLessonIds: JSON.stringify(mappedPrereqs),
    lessonOrder: lesson.order || 0, languagePair,
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('-- LinguaCode: Data Import (app_data schema)');
  console.log('-- Generated: ' + new Date().toISOString());
  console.log('');

  // 1. System user
  console.log('-- ── 1. SYSTEM USER ──');
  console.log(`INSERT INTO app_data.users (id, display_name, email, password_hash, preferences, created_at, updated_at)
VALUES (${SYSTEM_USER_ID}, 'System', 'system@linguacode.local',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;
`);

  // 2. Clear
  console.log('-- ── 2. CLEAR EXISTING DATA ──');
  console.log('TRUNCATE app_data.cards, app_data.scenarios, app_data.lessons, app_data.programs, app_data.courses RESTART IDENTITY CASCADE;');
  console.log('');

  const manifest = JSON.parse(await fs.readFile(path.join(ROOT, 'public/data/content-manifest.json'), 'utf-8'));
  const courseMap = await buildCourseStructure(manifest);

  // 3. Courses
  console.log('-- ── 3. IMPORT COURSES ──');
  for (const file of manifest.courseFiles) {
    const data = JSON.parse(await fs.readFile(path.join(ROOT, 'public/data', file), 'utf-8'));
    if (!Array.isArray(data.courses)) continue;
    for (const course of data.courses) {
      const t = transformCourse(course, courseMap);
      console.log(`INSERT INTO app_data.courses (id, title, course_description, author_id, language_pair_id, published, created_at, updated_at)
VALUES (${t.id}, ${sqlString(t.title)}, ${sqlString(t.courseDescription)}, ${t.author_id},
  ${t.languagePairId ? sqlBigInt(t.languagePairId) : 'NULL'}, ${t.published}, NOW(), NOW());`);
      console.log(`INSERT INTO app_data.programs (id, title, course_id, author_id, published, program_description, created_at, updated_at)
VALUES (${t.programId}, ${sqlString(course.title + ' — Программа')}, ${t.id}, ${SYSTEM_USER_ID}, true,
  ${sqlString('Автоматически созданная программа')}, NOW(), NOW());`);

      const cd = courseMap.get(course.id);
      if (cd.lessons.length > 0) {
        for (const lid of cd.lessons) {
          const ld = data.lessons?.find(l => l.id === lid);
          if (ld) {
            const tl = transformLesson(ld, t.programId, cd.languagePair);
            const lpId = cd.languagePair ? getLanguagePairId(cd.languagePair.known, cd.languagePair.learning) : null;
            console.log(`INSERT INTO app_data.lessons (id, program_id, title, lesson_description, prerequisite_lesson_ids, lesson_order, language_pair_id, course_id, created_at, updated_at)
VALUES (${tl.id}, ${tl.program_id}, ${sqlString(tl.title)}, ${sqlString(tl.lessonDescription)},
  ${"'" + tl.prerequisiteLessonIds.replace(/'/g, "''") + "'::jsonb"}, ${tl.lessonOrder},
  ${lpId ? sqlBigInt(lpId) : 'NULL'}, ${t.id}, NOW(), NOW());`);
          }
        }
      }
    }
  }
  console.log('');

  // 4. Scenarios
  console.log('-- ── 4. IMPORT SCENARIOS ──');
  for (const file of manifest.scenarioFiles) {
    const data = JSON.parse(await fs.readFile(path.join(ROOT, 'public/data', file), 'utf-8'));
    if (!Array.isArray(data.scenarios)) continue;
    for (const s of data.scenarios) {
      const t = transformScenario(s, courseMap);
      console.log(`INSERT INTO app_data.scenarios (id, title, scenario_description, author_id, card_source, published, language_pair_id, course_id, program_id, lesson_id, created_at, updated_at)
VALUES (${t.id}, ${sqlString(t.title)}, ${sqlString(t.scenarioDescription)}, ${t.author_id},
  ${t.cardSource ? "'" + t.cardSource.replace(/'/g, "''") + "'::jsonb" : 'NULL'}, ${t.published},
  ${t.languagePairId ? sqlBigInt(t.languagePairId) : 'NULL'},
  ${t.courseId ? sqlBigInt(t.courseId) : 'NULL'}, ${t.programId ? sqlBigInt(t.programId) : 'NULL'},
  ${t.lessonId ? sqlBigInt(t.lessonId) : 'NULL'}, NOW(), NOW());`);
    }
  }
  console.log('');

  // 5. Cards
  console.log('-- ── 5. IMPORT CARDS ──');
  for (const file of manifest.cardFiles) {
    const data = JSON.parse(await fs.readFile(path.join(ROOT, 'public/data', file), 'utf-8'));
    if (!Array.isArray(data.cards)) continue;
    for (const card of data.cards) {
      const t = transformCard(card, courseMap);
      console.log(`INSERT INTO app_data.cards (id, kind, title, data_json, tags, difficulty, language_pair_id, course_id, program_id, lesson_id, scenario_id, created_at, updated_at)
VALUES (${t.id}, ${sqlString(t.kind)}, ${sqlString(t.title)},
  ${"'" + t.dataJson.replace(/'/g, "''") + "'"}, ${"'" + t.tags.replace(/'/g, "''") + "'"},
  ${t.difficulty ? sqlString(t.difficulty) : 'NULL'},
  ${t.language_pair_id ? sqlBigInt(t.language_pair_id) : 'NULL'},
  ${t.course_id ? sqlBigInt(t.course_id) : 'NULL'}, ${t.program_id ? sqlBigInt(t.program_id) : 'NULL'},
  ${t.lesson_id ? sqlBigInt(t.lesson_id) : 'NULL'}, ${t.scenario_id ? sqlBigInt(t.scenario_id) : 'NULL'},
  NOW(), NOW());`);
    }
  }

  console.log('-- Import complete');
}

main().catch((err) => { console.error('Error:', err.message); process.exit(1); });
