#!/usr/bin/env node

/**
 * Конвертация JSON из public/data/ в SQL INSERT-скрипт (BIGINT/SERIAL).
 * Заполняет lesson_id в scenarios и program_id в cards.
 *
 * Чтение: public/data/content-manifest.json + все файлы
 * Вывод: SQL INSERT-оператории в stdout
 *
 * Использование:
 *   node scripts/json-to-sql.mjs > /tmp/import-data.sql
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── ID mapping: string ID → sequential BIGINT ──────────────────────────────

const idCache = new Map();
let nextId = 1;

function stringToId(str) {
  if (!idCache.has(str)) {
    idCache.set(str, nextId++);
  }
  return idCache.get(str);
}

// ─── System user ID ────────────────────────────────────────────────────────

const SYSTEM_USER_ID = 1;

// ─── Helper: escape SQL strings ───────────────────────────────────────────

function sqlString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

// ─── Pre-scan: build course → program → lesson mapping ─────────────────────

async function buildCourseStructure(manifest) {
  // Map: courseStringId → { programStringId, lessons: [lessonStringId, ...] }
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
      });
    }
  }

  return courseMap;
}

// ─── Transform card ───────────────────────────────────────────────────────

function transformCard(card, courseMap) {
  const id = stringToId(card.id);
  
  // Map difficulty
  let difficulty = null;
  if (card.meta?.difficulty) {
    const diffMap = {
      beginner: 'BEGINNER',
      intermediate: 'INTERMEDIATE',
      advanced: 'ADVANCED',
    };
    difficulty = diffMap[card.meta.difficulty];
  }

  // Build content JSON from card fields
  const contentObj = {};
  const systemFields = new Set(['id', 'kind', 'title', 'meta', 'courseId', 'lessonId', 'scenarioId']);
  for (const [key, value] of Object.entries(card)) {
    if (!systemFields.has(key)) {
      contentObj[key] = value;
    }
  }

  // Tags from meta
  const tags = card.meta?.tags || [];

  // BIGINT IDs for relations
  const lessonId = card.lessonId ? stringToId(card.lessonId) : null;
  const scenarioId = card.scenarioId ? stringToId(card.scenarioId) : null;
  
  // Map program_id from course → program mapping
  let programId = null;
  if (card.courseId && courseMap.has(card.courseId)) {
    const courseData = courseMap.get(card.courseId);
    programId = stringToId(courseData.programStringId);
  }

  return {
    id,
    kind: card.kind.toUpperCase().replace(/-/g, '_'),
    title: card.title,
    content: JSON.stringify(contentObj),
    tags: JSON.stringify(tags),
    difficulty,
    program_id: programId,
    lesson_id: lessonId,
    scenario_id: scenarioId,
  };
}

// ─── Transform scenario ───────────────────────────────────────────────────

function transformScenario(scenario, courseMap) {
  const id = stringToId(scenario.id);
  const languagePair = scenario.languagePair ? JSON.stringify(scenario.languagePair) : null;
  const cardSource = scenario.cardSource ? JSON.stringify(scenario.cardSource) : null;

  // Map lesson_id from course → lessons mapping
  let lessonId = null;
  if (scenario.courseId && courseMap.has(scenario.courseId)) {
    const courseData = courseMap.get(scenario.courseId);
    // Use the first lesson of the course (scenarios belong to lessons)
    if (courseData.lessons.length > 0) {
      lessonId = stringToId(courseData.lessons[0]);
    }
  }

  return {
    id,
    title: scenario.title,
    description: scenario.description || '',
    author_id: SYSTEM_USER_ID,
    card_source: cardSource,
    published: scenario.published,
    language_pair: languagePair,
    lesson_id: lessonId,
  };
}

// ─── Transform course ─────────────────────────────────────────────────────

function transformCourse(course, courseMap) {
  const id = stringToId(course.id);
  const languagePair = course.languagePair ? JSON.stringify(course.languagePair) : null;
  const courseData = courseMap.get(course.id);
  const programId = stringToId(courseData.programStringId);

  return {
    id,
    title: course.title,
    description: course.description || '',
    author_id: SYSTEM_USER_ID,
    language_pair: languagePair,
    published: course.published,
    program_id: programId,
  };
}

// ─── Transform lesson ─────────────────────────────────────────────────────

function transformLesson(lesson, programId) {
  const id = stringToId(lesson.id);

  // prerequisiteLessonIds может быть строкой или массивом
  let prereqIds = [];
  if (lesson.prerequisiteLessonIds) {
    prereqIds = Array.isArray(lesson.prerequisiteLessonIds) 
      ? lesson.prerequisiteLessonIds 
      : [lesson.prerequisiteLessonIds];
  }

  return {
    id,
    program_id: programId,
    title: lesson.title,
    description: lesson.description || '',
    prerequisite_lesson_ids: JSON.stringify(prereqIds),
    order: lesson.order || 0,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('-- ============================================');
  console.log('-- LinguaCode: Data Import (BIGINT/SERIAL)');
  console.log('-- Generated: ' + new Date().toISOString());
  console.log('-- ============================================');
  console.log('');

  // 1. System user
  console.log('-- ── 1. SYSTEM USER ──');
  console.log(`INSERT INTO data.users (id, display_name, email, password_hash, preferences, created_at, updated_at)
VALUES (
    ${SYSTEM_USER_ID},
    'System',
    'system@linguacode.local',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    '{}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE
SET password_hash = EXCLUDED.password_hash;
`);
  console.log('');

  // 2. Clear existing data
  console.log('-- ── 2. CLEAR EXISTING DATA ──');
  console.log('TRUNCATE data.cards, data.scenarios, data.lessons, data.programs, data.courses RESTART IDENTITY CASCADE;');
  console.log('');

  const manifest = JSON.parse(
    await fs.readFile(path.join(ROOT, 'public/data/content-manifest.json'), 'utf-8'),
  );

  // Pre-scan course structure
  const courseMap = await buildCourseStructure(manifest);

  // 3. Import courses with programs and lessons
  console.log('-- ── 3. IMPORT COURSES ──');
  
  for (const file of manifest.courseFiles) {
    const filePath = path.join(ROOT, 'public/data', file);
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    if (!Array.isArray(data.courses)) continue;

    for (const course of data.courses) {
      const transformed = transformCourse(course, courseMap);
      console.log(`-- File: ${file}, Course: ${course.id}`);
      console.log(`INSERT INTO data.courses (id, title, description, author_id, language_pair, published, created_at, updated_at)
VALUES (
    ${transformed.id},
    ${sqlString(transformed.title)},
    ${sqlString(transformed.description)},
    ${transformed.author_id},
    ${transformed.language_pair ? "'" + transformed.language_pair.replace(/'/g, "''") + "'::jsonb" : 'NULL'},
    ${transformed.published},
    NOW(),
    NOW()
);
`);

      // Create program
      console.log(`-- Program for course ${course.id}`);
      console.log(`INSERT INTO data.programs (id, course_id, author_id, title, description, published, created_at, updated_at)
VALUES (
    ${transformed.program_id},
    ${transformed.id},
    ${SYSTEM_USER_ID},
    ${sqlString(course.title + ' — Программа')},
    ${sqlString('Автоматически созданная программа')},
    true,
    NOW(),
    NOW()
);
`);

      // Import lessons
      const courseData = courseMap.get(course.id);
      if (courseData.lessons.length > 0) {
        for (const lessonIdStr of courseData.lessons) {
          // Find lesson data from the file
          const lessonData = data.lessons?.find(l => l.id === lessonIdStr);
          if (lessonData) {
            const transformedLesson = transformLesson(lessonData, transformed.program_id);
            const prereqJson = "'" + transformedLesson.prerequisite_lesson_ids.replace(/'/g, "''") + "'::jsonb";
            console.log(`-- Lesson: ${lessonIdStr}`);
            console.log(`INSERT INTO data.lessons (id, program_id, title, description, prerequisite_lesson_ids, "order", created_at, updated_at)
VALUES (
    ${transformedLesson.id},
    ${transformedLesson.program_id},
    ${sqlString(transformedLesson.title)},
    ${sqlString(transformedLesson.description)},
    ${prereqJson},
    ${transformedLesson.order},
    NOW(),
    NOW()
);
`);
          }
        }
      }
    }
  }
  console.log('');

  // 4. Import scenarios
  console.log('-- ── 4. IMPORT SCENARIOS ──');
  
  for (const file of manifest.scenarioFiles) {
    const filePath = path.join(ROOT, 'public/data', file);
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    if (!Array.isArray(data.scenarios)) continue;

    for (const scenario of data.scenarios) {
      const transformed = transformScenario(scenario, courseMap);
      console.log(`-- File: ${file}, Scenario: ${scenario.id}`);
      console.log(`INSERT INTO data.scenarios (id, title, description, author_id, card_source, published, language_pair, lesson_id, created_at, updated_at)
VALUES (
    ${transformed.id},
    ${sqlString(transformed.title)},
    ${sqlString(transformed.description)},
    ${transformed.author_id},
    ${transformed.card_source ? "'" + transformed.card_source.replace(/'/g, "''") + "'::jsonb" : 'NULL'},
    ${transformed.published},
    ${transformed.language_pair ? "'" + transformed.language_pair.replace(/'/g, "''") + "'::jsonb" : 'NULL'},
    ${transformed.lesson_id || 'NULL'},
    NOW(),
    NOW()
);
`);
    }
  }
  console.log('');

  // 5. Import cards
  console.log('-- ── 5. IMPORT CARDS ──');
  
  for (const file of manifest.cardFiles) {
    const filePath = path.join(ROOT, 'public/data', file);
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    if (!Array.isArray(data.cards)) {
      console.warn(`  ⚠ No cards in ${file}`);
      continue;
    }

    for (const card of data.cards) {
      const transformed = transformCard(card, courseMap);
      console.log(`-- File: ${file}, Card: ${card.id}`);
      console.log(`INSERT INTO data.cards (id, kind, title, content, tags, difficulty, program_id, lesson_id, scenario_id, created_at, updated_at)
VALUES (
    ${transformed.id},
    ${sqlString(transformed.kind)},
    ${sqlString(transformed.title)},
    ${`'${transformed.content.replace(/'/g, "''")}'`},
    ${`'${transformed.tags.replace(/'/g, "''")}'`},
    ${transformed.difficulty ? sqlString(transformed.difficulty) : 'NULL'},
    ${transformed.program_id || 'NULL'},
    ${transformed.lesson_id || 'NULL'},
    ${transformed.scenario_id || 'NULL'},
    NOW(),
    NOW()
);
`);
    }
  }

  console.log('-- ============================================');
  console.log('-- Import complete');
  console.log('-- ============================================');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
