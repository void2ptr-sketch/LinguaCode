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
  lessons: readonly LessonFormDraft[];
};

export type CourseEditorMode = 'list' | 'create' | 'edit';
