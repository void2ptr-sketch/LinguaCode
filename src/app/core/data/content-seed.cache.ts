import type { Scenario } from '../models';
import type { Card } from '../models';

import type { CourseCatalogState } from './course-catalog-state';

const EMPTY_COURSE_CATALOG: CourseCatalogState = { courses: [], lessons: [] };

let scenarioSeedCache: readonly Scenario[] = [];
let courseSeedCache: CourseCatalogState = EMPTY_COURSE_CATALOG;
let cardSeedCache: readonly Card[] = [];

export function getScenarioSeedCache(): readonly Scenario[] {
  return scenarioSeedCache;
}

export function getCourseSeedCache(): CourseCatalogState {
  return courseSeedCache;
}

export function getCardSeedCache(): readonly Card[] {
  return cardSeedCache;
}

export function setScenarioSeedCache(scenarios: readonly Scenario[]): void {
  scenarioSeedCache = [...scenarios];
}

export function setCourseSeedCache(catalog: CourseCatalogState): void {
  courseSeedCache = {
    courses: [...catalog.courses],
    lessons: [...catalog.lessons],
  };
}

export function setCardSeedCache(cards: readonly Card[]): void {
  cardSeedCache = [...cards];
}

export function resetContentSeedCache(): void {
  scenarioSeedCache = [];
  courseSeedCache = EMPTY_COURSE_CATALOG;
  cardSeedCache = [];
}

export function isContentSeedCacheReady(): boolean {
  return (
    getScenarioSeedCache().length > 0 &&
    getCourseSeedCache().courses.length > 0 &&
    getCardSeedCache().length > 0
  );
}
