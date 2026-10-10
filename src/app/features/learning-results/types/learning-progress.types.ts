import { LearningResult } from '../../../core/models';

/**
 * Progress statistics for a single scenario.
 *
 * @remarks
 * Aggregated from LearningResultsStore; used in progress displays.
 */
export type ScenarioProgress = {
  scenarioId: string;
  total: number;
  correct: number;
};

/**
 * Overall learning progress summary.
 *
 * @remarks
 * Computed from all learning results for the active language pair.
 */
export type LearningProgressSummary = {
  total: number;
  correct: number;
  accuracyPercent: number;
};

/**
 * A learning result with an additional formatted date field for display.
 *
 * @remarks
 * The `formattedDate` is computed at display time from `answeredAt`.
 */
export type RecentLearningResult = LearningResult & {
  formattedDate: string;
};
