import type { LanguagePair } from '../../language-pair/model/language-pair.types';
import type { CourseAuthoring } from './course-authoring.types';
import type { CoursePracticeSettings } from './course-practice.types';

export type { CourseAuthoring, CourseAuthoringStatus } from './course-authoring.types';
export { COURSE_AUTHORING_STATUSES } from './course-authoring.types';
export type { CoursePracticeMode, CoursePracticeSettings } from './course-practice.types';
export { DEFAULT_COURSE_PRACTICE_SETTINGS } from './course-practice.types';

/**
 * A course: a catalog of learning programs containing tracks, lessons, scenarios, and cards.
 *
 * @remarks
 * Courses are authored by a user, organized into programs, and scoped to a language pair.
 * The `authoring` field contains the author's idea for course generation (not shown in catalog).
 */
export type Course = {
  /** Unique course identifier. */
  id: string;
  /** Display title of the course. */
  title: string;
  /** Stable human-readable slug for API resolution (e.g. 'course-cpp-complete'). */
  slug?: string;
  /** Course description shown in the catalog. */
  description: string;
  /** ID of the course author. */
  authorId: string;
  /** Numeric language pair ID (from `language_pairs.id`). */
  languagePairId?: number;
  /** Language pair this course teaches (known → learning). Resolved from `languagePairId` by the API service. */
  languagePair: LanguagePair;
  /** IDs of programs contained in this course, in order. */
  programIds: readonly string[];
  /**
   * Optional position of the course in the root catalog (`course_order`).
   *
   * @remarks
   * Reserved for backend integration; when absent the API order is preserved.
   */
  order?: number;
  /** Whether the course is published and visible in the catalog. */
  published: boolean;
  /** ISO 8601 timestamp of the last update. */
  updatedAt: string;
  /** Authoring idea for course generation; not included in CourseIndexEntry. */
  authoring?: CourseAuthoring;
  /** Practice tab settings; defaults to guided (linear) mode. */
  practiceSettings?: CoursePracticeSettings;
};

/**
 * A course with its programs fully resolved.
 *
 * @remarks
 * Used in the course builder and journey map where program details are needed.
 */
export type CourseWithPrograms = Course & {
  /** Resolved program objects with full metadata and lessons. */
  programs: readonly import('../../program/model/program.types').ProgramWithLessons[];
};
