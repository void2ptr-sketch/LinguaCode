/**
 * Draft of a lesson being created or edited in the lesson builder dialog.
 *
 * @remarks
 * Contains only the fields editable in the dialog. Scenario composition
 * (`scenarioIds`) is intentionally NOT part of the draft — scenarios are
 * managed elsewhere (course/scenario builders) and are not editable here.
 */
export type LessonFormDraft = {
  /** Lesson ID (present in edit mode). */
  id?: string;
  /** ID of the parent program. Required for creation. */
  programId: string;
  /** Display title of the lesson (1–200 characters). */
  title: string;
  /** Lesson description shown in the lesson list. */
  description: string;
  /** Display order within the parent program (kept from the loaded lesson). */
  order?: number;
  /** IDs of prerequisite lessons that must be completed first. */
  prerequisiteLessonIds?: readonly string[];
  /** Whether the lesson is published and visible to users. */
  published?: boolean;
  /** Access tier required to view the lesson. */
  requiredTier?: 'FREE' | 'STARTER' | 'GROWTH' | 'PREMIUM';
  /** Numeric language pair ID from `language_pairs.id`, inherited from parent course. */
  languagePairId?: number;
  /** Course ID this lesson belongs to (inherited from parent program → course). */
  courseId?: string;
};

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
