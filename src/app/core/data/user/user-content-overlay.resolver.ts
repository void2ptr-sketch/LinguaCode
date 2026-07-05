/**
 * Модуль разрешения пользовательских оверлеев (переопределений).
 *
 * Это КРИТИЧЕСКИ важный модуль, который управляет тем, какие данные
 * отображаются в интерфейсе: seed-данные из файлов или пользовательские изменения.
 *
 * Архитектура:
 * 1. Seed-данные — начальные данные из файлов public/data/*.json
 * 2. Overlay — пользовательские изменения, сохранённые в localStorage
 * 3. Resolver — объединяет seed и overlay, применяя правила приоритета
 *
 * Правила приоритета:
 * - Если карточка/сценарий/курс удалён (deletedSystemIds) — не отображается
 * - Если есть overlay-версия — используется она
 * - Если overlay нет — используется seed-версия
 * - Если элемент создан пользователем (нет в seed) — отображается
 *
 * Пример проблемы с localStorage:
 * ```
 * // В localStorage:
 * {
 *   deletedSystemIds: {
 *     cards: ['perl-db-001', 'perl-db-002'] // ← Карточки исключаются!
 *   }
 * }
 *
 * // Даже если карточки есть в файле, они не отобразятся!
 * ```
 *
 * Решение:
 * ```javascript
 * localStorage.removeItem('lingua-code.user-content-overlay');
 * location.reload();
 * ```
 */
import type { Card } from '../../models';
import type { Course, Lesson } from '../../models';
import type { Scenario } from '../../models';

import {
  mergeStoredCourse,
  mergeStoredLesson,
  normalizeStoredCourse,
  normalizeStoredLesson,
  type CourseCatalogState,
} from '../courses/course-catalog-state';
import { normalizeCourseAuthoring, sameCourseAuthoring } from '../courses/course-authoring.utils';
import { mergeDrawCardQuestionFields } from '../chinese/draw-card.utils';
import { isObsoleteRadicalsCatalogItem } from '../chinese/radicals-course.defaults';
import { mergeScenariosWithDefaults } from '../scenarios/scenario-catalog.defaults';
import type {
  CoursePatch,
  LessonPatch,
  ScenarioPatch,
  UserContentDeletedIds,
  UserContentOverlay,
} from './user-content-overlay.types';

/**
 * ID карточек, которые всегда удаляются (hardcoded).
 * Используется для удаления устаревших карточек.
 */
const REMOVED_SEED_CARD_IDS = new Set(['draw-jiangenshenfang-1']);

// -------------------------------------------------------------------------
// Публичные функции разрешения
// -------------------------------------------------------------------------

/**
 * Разрешает каталог курсов: объединяет seed-данные с пользовательскими оверлеями.
 *
 * Процесс:
 * 1. Загружает deletedSystemIds (список удалённых элементов)
 * 2. Для каждого курса из seed:
 *    - Если удалён — пропускает
 *    - Если есть overlay — применяет overlay
 *    - Иначе — использует seed
 * 3. Добавляет пользовательские курсы (нет в seed)
 *
 * @param seed — seed-данные курсов
 * @param overlay — пользовательские оверлеи
 * @returns разрешённый каталог курсов
 */
export function resolveCourseCatalog(
  seed: CourseCatalogState,
  overlay: UserContentOverlay,
): CourseCatalogState {
  const deletedCourses = new Set(overlay.deletedSystemIds?.courses ?? []);
  const deletedLessons = new Set(overlay.deletedSystemIds?.lessons ?? []);
  const seedCourseIds = new Set(seed.courses.map((course) => course.id));
  const seedLessonIds = new Set(seed.lessons.map((lesson) => lesson.id));

  const coursesById = new Map<string, Course>();
  const lessonsById = new Map<string, Lesson>();

  for (const course of seed.courses) {
    if (deletedCourses.has(course.id) || isObsoleteRadicalsCatalogItem(course.id)) {
      continue;
    }

    coursesById.set(course.id, applyCourseOverlay(course, overlay.courses[course.id]));
  }

  for (const lesson of seed.lessons) {
    if (deletedLessons.has(lesson.id) || isObsoleteRadicalsCatalogItem(lesson.id)) {
      continue;
    }

    lessonsById.set(lesson.id, applyLessonOverlay(lesson, overlay.lessons[lesson.id]));
  }

  for (const [id, entry] of Object.entries(overlay.courses)) {
    if (seedCourseIds.has(id) || deletedCourses.has(id)) {
      continue;
    }

    if (isCompleteCourse(entry)) {
      coursesById.set(id, normalizeStoredCourse(entry));
    }
  }

  for (const [id, entry] of Object.entries(overlay.lessons)) {
    if (seedLessonIds.has(id) || deletedLessons.has(id)) {
      continue;
    }

    if (isCompleteLesson(entry)) {
      lessonsById.set(id, normalizeStoredLesson(entry));
    }
  }

  return {
    courses: [...coursesById.values()],
    lessons: [...lessonsById.values()],
  };
}

