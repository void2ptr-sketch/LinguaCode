export type CourseBuilderDialogMode = 'create' | 'edit';

export type CourseBuilderDialogData = {
  mode: CourseBuilderDialogMode;
  courseId: string;
};

export type CourseBuilderDialogResult = {
  saved: boolean;
};
