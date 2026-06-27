import type { Course, Lesson, Scenario } from '../models';
import type { LanguagePair } from '../models/language-pair.types';

const RU_ZH_LANGUAGE_PAIR: LanguagePair = {
  known: 'ru',
  learning: 'zh',
};

export const RADICALS_COURSE_ID = 'course-zh-radicals-214';
export const RADICALS_PER_SCENARIO = 50;
export const RADICALS_TOTAL = 214;
export const RADICALS_LESSON_COUNT = Math.ceil(RADICALS_TOTAL / RADICALS_PER_SCENARIO);

const RADICALS_UPDATED_AT = '2026-06-14T12:00:00.000Z';

export function radicalCardId(index: number): string {
  return `draw-radical-${String(index).padStart(3, '0')}`;
}

export function radicalLessonId(lessonIndex: number): string {
  return `lesson-radicals-${String(lessonIndex + 1).padStart(2, '0')}`;
}

export function radicalScenarioId(lessonIndex: number): string {
  return `scenario-radicals-${String(lessonIndex + 1).padStart(2, '0')}`;
}

export function radicalLessonRange(lessonIndex: number): { start: number; end: number } {
  const start = lessonIndex * RADICALS_PER_SCENARIO + 1;
  const end = Math.min(start + RADICALS_PER_SCENARIO - 1, RADICALS_TOTAL);
  return { start, end };
}

export function radicalLessonCardIds(lessonIndex: number): readonly string[] {
  const { start, end } = radicalLessonRange(lessonIndex);
  return Array.from({ length: end - start + 1 }, (_, offset) => radicalCardId(start + offset));
}

export const DEFAULT_RADICALS_SCENARIOS: readonly Scenario[] = Array.from(
  { length: RADICALS_LESSON_COUNT },
  (_, lessonIndex) => {
    const { start, end } = radicalLessonRange(lessonIndex);
    return {
      id: radicalScenarioId(lessonIndex),
      title: `Радикалы ${start}–${end}`,
      description: `Отработка радикалов Канси №${start}–${end}: прописывание черт и порядок написания.`,
      authorId: 'local-user',
      published: true,
      updatedAt: RADICALS_UPDATED_AT,
      languagePair: RU_ZH_LANGUAGE_PAIR,
      cardSource: {
        mode: 'fixed',
        cardIds: [...radicalLessonCardIds(lessonIndex)],
      },
    };
  },
);

export const DEFAULT_RADICALS_LESSONS: readonly Lesson[] = Array.from(
  { length: RADICALS_LESSON_COUNT },
  (_, lessonIndex) => {
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
  },
);

export const DEFAULT_RADICALS_COURSE: Course = {
  id: RADICALS_COURSE_ID,
  title: '214 китайских радикалов',
  description:
    'Полный курс по 214 классическим ключам (康熙部首): прописывание формы и порядка черт каждого радикала.',
  authorId: 'local-user',
  languagePair: RU_ZH_LANGUAGE_PAIR,
  lessonIds: DEFAULT_RADICALS_LESSONS.map((lesson) => lesson.id),
  published: true,
  updatedAt: RADICALS_UPDATED_AT,
};

export function isObsoleteRadicalsCatalogItem(id: string): boolean {
  const match = /^(?:lesson|scenario)-radicals-(\d{2})$/.exec(id);
  if (!match) {
    return false;
  }

  return Number(match[1]) > RADICALS_LESSON_COUNT;
}