/**
 * Разрешает сценарии: объединяет seed-данные с пользовательскими оверлеями.
 *
 * Процесс:
 * 1. Загружает deletedSystemIds (список удалённых сценариев)
 * 2. Для каждого сценария из seed:
 *    - Если удалён — пропускает
 *    - Если есть overlay — применяет overlay
 *    - Иначе — использует seed
 * 3. Добавляет пользовательские сценарии (нет в seed)
 *
 * @param seed — seed-данные сценариев
 * @param overlay — пользовательские оверлеи
 * @returns разрешённые сценарии
 */
export function resolveScenarios(
  seed: readonly Scenario[],
  overlay: UserContentOverlay,
): readonly Scenario[] {
  const deleted = new Set(overlay.deletedSystemIds?.scenarios ?? []);
  const seedIds = new Set(seed.map((scenario) => scenario.id));
  const resolved: Scenario[] = [];

  for (const scenario of seed) {
    if (deleted.has(scenario.id) || isObsoleteRadicalsCatalogItem(scenario.id)) {
      continue;
    }

    resolved.push(applyScenarioOverlay(scenario, overlay.scenarios[scenario.id]));
  }

  for (const [id, entry] of Object.entries(overlay.scenarios)) {
    if (seedIds.has(id) || deleted.has(id)) {
      continue;
    }

    if (isCompleteScenario(entry)) {
      resolved.push(entry);
    }
  }

  return resolved;
}

/**
 * Разрешает карточки: объединяет seed-данные с пользовательскими оверлеями.
 *
 * Это КРИТИЧЕСКИ ВАЖНАЯ функция для понимания проблемы "карточки не отображаются".
 *
 * Процесс:
 * 1. Загружает deletedSystemIds (список удалённых карточек)
 * 2. Для каждой карточки из seed:
 *    - Если удалена — ПРОПУСКАЕТСЯ (не добавляется в byId)
 *    - Если есть overlay — использует overlay
 *    - Иначе — использует seed
 * 3. Добавляет пользовательские карточки (нет в seed)
 *
 * Проблема:
 * Если ID карточки есть в overlay.deletedSystemIds.cards, то карточка
 * исключается из каталога, ДАЖЕ если она есть в файле.
 *
 * @param seed — seed-данные карточек
 * @param overlay — пользовательские оверлеи
 * @returns разрешённые карточки
 */
export function resolveCards(
  seed: readonly Card[],
  overlay: UserContentOverlay,
): readonly Card[] {
  const deleted = new Set(overlay.deletedSystemIds?.cards ?? []);
  const seedIds = new Set(seed.map((card) => card.id));
  const byId = new Map<string, Card>();

  for (const card of seed) {
    if (deleted.has(card.id) || REMOVED_SEED_CARD_IDS.has(card.id)) {
      continue;
    }

    const overlayCard = overlay.cards[card.id];
    if (!overlayCard) {
      byId.set(card.id, card);
      continue;
    }

    if (card.kind === 'draw' && overlayCard.kind === 'draw') {
      byId.set(card.id, mergeDrawCardQuestionFields(overlayCard, card));
      continue;
    }

    byId.set(card.id, overlayCard);
  }

  for (const [id, card] of Object.entries(overlay.cards)) {
    if (seedIds.has(id) || deleted.has(id)) {
      continue;
    }

    byId.set(id, card);
  }

  return [...byId.values()].filter((card) => !REMOVED_SEED_CARD_IDS.has(card.id));
}

// -------------------------------------------------------------------------
// Функции вычисления оверлеев (для сохранения изменений)
// -------------------------------------------------------------------------

/**
 * Вычисляет оверлей для курсов на основе разрешённых данных.
 *
 * Используется при сохранении изменений в localStorage.
 * Сравнивает resolved (текущее состояние) с seed (начальным состоянием)
 * и сохраняет только различия.
 *
 * @param resolved — разрешённые данные (текущее состояние)
 * @param seed — seed-данные (начальное состояние)
 * @param previous — предыдущий оверлей
 * @returns оверлей для сохранения
 */
