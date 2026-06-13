import type { CardSearchCriteria, ScenarioCardSource } from '../../../core/models';

export type ScenarioCardSourceMode = ScenarioCardSource['mode'];

export type ScenarioDraft = {
  title: string;
  description: string;
  cardSource: ScenarioCardSource;
  published: boolean;
};

export type ScenarioEditorMode = 'list' | 'create' | 'edit';

export type ScenarioBuilderState = {
  scenarios: readonly import('../../../core/models').Scenario[];
  loading: boolean;
  error: string | null;
  editorMode: ScenarioEditorMode;
  editingScenarioId: string | null;
};

export type ScenarioCriteriaDraft = Omit<CardSearchCriteria, 'page'>;
