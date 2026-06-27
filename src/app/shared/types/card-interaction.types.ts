import type { LearningProficiencyLevel } from '../../core/models/learning-proficiency.types';
import type { DrawAnswerPayload } from './draw-answer.types';

export type { DrawAnswerPayload } from './draw-answer.types';

export type CardFeedback = 'correct' | 'incorrect' | null;

export type CardAnswerState = {
  selectedIndex: number | null;
  answerText: string;
  memoryComplete: boolean;
  drawSubmitted: boolean;
  drawAnswer: DrawAnswerPayload | null;
  learningProficiencyLevel: LearningProficiencyLevel;
};

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
