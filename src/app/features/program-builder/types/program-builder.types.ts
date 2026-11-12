/**
 * Draft of a program being created or edited in the program builder dialog.
 *
 * @remarks
 * Contains only the fields editable in the dialog. Lesson composition
 * (`lessonIds`) is intentionally NOT part of the draft — it is managed in the
 * course builder and is not accepted by the programs API contract.
 */
export type ProgramFormDraft = {
  /** Program ID (present in edit mode). */
  id?: string;
  /** ID of the parent course. Required for creation. */
  courseId: string;
  /** Display title of the program (1–200 characters). */
  title: string;
  /** Program description shown in the catalog. */
  description: string;
  /** Display order within the parent course (kept from the loaded program). */
  order?: number;
};

/**
 * Mode of the program builder dialog.
 *
 * @remarks
 * `create` — new program within a course; `edit` — existing program.
 */
export type ProgramBuilderDialogMode = 'create' | 'edit';

/**
 * Data passed to the program builder dialog.
 *
 * @remarks
 * `programId` is required in edit mode; `courseId` is used in create mode to
 * link the new program to its parent course.
 */
export type ProgramBuilderDialogData = {
  /** Dialog mode: create or edit. */
  mode: ProgramBuilderDialogMode;
  /** Program ID when in edit mode. */
  programId?: string;
  /** Parent course ID when in create mode. */
  courseId?: string;
};

/**
 * Result returned from the program builder dialog.
 *
 * @remarks
 * `saved: true` indicates the program was successfully saved; `false` means
 * the user discarded changes.
 */
export type ProgramBuilderDialogResult = {
  saved: boolean;
};
