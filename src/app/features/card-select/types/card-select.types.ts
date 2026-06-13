import { SelectCard } from '../../../core/models';

export type CardSelectFixture = {
  scenarioId: string;
  cards: readonly SelectCard[];
};

export type CardSelectFeedback = 'correct' | 'incorrect' | null;
