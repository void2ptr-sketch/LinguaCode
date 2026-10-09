/**
 * Mode of the course builder dialog.
 *
 * @remarks
 * `create` — new course; `edit` — existing course.
 */
export type CourseBuilderDialogMode = 'create' | 'edit';

/**
 * Data passed to the course builder dialog.
 *
 * @remarks
 * Contains the mode and optional course ID for editing.
 */
export type CourseBuilderDialogData = {
  /** Dialog mode: create or edit. */
  mode: CourseBuilderDialogMode;
  /** Course ID when in edit mode; empty string in create mode. */
  courseId: string;
};

/**
 * Result returned from the course builder dialog.
 *
 * @remarks
 * `saved: true` indicates the course was successfully saved; `false` means the user discarded changes.
 */
export type CourseBuilderDialogResult = {
  saved: boolean;
};
