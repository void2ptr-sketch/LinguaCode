/**
 * Mode of the lesson builder dialog.
 *
 * @remarks
 * `create` — new lesson within a program; `edit` — existing lesson.
 */
export type LessonBuilderDialogMode = 'create' | 'edit';

/**
 * Data passed to the lesson builder dialog.
 *
 * @remarks
 * `lessonId` is required in edit mode; `programId` is used in create mode to
 * link the new lesson to its parent program.
 */
export type LessonBuilderDialogData = {
  /** Dialog mode: create or edit. */
  mode: LessonBuilderDialogMode;
  /** Lesson ID when in edit mode. */
  lessonId?: string;
  /** Parent program ID when in create mode. */
  programId?: string;
};

/**
 * Result returned from the lesson builder dialog.
 *
 * @remarks
 * `saved: true` indicates the lesson was successfully saved; `false` means
 * the user discarded changes.
 */
export type LessonBuilderDialogResult = {
  saved: boolean;
};
