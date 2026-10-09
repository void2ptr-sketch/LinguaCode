import type { CardSearchCriteria } from './card-search.types';

/** Sort order for dynamically assembled card sets. */
export type ScenarioCardSort = 'updatedAt' | 'difficulty' | 'random';

/**
 * Source of cards for a scenario.
 *
 * @remarks
 * Three modes: `fixed` (static list), `criteria` (dynamic search), `snapshot` (frozen search results).
 */
export type ScenarioCardSource =
  | { mode: 'fixed'; cardIds: readonly string[] }
  | {
      mode: 'criteria';
      criteria: Omit<CardSearchCriteria, 'page'>;
      limit?: number;
      sort?: ScenarioCardSort;
      seed?: string;
    }
  | {
      mode: 'snapshot';
      cardIds: readonly string[];
      criteria: Omit<CardSearchCriteria, 'page'>;
      limit?: number;
      frozenAt: string;
    };

/** Extracted mode type from ScenarioCardSource union. */
export type ScenarioCardSourceMode = ScenarioCardSource['mode'];
