import type { CardSearchCriteria, LanguagePair, ScenarioCardSource } from '../../../core/models';

/** Type alias for the card source mode field of a scenario. */
export type ScenarioCardSourceMode = ScenarioCardSource['mode'];

/**
 * Draft representation of a scenario for the editor.
 *
 * @remarks
 * Does not include `id`, `authorId`, or `updatedAt` — these are set by the backend.
 */
export type ScenarioDraft = {
  title: string;
  description: string;
  cardSource: ScenarioCardSource;
  published: boolean;
  languagePair?: LanguagePair;
};

/**
 * Mode of the scenario editor UI.
 *
 * - `list` — shows the scenario catalog.
 * - `create` — shows the scenario creation form.
 * - `edit` — shows the scenario editing form.
 */
export type ScenarioEditorMode = 'list' | 'create' | 'edit';

/**
 * Full state of the scenario builder feature.
 *
 * @remarks
 * Managed by `ScenarioBuilderStore`; consumed by page and dialog components.
 */
export type ScenarioBuilderState = {
  scenarios: readonly import('../../../core/models').Scenario[];
  loading: boolean;
  error: string | null;
  editorMode: ScenarioEditorMode;
  editingScenarioId: string | null;
};

/**
 * Draft of search criteria used in scenario card selection.
 *
 * @remarks
 * Omits pagination fields since the criteria editor handles page state separately.
 */
export type ScenarioCriteriaDraft = Omit<CardSearchCriteria, 'page'>;
