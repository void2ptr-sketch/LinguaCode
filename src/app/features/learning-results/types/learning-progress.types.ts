import { LearningResult } from '../../../core/models';

export type ScenarioProgress = {
  scenarioId: string;
  total: number;
  correct: number;
};

export type LearningProgressSummary = {
  total: number;
  correct: number;
  accuracyPercent: number;
};

export type RecentLearningResult = LearningResult & {
  formattedDate: string;
};
