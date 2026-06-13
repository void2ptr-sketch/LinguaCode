import { CardKind, Scenario } from '../../../core/models';

export type CardCatalogItem = {
  id: string;
  kind: CardKind;
  title: string;
};

export type CardCatalogFixture = {
  cards: readonly CardCatalogItem[];
};

export type ScenarioDraft = {
  title: string;
  description: string;
  cardIds: readonly string[];
};

export type ScenarioEditorMode = 'list' | 'create' | 'edit';

export type ScenarioBuilderState = {
  scenarios: readonly Scenario[];
  catalog: readonly CardCatalogItem[];
  loading: boolean;
  error: string | null;
  editorMode: ScenarioEditorMode;
  editingScenarioId: string | null;
};
