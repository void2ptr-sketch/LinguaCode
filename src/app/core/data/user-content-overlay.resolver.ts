import type { Card } from '../models';
import type { Course, Lesson } from '../models';
import type { Scenario } from '../models';

import {
  mergeStoredCourse,
  mergeStoredLesson,
  normalizeStoredCourse,
  normalizeStoredLesson,
  type CourseCatalogState,
} from './course-catalog-state';
import { mergeDrawCardQuestionFields } from './draw-card.utils';
import { isObsoleteRadicalsCatalogItem } from './radicals-course.defaults';
import { mergeScenariosWithDefaults } from './scenario-catalog.defaults';
import type {
  CoursePatch,
  LessonPatch,
  ScenarioPatch,
  UserContentDeletedIds,
  UserContentOverlay,
} from './user-content-overlay.types';

const REMOVED_SEED_CARD_IDS = new Set(['draw-jiangenshenfang-1']);

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

/** Legacy merge for tests and migration from monolithic storage. */
export function mergeLegacyCourseCatalogWithSeed(
  stored: CourseCatalogState,
  seed: CourseCatalogState,
): CourseCatalogState {
  return mergeCourseCatalogFromLegacyLists(stored, seed);
}

export function mergeLegacyScenariosWithSeed(
  stored: readonly Scenario[],
  seed: readonly Scenario[],
): readonly Scenario[] {
  return mergeScenariosWithDefaults(stored, seed);
}

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

function applyCourseOverlay(base: Course, overlayEntry?: Course | CoursePatch): Course {
  if (!overlayEntry) {
    return base;
  }

  if (isCompleteCourse(overlayEntry)) {
    return mergeStoredCourse(overlayEntry, base);
  }

  return mergeStoredCourse({ ...base, ...overlayEntry } as Course, base);
}

function applyLessonOverlay(base: Lesson, overlayEntry?: Lesson | LessonPatch): Lesson {
  if (!overlayEntry) {
    return base;
  }

  if (isCompleteLesson(overlayEntry)) {
    return mergeStoredLesson(overlayEntry, base);
  }

  return mergeStoredLesson({ ...base, ...overlayEntry } as Lesson, base);
}

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

  return patch;
}

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

function cardsDiffer(resolved: Card, seed: Card): boolean {
  return JSON.stringify(resolved) !== JSON.stringify(seed);
}

function isCompleteCourse(value: Course | CoursePatch): value is Course {
  return (
    typeof (value as Course).languagePair === 'object' &&
    Array.isArray((value as Course).lessonIds) &&
    typeof (value as Course).authorId === 'string'
  );
}

function isCompleteLesson(value: Lesson | LessonPatch): value is Lesson {
  return (
    typeof (value as Lesson).courseId === 'string' &&
    Array.isArray((value as Lesson).scenarioIds)
  );
}

function isCompleteScenario(value: Scenario | ScenarioPatch): value is Scenario {
  return (
    typeof (value as Scenario).authorId === 'string' &&
    typeof (value as Scenario).cardSource === 'object'
  );
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function uniqueIds(ids: readonly string[]): readonly string[] {
  return [...new Set(ids.filter(Boolean))];
}
