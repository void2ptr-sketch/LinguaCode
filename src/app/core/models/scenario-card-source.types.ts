import type { CardSearchCriteria } from './card-search.types';

export type ScenarioCardSort = 'updatedAt' | 'difficulty' | 'random';

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

export type ScenarioCardSourceMode = ScenarioCardSource['mode'];
