import type { Course, Scenario } from '../../models';
import type { LanguagePair } from '../../models/language-pair.types';
import type { ScenarioCardSource } from '../../models/scenario-card-source.types';

import { normalizeCourseAuthoring } from '../courses/course-authoring.utils';
import { normalizeLanguagePair } from '../language-pair/language-pair.utils';
import type { UserContentOverlay } from './user-content-overlay.types';
import { readUserContentOverlay, writeUserContentOverlay } from './user-content-overlay.storage';
import type { CourseAuthoring } from '../../models/course-authoring.types';

/** Заголовок курса «Собеседование на языке Perl» для идентификации в оверлее. */
export const PERL_INTERVIEW_COURSE_TITLE = 'Собеседование на языке Perl';

/** Системный ID курса «Собеседование на языке Perl» из seed. */
export const PERL_INTERVIEW_COURSE_ID = 'course-ru-perl-interview';

/** Языковая пара для курса «Собеседование на языке Perl»: русский → Perl. */
export const RU_PERL_LANGUAGE_PAIR: LanguagePair = {
  known: 'ru',
  learning: 'perl',
};

/** Ключ localStorage для флага завершения ремонта оверлея. */
export const USER_CONTENT_OVERLAY_REPAIR_KEY = 'lingua-code.user-content.repair-v1';

/** Версия ремонта: при изменении логики — инкрементировать для принудительного повторного запуска. */
export const USER_CONTENT_OVERLAY_REPAIR_VERSION = 'perl-interview-ru-perl-v2';

/**
 * Выполняет одноразовый ремонт оверлея для курса «Собеседование на языке Perl».
 *
 * @remarks
 * Исправляет две проблемы:
 * 1. Привязывает курс к языковой паре `ru→perl` (courses, lessons, scenarios, cardIndexMeta).
 * 2. Мигрирует authoring из дубликатов курса в seed-запись, удаляя дубликаты.
 *
 * После выполнения устанавливает флаг в localStorage, чтобы не запускаться повторно.
 */
export function repairUserContentOverlayIfNeeded(): void {
  if (
    localStorage.getItem(USER_CONTENT_OVERLAY_REPAIR_KEY) === USER_CONTENT_OVERLAY_REPAIR_VERSION
  ) {
    return;
  }

  const overlay = readUserContentOverlay();
  const languagePairRepair = bindPerlInterviewCourseLanguagePair(overlay);
  const authoringRepair = migratePerlInterviewAuthoringToSeed(languagePairRepair.overlay);

  if (languagePairRepair.changed || authoringRepair.changed) {
    writeUserContentOverlay(authoringRepair.overlay);
  }

  localStorage.setItem(USER_CONTENT_OVERLAY_REPAIR_KEY, USER_CONTENT_OVERLAY_REPAIR_VERSION);
}

/**
 * Привязывает языковую пару `ru→perl` к курсу «Собеседование на языке Perl».
 *
 * @remarks
 * Находит все записи курса с заголовком «Собеседование на языке Perl»
 * и применяет нормализованную языковую пару RU_PERL_LANGUAGE_PAIR к:
 * - курсу, урокам, сценариям, cardIndexMeta
 * - критериям поиска карточек в сценариях с mode='criteria'
 *
 * @param overlay — текущий оверлей пользователя.
 * @returns Обновлённый оверлей и флаг изменений.
 */
export function bindPerlInterviewCourseLanguagePair(overlay: UserContentOverlay): {
  overlay: UserContentOverlay;
  changed: boolean;
} {
  const courseIds = findPerlInterviewCourseIds(overlay);
  if (courseIds.length === 0) {
    return { overlay, changed: false };
  }

  const pair = normalizeLanguagePair(RU_PERL_LANGUAGE_PAIR);
  const courses = { ...overlay.courses };
  const lessons = { ...overlay.lessons };
  const scenarios = { ...overlay.scenarios };
  const cardIndexMeta = { ...overlay.cardIndexMeta };
  let changed = false;

  const scenarioIds = new Set<string>();

  for (const courseId of courseIds) {
    const entry = courses[courseId];
    if (!entry || !isOverlayCourse(entry)) {
      continue;
    }

    if (!languagePairMatches(entry.languagePair, pair)) {
      courses[courseId] = { ...entry, languagePair: pair };
      changed = true;
    }

    for (const lessonId of entry.lessonIds) {
      const lesson = lessons[lessonId];
      if (lesson && isOverlayLesson(lesson)) {
        for (const scenarioId of lesson.scenarioIds) {
          scenarioIds.add(scenarioId);
        }
      }
    }
  }

  for (const scenarioId of scenarioIds) {
    const entry = scenarios[scenarioId];
    if (!entry || !isOverlayScenario(entry)) {
      continue;
    }

    if (!languagePairMatches(entry.languagePair, pair)) {
      scenarios[scenarioId] = { ...entry, languagePair: pair };
      changed = true;
    }

    const cardIds = cardIdsFromScenarioSource(entry.cardSource);
    for (const cardId of cardIds) {
      const current = cardIndexMeta[cardId] ?? {};
      if (current.knownLanguage === pair.known && current.learningLanguage === pair.learning) {
        continue;
      }

      cardIndexMeta[cardId] = {
        ...current,
        knownLanguage: pair.known,
        learningLanguage: pair.learning,
      };
      changed = true;
    }

    if (entry.cardSource.mode === 'criteria') {
      const criteria = entry.cardSource.criteria;
      if (criteria.knownLanguage !== pair.known || criteria.learningLanguage !== pair.learning) {
        scenarios[scenarioId] = {
          ...scenarios[scenarioId],
          cardSource: {
            ...entry.cardSource,
            criteria: {
              ...criteria,
              knownLanguage: pair.known,
              learningLanguage: pair.learning,
            },
          },
        } as Scenario;
        changed = true;
      }
    }
  }

  if (!changed) {
    return { overlay, changed: false };
  }

  return {
    overlay: {
      ...overlay,
      courses,
      lessons,
      scenarios,
      cardIndexMeta,
    },
    changed: true,
  };
}