export function computeCourseCatalogOverlay(
  resolved: CourseCatalogState,
  seed: CourseCatalogState,
  previous: UserContentOverlay,
): Pick<UserContentOverlay, 'courses' | 'lessons' | 'deletedSystemIds'> {
  const seedCourseIds = new Set(seed.courses.map((course) => course.id));
  const seedLessonIds = new Set(seed.lessons.map((lesson) => lesson.id));
  const resolvedCourseIds = new Set(resolved.courses.map((course) => course.id));
  const resolvedLessonIds = new Set(resolved.lessons.map((lesson) => lesson.id));

  const courses: Record<string, Course | CoursePatch> = {};
  const lessons: Record<string, Lesson | LessonPatch> = {};

  for (const course of resolved.courses) {
    const seedCourse = seed.courses.find((item) => item.id === course.id);
    if (seedCourse) {
      const patch = diffCourse(course, seedCourse);
      if (Object.keys(patch).length > 0) {
        courses[course.id] = patch;
      }
      continue;
    }

    courses[course.id] = course;
  }

  for (const lesson of resolved.lessons) {
    const seedLesson = seed.lessons.find((item) => item.id === lesson.id);
    if (seedLesson) {
      const patch = diffLesson(lesson, seedLesson);
      if (Object.keys(patch).length > 0) {
        lessons[lesson.id] = patch;
      }
      continue;
    }

    lessons[lesson.id] = lesson;
  }

  const deletedSystemIds: UserContentDeletedIds = {
    ...previous.deletedSystemIds,
    courses: uniqueIds([
      ...(previous.deletedSystemIds?.courses ?? []),
      ...seed.courses
        .map((course) => course.id)
        .filter((id) => !resolvedCourseIds.has(id)),
    ]),
    lessons: uniqueIds([
      ...(previous.deletedSystemIds?.lessons ?? []),
      ...seed.lessons.map((lesson) => lesson.id).filter((id) => !resolvedLessonIds.has(id)),
    ]),
  };

  for (const id of seedCourseIds) {
    if (!(id in courses) && resolvedCourseIds.has(id)) {
      delete courses[id];
    }
  }

  for (const id of seedLessonIds) {
    if (!(id in lessons) && resolvedLessonIds.has(id)) {
      delete lessons[id];
    }
  }

  return { courses, lessons, deletedSystemIds };
}

/**
 * Вычисляет оверлей для сценариев на основе разрешённых данных.
 *
 * @param resolved — разрешённые данные (текущее состояние)
 * @param seed — seed-данные (начальное состояние)
 * @param previous — предыдущий оверлей
 * @returns оверлей для сохранения
 */
export function computeScenariosOverlay(
  resolved: readonly Scenario[],
  seed: readonly Scenario[],
  previous: UserContentOverlay,
): Pick<UserContentOverlay, 'scenarios' | 'deletedSystemIds'> {
  const seedIds = new Set(seed.map((scenario) => scenario.id));
  const resolvedIds = new Set(resolved.map((scenario) => scenario.id));
  const scenarios: Record<string, Scenario | ScenarioPatch> = {};

  for (const scenario of resolved) {
    const seedScenario = seed.find((item) => item.id === scenario.id);
    if (seedScenario) {
      const patch = diffScenario(scenario, seedScenario);
      if (Object.keys(patch).length > 0) {
        scenarios[scenario.id] = patch;
      }
      continue;
    }

    scenarios[scenario.id] = scenario;
  }

  for (const id of seedIds) {
    if (!(id in scenarios) && resolvedIds.has(id)) {
      delete scenarios[id];
    }
  }

  const deletedSystemIds: UserContentDeletedIds = {
    ...previous.deletedSystemIds,
    scenarios: uniqueIds([
      ...(previous.deletedSystemIds?.scenarios ?? []),
      ...seed.map((scenario) => scenario.id).filter((id) => !resolvedIds.has(id)),
    ]),
  };

  return { scenarios, deletedSystemIds };
}

/**
 * Вычисляет оверлей для карточек на основе разрешённых данных.
 *
 * @param resolved — разрешённые данные (текущее состояние)
 * @param seed — seed-данные (начальное состояние)
 * @param previous — предыдущий оверлей
 * @returns оверлей для сохранения
 */
