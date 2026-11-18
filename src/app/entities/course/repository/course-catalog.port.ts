import type { LanguagePair } from '../../language-pair/model/language-pair.types';
import type { Card, CardIndexMetaOverride } from '../../card/model';
import type { Scenario } from '../../scenario/model';
import type {
  CourseIndexEntry,
  CoursePracticeSettings,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithPrograms,
} from '../model';

/**
 * Self-contained export payload for a course (flat v2 format).
 *
 * @remarks
 * Flat arrays returned by the backend: courses, programs, lessons, scenarios, cards.
 * Used by authoring/export tooling (CourseBundle JSON, PDF) to build self-contained artifacts.
 * The utility layer converts flat arrays into the nested v2 bundle structure.
 */
export type CourseExportBundle = {
  /** Resolved courses (seed + overlay). */
  courses: readonly import('../model').Course[];
  /** Resolved programs (seed + overlay). */
  programs: readonly import('../../program/model').Program[];
  /** Resolved lessons (seed + overlay). */
  lessons: readonly import('../model').Lesson[];
  /** All scenarios (seed + overlay, resolved). */
  scenarios: readonly Scenario[];
  /** All cards (seed + overlay, resolved). */
  cards: readonly Card[];
  /** Card index metadata from the user-content overlay (optional — may be empty on backend). */
  cardIndexMeta?: Record<string, CardIndexMetaOverride>;
};

/**
 * Payload for creating or updating a program via the courses API.
 *
 * @remarks
 * Used in `CourseWritePayload.programs` to send program data to the backend.
 */
export type ProgramWritePayload = {
  id?: string;
  courseId: string;
  title: string;
  description: string;
  lessonIds: readonly string[];
  lessons?: readonly LessonWritePayload[];
  order: number;
};

/**
 * Minimum subscription tier required to access a course.
 *
 * @remarks
 * Matches the backend `CourseRequiredTier` enum: FREE / STARTER / GROWTH / PREMIUM.
 */
export type CourseRequiredTier = 'FREE' | 'STARTER' | 'GROWTH' | 'PREMIUM';

/**
 * Payload for creating or updating a lesson via the courses API.
 *
 * @remarks
 * Used in `ProgramWritePayload.lessons` to send lesson data to the backend.
 */
export type LessonWritePayload = {
  id?: string;
  programId: string;
  title: string;
  description: string;
  scenarioIds: readonly string[];
  prerequisiteLessonIds?: readonly string[];
  order: number;
};

/**
 * Payload for creating or updating a course via the courses API.
 *
 * @remarks
 * Includes programs (each containing lessons), authoring notes (flat fields
 * matching the backend CourseCreateRequest / CourseUpdateRequest), and language
 * pair information.
 *
 * Authoring fields are flat to match the backend contract:
 * - `authoringStatus` — draft | planned | generating | materialized | failed
 * - `authoringIdea` — Markdown description of the course idea
 * - `ideaUpdatedAt` — ISO 8601 timestamp
 * - `materializedAt` — ISO 8601 timestamp
 * - `lastError` — error message when status is 'failed'
 */
export type CourseWritePayload = {
  title: string;
  description: string;
  published: boolean;
  /** Numeric language pair ID from `language_pairs.id`. Resolved to `{ known, learning }` by the API service. */
  languagePairId?: number;
  /** Legacy: language pair codes (kept for backward compatibility; prefer `languagePairId`). */
  languagePair?: LanguagePair;
  programs: readonly ProgramWritePayload[];
  /** Authoring status: draft | planned | generating | materialized | failed */
  authoringStatus?: string;
  /** Markdown description of the course idea */
  authoringIdea?: string;
  /** ISO 8601 timestamp of the last idea modification */
  ideaUpdatedAt?: string;
  /** ISO 8601 timestamp of the last materialization */
  materializedAt?: string;
  /** Last generation error message (present when status === 'failed'). `null` when no error. */
  lastError: string | null;
  practiceSettings?: CoursePracticeSettings;
  /**
   * Minimum subscription tier required to access the course.
   *
   * @remarks
   * Defaults to `FREE` on the backend if omitted.
   */
  requiredTier?: CourseRequiredTier;
  /**
   * URL-friendly identifier for the course.
   *
   * @remarks
   * Auto-generated from `title` by the backend when omitted or empty.
   */
  slug?: string;
};

/**
 * Data-access contract for the course catalog.
 *
 * @remarks
 * Implemented by `CoursesApiService` (HTTP). Mock handlers implement the same
 * contract server-side. Consumers should depend on this port, not on a concrete
 * implementation, so the data source can be swapped without changing callers.
 */
export type CourseCatalogPort = {
  /**
   * Searches courses by criteria.
   *
   * @param criteria - The search criteria.
   * @returns A page of course index entries.
   */
  search(criteria: CourseSearchCriteria): Promise<CourseSearchPage>;

  /**
   * Retrieves a course with its programs by ID.
   *
   * @param courseId - The course ID.
   * @returns The course with programs.
   */
  getById(courseId: string): Promise<CourseWithPrograms>;

  /**
   * Creates a new course.
   *
   * @param payload - The course write payload.
   * @returns The created course with programs.
   */
  create(payload: CourseWritePayload): Promise<CourseWithPrograms>;

  /**
   * Updates an existing course.
   *
   * @param courseId - The course ID.
   * @param payload - The course write payload.
   * @returns The updated course with programs.
   */
  update(courseId: string, payload: CourseWritePayload): Promise<CourseWithPrograms>;

  /**
   * Deletes a course by ID.
   *
   * @param courseId - The course ID.
   */
  delete(courseId: string): Promise<void>;

  /**
   * Finds all courses that reference a given scenario.
   *
   * @param scenarioId - The scenario ID.
   * @returns Array of course index entries that use this scenario.
   */
  findUsingScenario(scenarioId: string): Promise<readonly CourseIndexEntry[]>;

  /**
   * Retrieves a self-contained export bundle for a course.
   *
   * @param courseId - The course ID.
   * @returns The export bundle with the resolved catalog, programs, lessons, scenarios, cards, and metadata.
   */
  getBundle(courseId: string): Promise<CourseExportBundle>;
};
