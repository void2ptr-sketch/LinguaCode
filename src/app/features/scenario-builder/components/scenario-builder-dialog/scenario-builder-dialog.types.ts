/**
 * Data passed to the scenario builder dialog.
 *
 * @remarks
 * Discriminated union: `mode: 'create'` for new scenarios;
 * `mode: 'edit'` includes the scenario ID to edit.
 */
export type ScenarioBuilderDialogData =
  | { mode: 'create'; lessonId?: string }
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