export function computeCardsOverlay(
  resolved: readonly Card[],
  seed: readonly Card[],
  previous: UserContentOverlay,
): Pick<UserContentOverlay, 'cards' | 'deletedSystemIds'> {
  const seedById = new Map(seed.map((card) => [card.id, card]));
  const resolvedIds = new Set(resolved.map((card) => card.id));
  const cards: Record<string, Card> = {};

  for (const card of resolved) {
    const seedCard = seedById.get(card.id);
    if (!seedCard) {
      cards[card.id] = card;
      continue;
    }

    if (cardsDiffer(card, seedCard)) {
      cards[card.id] = card;
    }
  }

  for (const id of seedById.keys()) {
    if (!(id in cards) && resolvedIds.has(id)) {
      delete cards[id];
    }
  }

  const deletedSystemIds: UserContentDeletedIds = {
    ...previous.deletedSystemIds,
    cards: uniqueIds([
      ...(previous.deletedSystemIds?.cards ?? []),
      ...seed.map((card) => card.id).filter((id) => !resolvedIds.has(id)),
    ]),
  };

  return { cards, deletedSystemIds };
}

// -------------------------------------------------------------------------
// Вспомогательные функции для миграции и слияния
// -------------------------------------------------------------------------

/**
 * Legacy-функция для слияния каталога курсов из старого хранилища.
 *
 * @param stored — сохранённые данные
 * @param seed — seed-данные
 * @returns объединённый каталог
 */
export function mergeLegacyCourseCatalogWithSeed(
  stored: CourseCatalogState,
  seed: CourseCatalogState,
): CourseCatalogState {
  return mergeCourseCatalogFromLegacyLists(stored, seed);
}

/**
 * Legacy-функция для слияния сценариев из старого хранилища.
 *
 * @param stored — сохранённые данные
 * @param seed — seed-данные
 * @returns объединённые сценарии
 */
export function mergeLegacyScenariosWithSeed(
  stored: readonly Scenario[],
  seed: readonly Scenario[],
): readonly Scenario[] {
  return mergeScenariosWithDefaults(stored, seed);
}

// -------------------------------------------------------------------------
// Приватные функции
// -------------------------------------------------------------------------

/**
 * Слияние каталога курсов из legacy-формата.
 *
 * @param stored — сохранённые данные
 * @param seed — seed-данные
 * @returns объединённый каталог
 */
function mergeCourseCatalogFromLegacyLists(
  stored: CourseCatalogState,
  seed: CourseCatalogState,
): CourseCatalogState {
  const coursesById = new Map<string, Course>();
  const lessonsById = new Map<string, Lesson>();

  for (const course of seed.courses) {
    coursesById.set(course.id, course);
  }

  for (const lesson of seed.lessons) {
    lessonsById.set(lesson.id, lesson);
  }

  for (const course of stored.courses) {
    if (isObsoleteRadicalsCatalogItem(course.id)) {
      continue;
    }

    coursesById.set(course.id, mergeStoredCourse(course, coursesById.get(course.id)));
  }

  for (const lesson of stored.lessons) {
    if (isObsoleteRadicalsCatalogItem(lesson.id)) {
      continue;
    }

    lessonsById.set(lesson.id, mergeStoredLesson(lesson, lessonsById.get(lesson.id)));
  }

  return {
    courses: [...coursesById.values()],
    lessons: [...lessonsById.values()],
  };
}

/**
 * Применяет оверлей к курсу.
 *
 * @param base — базовый курс из seed
 * @param overlayEntry — оверлей (patch или полный курс)
 * @returns курс с применённым оверлеем
 */
function applyCourseOverlay(base: Course, overlayEntry?: Course | CoursePatch): Course {
  if (!overlayEntry) {
    return base;
  }

  if (isCompleteCourse(overlayEntry)) {
    return mergeStoredCourse(overlayEntry, base);
  }

  return mergeStoredCourse({ ...base, ...overlayEntry } as Course, base);
}

/**
 * Применяет оверлей к уроку.
 *
 * @param base — базовый урок из seed
 * @param overlayEntry — оверлей (patch или полный урок)
 * @returns урок с применённым оверлеем
 */
function applyLessonOverlay(base: Lesson, overlayEntry?: Lesson | LessonPatch): Lesson {
  if (!overlayEntry) {
    return base;
  }

  if (isCompleteLesson(overlayEntry)) {
    return mergeStoredLesson(overlayEntry, base);
  }

  return mergeStoredLesson({ ...base, ...overlayEntry } as Lesson, base);
}

/**
 * Применяет оверлей к сценарию.
 *
 * @param base — базовый сценарий из seed
 * @param overlayEntry — оверлей (patch или полный сценарий)
 * @returns сценарий с применённым оверлеем
 */
function applyScenarioOverlay(base: Scenario, overlayEntry?: Scenario | ScenarioPatch): Scenario {
  if (!overlayEntry) {
    return base;
  }

  if (isCompleteScenario(overlayEntry)) {
    return overlayEntry;
  }

  return {
    ...base,
    ...overlayEntry,
    languagePair: base.languagePair,
    cardSource: base.cardSource,
  };
}

