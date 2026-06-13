import type { CardDirection, LanguagePair } from './language-pair.types';

export type LearningResult = {
  id: string;
  userId: string;
  cardId: string;
  scenarioId: string;
  correct: boolean;
  answeredAt: string;
  languagePair: LanguagePair;
  direction?: CardDirection;
};
