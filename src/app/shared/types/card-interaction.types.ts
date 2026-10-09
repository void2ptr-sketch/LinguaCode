import type { LearningProficiencyLevel } from '../../core/models/learning-proficiency.types';
import type { DrawAnswerPayload } from './draw-answer.types';

export type { DrawAnswerPayload } from './draw-answer.types';

/**
 * Feedback state after checking a card answer.
 *
 * @remarks
 * `null` means the answer has not been checked yet.
 */
export type CardFeedback = 'correct' | 'incorrect' | null;

/**
 * Aggregated answer state for a card interaction session.
 *
 * @remarks
 * Used by `checkCardAnswer` to evaluate the user's response across all card types.
 */
export type CardAnswerState = {
  selectedIndex: number | null;
  answerText: string;
  memoryComplete: boolean;
  drawSubmitted: boolean;
  drawAnswer: DrawAnswerPayload | null;
  learningProficiencyLevel: LearningProficiencyLevel;
};

/**
 * Creates a fresh `CardAnswerState` with default values.
 *
 * @param learningProficiencyLevel - The user's current proficiency level.
 * @returns A new `CardAnswerState` with null/empty defaults.
 */
export const createCardAnswerState = (
  learningProficiencyLevel: LearningProficiencyLevel,
): CardAnswerState => ({
  selectedIndex: null,
  answerText: '',
  memoryComplete: false,
  drawSubmitted: false,
  drawAnswer: null,
  learningProficiencyLevel,
});
