import type { CardSearchCriteria } from './card-search.types';

/**
 * Sort order for dynamically assembled card sets.
 *
 * @remarks
 * `updatedAt` — newest first; `difficulty` — by difficulty level; `random` — shuffled.
 */
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

/**
 * Extracted mode type from `ScenarioCardSource` union.
 *
 * @remarks
 * Can be `'fixed'`, `'criteria'`, or `'snapshot'`. Used for type narrowing and discriminated unions.
 */
export type ScenarioCardSourceMode = ScenarioCardSource['mode'];
