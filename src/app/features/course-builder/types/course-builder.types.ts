import type { CourseAuthoring, CoursePracticeSettings } from '../../../entities/course/model';
import type { CourseRequiredTier } from '../../../entities/course/repository/course-catalog.port';

/**
 * Draft representation of a lesson for the program editor form.
 *
 * @remarks
 * Includes a temporary `clientId` for UI tracking before the lesson is persisted.
 */
export type LessonFormDraft = {
  clientId: string;
  id?: string;
  title: string;
  description: string;
  scenarioIds: readonly string[];
  prerequisiteLessonIds: readonly string[];
  order: number;
};

/**
 * Draft representation of a program for the course editor form.
 *
 * @remarks
 * Includes a temporary `clientId` for UI tracking before the program is persisted.
 */
export type ProgramFormDraft = {
  clientId: string;
  id?: string;
  title: string;
  description: string;
  lessons: readonly LessonFormDraft[];
  order: number;
};

/**
 * Draft representation of a course for the course editor form.
 *
 * @remarks
 * Contains the full course structure including programs (each with lessons),
 * authoring notes, practice settings, and language pair.
 */
export type CourseFormDraft = {
  title: string;
  description: string;
  published: boolean;
  authoring: CourseAuthoring;
  practiceSettings?: CoursePracticeSettings;
  programs: readonly ProgramFormDraft[];
  requiredTier?: CourseRequiredTier;
  slug?: string;
  /** Numeric language pair ID from `language_pairs.id`. */
  languagePairId?: number;
};

/**
 * Mode of the course editor UI.
 *
 * - `list` — shows the course catalog.
 * - `create` — shows the course creation form.
 * - `edit` — shows the course editing form.
 */
export type CourseEditorMode = 'list' | 'create' | 'edit';
