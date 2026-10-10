import type { CourseAuthoring } from '../../../core/models';

/**
 * Draft representation of a lesson for the course editor form.
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
 * Draft representation of a course for the course editor form.
 *
 * @remarks
 * Contains the full course structure including lessons and authoring notes.
 */
export type CourseFormDraft = {
  title: string;
  description: string;
  published: boolean;
  authoring: CourseAuthoring;
  lessons: readonly LessonFormDraft[];
};

/**
 * Mode of the course editor UI.
 *
 * - `list` — shows the course catalog.
 * - `create` — shows the course creation form.
 * - `edit` — shows the course editing form.
 */
export type CourseEditorMode = 'list' | 'create' | 'edit';
