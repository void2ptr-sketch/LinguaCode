/** Build radicals course/scenario fixtures for JSON export. */

import { KANGXI_RADICALS } from '../kangxi-radicals.mjs';

export const RU_ZH_LANGUAGE_PAIR = { known: 'ru', learning: 'zh' };
export const RADICALS_COURSE_ID = 'course-zh-radicals-214';
export const RADICALS_PER_SCENARIO = 50;
export const RADICALS_TOTAL = KANGXI_RADICALS.length;
export const RADICALS_LESSON_COUNT = Math.ceil(RADICALS_TOTAL / RADICALS_PER_SCENARIO);
export const RADICALS_UPDATED_AT = '2026-06-14T12:00:00.000Z';

export function radicalCardId(index) {
  return `draw-radical-${String(index).padStart(3, '0')}`;
}

export function radicalLessonId(lessonIndex) {
  return `lesson-radicals-${String(lessonIndex + 1).padStart(2, '0')}`;
}

export function radicalScenarioId(lessonIndex) {
  return `scenario-radicals-${String(lessonIndex + 1).padStart(2, '0')}`;
}

export function radicalLessonRange(lessonIndex) {
  const start = lessonIndex * RADICALS_PER_SCENARIO + 1;
  const end = Math.min(start + RADICALS_PER_SCENARIO - 1, RADICALS_TOTAL);
  return { start, end };
}

export function radicalLessonCardIds(lessonIndex) {
  const { start, end } = radicalLessonRange(lessonIndex);
  return Array.from({ length: end - start + 1 }, (_, offset) => radicalCardId(start + offset));
}

export function buildRadicalsScenarios() {
  return Array.from({ length: RADICALS_LESSON_COUNT }, (_, lessonIndex) => {
    const { start, end } = radicalLessonRange(lessonIndex);
    return {
      id: radicalScenarioId(lessonIndex),
      title: `Радикалы ${start}–${end}`,
      description: `Отработка радикалов Канси №${start}–${end}: прописывание черт и порядок написания.`,
      authorId: 'system',
      published: true,
      updatedAt: RADICALS_UPDATED_AT,
      languagePair: RU_ZH_LANGUAGE_PAIR,
      cardSource: {
        mode: 'fixed',
        cardIds: radicalLessonCardIds(lessonIndex),
      },
    };
  });
}

export function buildRadicalsLessons() {
  return Array.from({ length: RADICALS_LESSON_COUNT }, (_, lessonIndex) => {
    const { start, end } = radicalLessonRange(lessonIndex);
    const previousLessonId = lessonIndex > 0 ? radicalLessonId(lessonIndex - 1) : null;

    return {
      id: radicalLessonId(lessonIndex),
      courseId: RADICALS_COURSE_ID,
      title: `Урок ${lessonIndex + 1}: радикалы ${start}–${end}`,
      description: `214 ключей Канси: радикалы с №${start} по №${end}.`,
      scenarioIds: [radicalScenarioId(lessonIndex)],
      prerequisiteLessonIds: previousLessonId ? [previousLessonId] : [],
      order: lessonIndex,
      updatedAt: RADICALS_UPDATED_AT,
    };
  });
}

export function buildRadicalsCourse() {
  const lessons = buildRadicalsLessons();
  return {
    courses: [
      {
        id: RADICALS_COURSE_ID,
        title: '214 китайских радикалов',
        description:
          'Полный курс по 214 классическим ключам (康熙部首): прописывание формы и порядка черт каждого радикала.',
        authorId: 'system',
        languagePair: RU_ZH_LANGUAGE_PAIR,
        lessonIds: lessons.map((lesson) => lesson.id),
        published: true,
        updatedAt: RADICALS_UPDATED_AT,
      },
    ],
    lessons,
  };
}
