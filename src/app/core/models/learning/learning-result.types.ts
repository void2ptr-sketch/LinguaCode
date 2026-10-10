import type { CardDirection, LanguagePair } from '../common/language-pair.types';

/**
 * A single answer result recorded during a learning session.
 *
 * @remarks
 * Stored in LearningResultsStore and used for progress tracking and analytics.
 */
export type LearningResult = {
  id: string;
  userId: string;
  cardId: string;
  scenarioId: string;
  correct: boolean;
  answeredAt: string;
  languagePair: LanguagePair;
  direction?: CardDirection;
  lessonId?: string;
  courseId?: string;
};
