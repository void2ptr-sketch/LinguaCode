export type ScenarioBuilderDialogData = { mode: 'create' } | { mode: 'edit'; scenarioId: string };

export type ScenarioBuilderDialogResult = {
  saved: boolean;
};
