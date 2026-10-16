import type { LanguagePair } from '../../language-pair/model/language-pair.types';
import type { Card, CardIndexMetaOverride } from '../../card/model';
import type { Scenario } from '../../scenario/model';
import type {
  CourseAuthoring,
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithLessons,
} from '../model';
import type { CourseCatalogState } from '../utils/course-catalog-state';

/**
 * Self-contained export payload for a course.
 *
 * @remarks
 * Contains the resolved catalog (courses + lessons), all scenarios, all cards,
 * and the user card-index metadata. Used by authoring/export tooling
 * (CourseBundle JSON, PDF) to build self-contained artifacts.
 */
export type CourseExportBundle = {
  /** Resolved course catalog (seed + overlay). */
  catalog: CourseCatalogState;
  /** All scenarios (seed + overlay, resolved). */
  scenarios: readonly Scenario[];
  /** All cards (seed + overlay, resolved). */
  cards: readonly Card[];
  /** Card index metadata from the user-content overlay. */
  cardIndexMeta: Record<string, CardIndexMetaOverride>;
};

/**
 * Payload for creating or updating a lesson via the courses API.
 *
 * @remarks
 * Used in `CourseWritePayload.lessons` to send lesson data to the backend.
 */
export type LessonWritePayload = {
  id?: string;
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
 * Includes lessons, authoring notes, and language pair information.
 */
export type CourseWritePayload = {
  title: string;
  description: string;
  published: boolean;
  languagePair?: LanguagePair;
  lessons: readonly LessonWritePayload[];
  authoring?: CourseAuthoring;
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
   * Retrieves a course with its lessons by ID.
   *
   * @param courseId - The course ID.
   * @returns The course with lessons.
   */
  getById(courseId: string): Promise<CourseWithLessons>;

  /**
   * Creates a new course.
   *
   * @param payload - The course write payload.
   * @returns The created course with lessons.
   */
  create(payload: CourseWritePayload): Promise<CourseWithLessons>;

  /**
   * Updates an existing course.
   *
   * @param courseId - The course ID.
   * @param payload - The course write payload.
   * @returns The updated course with lessons.
   */
  update(courseId: string, payload: CourseWritePayload): Promise<CourseWithLessons>;

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
   * @returns The export bundle with the resolved catalog, scenarios, cards, and metadata.
   */
  getBundle(courseId: string): Promise<CourseExportBundle>;
};
