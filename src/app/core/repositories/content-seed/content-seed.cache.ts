import type { Scenario } from '../../models';
import type { Card } from '../../models';

import type { CourseCatalogState } from '../courses/utils/course-catalog-state';

const EMPTY_COURSE_CATALOG: CourseCatalogState = { courses: [], lessons: [] };

let scenarioSeedCache: readonly Scenario[] = [];
let courseSeedCache: CourseCatalogState = EMPTY_COURSE_CATALOG;
let cardSeedCache: readonly Card[] = [];

/**
 * Returns the current scenario seed cache.
 *
 * @returns A readonly array of scenario objects.
 */
export function getScenarioSeedCache(): readonly Scenario[] {
  return scenarioSeedCache;
}

/**
 * Returns the current course seed cache containing courses and lessons.
 *
 * @returns The course catalog state with courses and lessons arrays.
 */
export function getCourseSeedCache(): CourseCatalogState {
  return courseSeedCache;
}

/**
 * Returns the current card seed cache.
 *
 * @returns A readonly array of card objects.
 */
export function getCardSeedCache(): readonly Card[] {
  return cardSeedCache;
}

/**
 * Replaces the scenario seed cache with a shallow copy of the provided array.
 *
 * @param scenarios - The array of scenarios to store in the cache.
 */
export function setScenarioSeedCache(scenarios: readonly Scenario[]): void {
  scenarioSeedCache = [...scenarios];
}

/**
 * Replaces the course seed cache with a shallow copy of the provided catalog state.
 *
 * @param catalog - The course catalog state containing courses and lessons to store.
 */
export function setCourseSeedCache(catalog: CourseCatalogState): void {
  courseSeedCache = {
    courses: [...catalog.courses],
    lessons: [...catalog.lessons],
  };
}

/**
 * Replaces the card seed cache with a shallow copy of the provided array.
 *
 * @param cards - The array of cards to store in the cache.
 */
export function setCardSeedCache(cards: readonly Card[]): void {
  cardSeedCache = [...cards];
}

/**
 * Clears all content seed caches, restoring them to their initial empty state.
 *
 * @remarks
 * Resets scenario, course, and card caches to empty arrays.
 */
export function resetContentSeedCache(): void {
  scenarioSeedCache = [];
  courseSeedCache = EMPTY_COURSE_CATALOG;
  cardSeedCache = [];
}

/**
 * Checks whether all three content seed caches (scenarios, courses, cards) have been populated.
 *
 * @returns `true` if scenarios, courses, and cards arrays are all non-empty; `false` otherwise.
 * @remarks
 * Used to verify that the content seed has been fully loaded before proceeding.
 */
export function isContentSeedCacheReady(): boolean {
  return (
    getScenarioSeedCache().length > 0 &&
    getCourseSeedCache().courses.length > 0 &&
    getCardSeedCache().length > 0
  );
}
