import type { Card } from '../../models';
import type { Course, Lesson } from '../../models';
import type { Scenario } from '../../models';

import type { CardIndexMetaOverride } from '../cards/card-index.mapper';

export const USER_CONTENT_OVERLAY_VERSION = 1 as const;
export const USER_CONTENT_OVERLAY_KEY = 'lingua-code.user-content.v1';
export const USER_CONTENT_MIGRATED_KEY = 'lingua-code.user-content.migrated-v1';

/** Legacy keys migrated into the overlay on first run. */
export const LEGACY_COURSE_CATALOG_KEY = 'lingua-code.course-catalog';
export const LEGACY_SCENARIOS_KEY = 'lingua-code.scenarios';
export const LEGACY_CARDS_KEY = 'lingua-code.cards';
export const LEGACY_CARD_INDEX_META_KEY = 'lingua-code.card-index-meta';

export type CoursePatch = Partial<
  Pick<Course, 'title' | 'description' | 'published' | 'updatedAt' | 'lessonIds' | 'authoring'>
>;

export type LessonPatch = Partial<
  Pick<
    Lesson,
    'title' | 'description' | 'scenarioIds' | 'prerequisiteLessonIds' | 'order' | 'updatedAt'
  >
>;

export type ScenarioPatch = Partial<
  Pick<Scenario, 'title' | 'description' | 'published' | 'updatedAt'>
>;

export type UserContentDeletedIds = {
  courses?: readonly string[];
  lessons?: readonly string[];
  scenarios?: readonly string[];
  cards?: readonly string[];
};

export type UserContentOverlay = {
  version: typeof USER_CONTENT_OVERLAY_VERSION;
  courses: Record<string, Course | CoursePatch>;
  lessons: Record<string, Lesson | LessonPatch>;
  scenarios: Record<string, Scenario | ScenarioPatch>;
  cards: Record<string, Card>;
  cardIndexMeta: Record<string, CardIndexMetaOverride>;
  deletedSystemIds?: UserContentDeletedIds;
};
