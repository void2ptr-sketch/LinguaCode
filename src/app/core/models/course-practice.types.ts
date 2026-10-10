import type { CardDifficulty } from './card-index.types';

/**
 * Navigation mode in the Practice tab (`/cards/select`).
 *
 * @remarks
 * `guided` — linear progression: lesson → lesson's scenarios.
 * `open` — free choice of scenarios within the program.
 */
export type CoursePracticeMode = 'guided' | 'open';

/**
 * Settings for the Practice tab navigation behavior.
 *
 * @remarks
 * Controls lesson prerequisites, scenario access rules, and difficulty filtering.
 */
export type CoursePracticeSettings = {
  /** `guided` — linear: lesson → lesson's scenarios; `open` — free choice within the program. */
  mode: CoursePracticeMode;
  /** When `false` (open mode): scenarios are accessible without selecting a lesson. */
  requireLessonForScenarios?: boolean;
  /** When `false` (open mode): lessons are not blocked by prerequisites in practice. */
  enforceLessonPrerequisites?: boolean;
  /** Show difficulty chips (beginner / intermediate / advanced) on the Scenarios tab. */
  allowDifficultyFilter?: boolean;
};

/**
 * Default course practice settings applied when no user preferences exist.
 *
 * @remarks
 * Uses `guided` mode with lesson prerequisites enforced; difficulty filter is disabled.
 */
export const DEFAULT_COURSE_PRACTICE_SETTINGS: CoursePracticeSettings = {
  mode: 'guided',
  requireLessonForScenarios: true,
  enforceLessonPrerequisites: true,
  allowDifficultyFilter: false,
};

/**
 * Difficulty filter value for the Practice tab.
 *
 * @remarks
 * `null` means no filter applied (all difficulties shown).
 * Non-null values restrict the scenario picker to scenarios with matching difficulty.
 */
export type CoursePracticeDifficultyFilter = CardDifficulty | null;