/**
 * Вычисляет разницу между курсом и seed.
 *
 * @param resolved — текущий курс
 * @param seed — seed-курс
 * @returns patch с различиями
 */
function diffCourse(resolved: Course, seed: Course): CoursePatch {
  const patch: CoursePatch = {};

  if (resolved.title !== seed.title) {
    patch.title = resolved.title;
  }

  if (resolved.description !== seed.description) {
    patch.description = resolved.description;
  }

  if (resolved.published !== seed.published) {
    patch.published = resolved.published;
  }

  if (resolved.updatedAt !== seed.updatedAt) {
    patch.updatedAt = resolved.updatedAt;
  }

  if (!sameStringArray(resolved.lessonIds, seed.lessonIds)) {
    patch.lessonIds = [...resolved.lessonIds];
  }

  if (!sameCourseAuthoring(resolved.authoring, seed.authoring)) {
    patch.authoring = normalizeCourseAuthoring(resolved.authoring);
  }

  return patch;
}

/**
 * Вычисляет разницу между уроком и seed.
 *
 * @param resolved — текущий урок
 * @param seed — seed-урок
 * @returns patch с различиями
 */
function diffLesson(resolved: Lesson, seed: Lesson): LessonPatch {
  const patch: LessonPatch = {};

  if (resolved.title !== seed.title) {
    patch.title = resolved.title;
  }

  if (resolved.description !== seed.description) {
    patch.description = resolved.description;
  }

  if (resolved.order !== seed.order) {
    patch.order = resolved.order;
  }

  if (resolved.updatedAt !== seed.updatedAt) {
    patch.updatedAt = resolved.updatedAt;
  }

  if (!sameStringArray(resolved.scenarioIds, seed.scenarioIds)) {
    patch.scenarioIds = [...resolved.scenarioIds];
  }

  if (!sameStringArray(resolved.prerequisiteLessonIds, seed.prerequisiteLessonIds)) {
    patch.prerequisiteLessonIds = [...resolved.prerequisiteLessonIds];
  }

  return patch;
}

/**
 * Вычисляет разницу между сценарием и seed.
 *
 * @param resolved — текущий сценарий
 * @param seed — seed-сценарий
 * @returns patch с различиями
 */
function diffScenario(resolved: Scenario, seed: Scenario): ScenarioPatch {
  const patch: ScenarioPatch = {};

  if (resolved.title !== seed.title) {
    patch.title = resolved.title;
  }

  if (resolved.description !== seed.description) {
    patch.description = resolved.description;
  }

  if (resolved.published !== seed.published) {
    patch.published = resolved.published;
  }

  if (resolved.updatedAt !== seed.updatedAt) {
    patch.updatedAt = resolved.updatedAt;
  }

  return patch;
}

/**
 * Проверяет, отличаются ли две карточки.
 *
 * @param resolved — текущая карточка
 * @param seed — seed-карточка
 * @returns true если карточки отличаются
 */
function cardsDiffer(resolved: Card, seed: Card): boolean {
  return JSON.stringify(resolved) !== JSON.stringify(seed);
}

/**
 * Проверяет, является ли значение полным курсом (а не patch).
 *
 * @param value — значение для проверки
 * @returns true если это полный курс
 */
function isCompleteCourse(value: Course | CoursePatch): value is Course {
  return (
    typeof (value as Course).languagePair === 'object' &&
    Array.isArray((value as Course).lessonIds) &&
    typeof (value as Course).authorId === 'string'
  );
}

/**
 * Проверяет, является ли значение полным уроком (а не patch).
 *
 * @param value — значение для проверки
 * @returns true если это полный урок
 */
function isCompleteLesson(value: Lesson | LessonPatch): value is Lesson {
  return (
    typeof (value as Lesson).courseId === 'string' &&
    Array.isArray((value as Lesson).scenarioIds)
  );
}

/**
 * Проверяет, является ли значение полным сценарием (а не patch).
 *
 * @param value — значение для проверки
 * @returns true если это полный сценарий
 */
function isCompleteScenario(value: Scenario | ScenarioPatch): value is Scenario {
  return (
    typeof (value as Scenario).authorId === 'string' &&
    typeof (value as Scenario).cardSource === 'object'
  );
}

/**
 * Проверяет, одинаковы ли два строковых массива.
 *
 * @param left — первый массив
 * @param right — второй массив
 * @returns true если массивы одинаковы
 */
function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/**
 * Убирает дубликаты и null/undefined из массива ID.
 *
 * @param ids — массив ID
 * @returns массив уникальных ID
 */
function uniqueIds(ids: readonly string[]): readonly string[] {
  return [...new Set(ids.filter(Boolean))];
}
