import type { CourseAuthoring } from '../../../core/models/course-authoring.types';

export type LessonFormDraft = {
  clientId: string;
  id?: string;
  title: string;
  description: string;
  scenarioIds: readonly string[];
  prerequisiteLessonIds: readonly string[];
  order: number;
};

export type CourseFormDraft = {
  title: string;
  description: string;
  published: boolean;
  authoring: CourseAuthoring;
  lessons: readonly LessonFormDraft[];
};

export type CourseEditorMode = 'list' | 'create' | 'edit';
