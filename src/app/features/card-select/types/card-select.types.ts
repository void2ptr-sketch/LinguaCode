import { Card } from '../../../core/models';
import { CardFeedback } from '../../../shared/types';

export type CardSelectFixture = {
  scenarioId: string;
  cards: readonly Card[];
};

export type { CardFeedback as CardSelectFeedback };
