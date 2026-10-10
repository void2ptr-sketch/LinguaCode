/**
 * Data passed to the scenario builder dialog.
 *
 * @remarks
 * Discriminated union: `mode: 'create'` for new scenarios;
 * `mode: 'edit'` includes the scenario ID to edit.
 */
export type ScenarioBuilderDialogData = { mode: 'create' } | { mode: 'edit'; scenarioId: string };

/**
 * Result returned from the scenario builder dialog.
 *
 * @remarks
 * `saved: true` indicates the scenario was successfully saved; `false` means the user discarded changes.
 */
export type ScenarioBuilderDialogResult = {
  saved: boolean;
};
