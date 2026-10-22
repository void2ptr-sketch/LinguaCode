import type { CourseAuthoring } from '../../../entities/course/model';

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
 * Contains the full course structure including programs (each with lessons) and authoring notes.
 */
export type CourseFormDraft = {
  title: string;
  description: string;
  published: boolean;
  authoring: CourseAuthoring;
  programs: readonly ProgramFormDraft[];
};

/**
 * Mode of the course editor UI.
 *
 * - `list` — shows the course catalog.
 * - `create` — shows the course creation form.
 * - `edit` — shows the course editing form.
 */
export type CourseEditorMode = 'list' | 'create' | 'edit';
