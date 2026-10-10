import type { Card } from '../../../models';
import type { Course, Lesson } from '../../../models';
import type { Scenario } from '../../../models';

import type { CardIndexMetaOverride } from '../../cards/mapping/card-index.mapper';

/** Current version of the user content overlay schema. */
export const USER_CONTENT_OVERLAY_VERSION = 1 as const;

/** localStorage key for the user content overlay. */
export const USER_CONTENT_OVERLAY_KEY = 'lingua-code.user-content.v1';

/** localStorage key indicating migration to the current overlay version has completed. */
export const USER_CONTENT_MIGRATED_KEY = 'lingua-code.user-content.migrated-v1';

/**
 * Legacy localStorage keys migrated into the overlay on first run.
 *
 * @remarks
 * These keys were used before the overlay consolidation and are read once during migration.
 */
export const LEGACY_COURSE_CATALOG_KEY = 'lingua-code.course-catalog';
export const LEGACY_SCENARIOS_KEY = 'lingua-code.scenarios';
export const LEGACY_CARDS_KEY = 'lingua-code.cards';
export const LEGACY_CARD_INDEX_META_KEY = 'lingua-code.card-index-meta';

/**
 * Partial patch for updating a course in the user content overlay.
 *
 * @remarks
 * Used for incremental updates without replacing the entire course object.
 */
export type CoursePatch = Partial<
  Pick<Course, 'title' | 'description' | 'published' | 'updatedAt' | 'lessonIds' | 'authoring'>
>;

/**
 * Partial patch for updating a lesson in the user content overlay.
 *
 * @remarks
 * Used for incremental updates without replacing the entire lesson object.
 */
export type LessonPatch = Partial<
  Pick<
    Lesson,
    'title' | 'description' | 'scenarioIds' | 'prerequisiteLessonIds' | 'order' | 'updatedAt'
  >
>;

/**
 * Partial patch for updating a scenario in the user content overlay.
 *
 * @remarks
 * Used for incremental updates without replacing the entire scenario object.
 */
export type ScenarioPatch = Partial<
  Pick<Scenario, 'title' | 'description' | 'published' | 'updatedAt'>
>;

/**
 * IDs of deleted entities tracked in the user content overlay.
 *
 * @remarks
 * Used to prevent re-showing deleted system content after user-initiated deletions.
 * Each array contains the IDs of deleted entities of that type.
 */
export type UserContentDeletedIds = {
  /** IDs of deleted courses. */
  courses?: readonly string[];
  /** IDs of deleted lessons. */
  lessons?: readonly string[];
  /** IDs of deleted scenarios. */
  scenarios?: readonly string[];
  /** IDs of deleted cards. */
  cards?: readonly string[];
};

/**
 * User content overlay stored in localStorage.
 *
 * @remarks
 * Merges with or overrides system content (courses, lessons, scenarios, cards).
 * Supports partial patches for incremental updates.
 */
export type UserContentOverlay = {
  version: typeof USER_CONTENT_OVERLAY_VERSION;
  courses: Record<string, Course | CoursePatch>;
  lessons: Record<string, Lesson | LessonPatch>;
  scenarios: Record<string, Scenario | ScenarioPatch>;
  cards: Record<string, Card>;
  cardIndexMeta: Record<string, CardIndexMetaOverride>;
  deletedSystemIds?: UserContentDeletedIds;
};
