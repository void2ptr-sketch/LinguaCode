import type { LanguagePair } from '../../../../entities/language-pair/model/language-pair.types';

/**
 * Data passed to the scenario builder dialog.
 *
 * @remarks
 * Discriminated union: `mode: 'create'` for new scenarios — optionally
 * pre-filled with context from the content explorer tree (course, program,
 * lesson, language pair); `mode: 'edit'` includes the scenario ID to edit.
 */
export type ScenarioBuilderDialogData =
  | {
      mode: 'create';
      lessonId?: string;
      courseId?: string;
      programId?: string;
      languagePair?: LanguagePair;
    }
  | { mode: 'edit'; scenarioId: string };

/**
 * Result returned from the scenario builder dialog.
 *
 * @remarks
 * `saved: true` indicates the scenario was successfully saved; `false` means the user discarded changes.
 * `scenarioId` is set on successful save (create: ID of the newly created scenario;
 * edit: ID of the updated scenario) and stays absent/undefined on cancel.
 */
export type ScenarioBuilderDialogResult = {
  saved: boolean;
  /** ID of the created/updated scenario (present only when `saved: true`). */
  scenarioId?: string;
};