function findPerlInterviewCourseIds(overlay: UserContentOverlay): readonly string[] {
  return Object.entries(overlay.courses)
    .filter(([, entry]) => isPerlInterviewCourse(entry))
    .map(([id]) => id);
}

function isPerlInterviewCourse(entry: Course | Partial<Course>): boolean {
  return typeof entry.title === 'string' && entry.title.trim() === PERL_INTERVIEW_COURSE_TITLE;
}

function isOverlayCourse(value: Course | Partial<Course>): value is Course {
  return (
    typeof value.languagePair === 'object' &&
    Array.isArray(value.lessonIds) &&
    typeof value.authorId === 'string'
  );
}

function isOverlayLesson(
  value: UserContentOverlay['lessons'][string],
): value is import('../../models').Lesson {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as import('../../models').Lesson).courseId === 'string' &&
    Array.isArray((value as import('../../models').Lesson).scenarioIds)
  );
}

function isOverlayScenario(value: Scenario | Partial<Scenario>): value is Scenario {
  return (
    typeof value.authorId === 'string' &&
    typeof value.cardSource === 'object' &&
    value.cardSource !== null
  );
}

function languagePairMatches(pair: LanguagePair | undefined, expected: LanguagePair): boolean {
  if (!pair) {
    return false;
  }

  return pair.known === expected.known && pair.learning === expected.learning;
}

function cardIdsFromScenarioSource(source: ScenarioCardSource): readonly string[] {
  if (source.mode === 'fixed' || source.mode === 'snapshot') {
    return source.cardIds;
  }

  return [];
}

/**
 * Мигрирует authoring из дубликатов курса в seed-запись и удаляет дубликаты.
 *
 * @remarks
 * Находит все курсы с заголовком «Собеседование на языке Perl»:
 * 1. Выбирает запись с наиболее полным authoring (по длине поля `idea`).
 * 2. Сравнивает с seed-записью и обновляет только при различиях.
 * 3. Удаляет все дубликаты курсов (кроме PERL_INTERVIEW_COURSE_ID)
 *    вместе с их уроками.
 *
 * @param overlay — текущий оверлей пользователя.
 * @returns Обновлённый оверлей и флаг изменений.
 */
export function migratePerlInterviewAuthoringToSeed(overlay: UserContentOverlay): {
  overlay: UserContentOverlay;
  changed: boolean;
} {
  const authoring = extractBestPerlInterviewAuthoring(overlay);
  const duplicateCourseIds = findPerlInterviewCourseIds(overlay).filter(
    (id) => id !== PERL_INTERVIEW_COURSE_ID,
  );

  if (!authoring && duplicateCourseIds.length === 0) {
    return { overlay, changed: false };
  }

  const courses = { ...overlay.courses };
  const lessons = { ...overlay.lessons };
  let changed = false;

  if (authoring) {
    const seedEntry = courses[PERL_INTERVIEW_COURSE_ID];
    const currentAuthoring = normalizeCourseAuthoring(
      seedEntry && 'authoring' in seedEntry ? seedEntry.authoring : undefined,
    );
    const nextAuthoring = pickRicherAuthoring(currentAuthoring, authoring);

    if (!sameAuthoring(currentAuthoring, nextAuthoring)) {
      courses[PERL_INTERVIEW_COURSE_ID] = isOverlayCourse(seedEntry ?? {})
        ? { ...(seedEntry as Course), authoring: nextAuthoring }
        : {
            ...(seedEntry ?? {}),
            authoring: nextAuthoring,
          };
      changed = true;
    }
  }

  for (const courseId of duplicateCourseIds) {
    const entry = courses[courseId];
    if (!entry) {
      continue;
    }

    delete courses[courseId];
    changed = true;

    if (!isOverlayCourse(entry)) {
      continue;
    }

    for (const lessonId of entry.lessonIds) {
      const lesson = lessons[lessonId];
      if (lesson && isOverlayLesson(lesson) && lesson.courseId === courseId) {
        delete lessons[lessonId];
      }
    }
  }

  if (!changed) {
    return { overlay, changed: false };
  }

  return {
    overlay: {
      ...overlay,
      courses,
      lessons,
    },
    changed: true,
  };
}

function extractBestPerlInterviewAuthoring(
  overlay: UserContentOverlay,
): CourseAuthoring | undefined {
  let best: CourseAuthoring | undefined;
  let bestLength = 0;

  for (const entry of Object.values(overlay.courses)) {
    if (!entry || !isPerlInterviewCourse(entry)) {
      continue;
    }

    const authoring = normalizeCourseAuthoring('authoring' in entry ? entry.authoring : undefined);
    const length = authoring?.idea.trim().length ?? 0;
    if (length > bestLength && authoring) {
      best = authoring;
      bestLength = length;
    }
  }

  return best;
}

function pickRicherAuthoring(
  left: CourseAuthoring | undefined,
  right: CourseAuthoring,
): CourseAuthoring {
  const leftLength = left?.idea.trim().length ?? 0;
  const rightLength = right.idea.trim().length;
  return rightLength >= leftLength ? right : left!;
}

function sameAuthoring(
  left: CourseAuthoring | undefined,
  right: CourseAuthoring | undefined,
): boolean {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}
