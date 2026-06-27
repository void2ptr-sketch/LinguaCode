import type { CardDifficulty } from './card-index.types';

/** Режим навигации в «Практике» (`/cards/select`). */
export type CoursePracticeMode = 'guided' | 'open';

export type CoursePracticeSettings = {
  /** guided — линейно: урок → сценарии урока; open — свободный выбор в рамках программы. */
  mode: CoursePracticeMode;
  /** false для open: сценарии доступны без выбора урока. */
  requireLessonForScenarios?: boolean;
  /** false для open: уроки не блокируются prerequisite в practice. */
  enforceLessonPrerequisites?: boolean;
  /** chips beginner / intermediate / advanced на вкладке «Сценарии». */
  allowDifficultyFilter?: boolean;
};

export const DEFAULT_COURSE_PRACTICE_SETTINGS: CoursePracticeSettings = {
  mode: 'guided',
  requireLessonForScenarios: true,
  enforceLessonPrerequisites: true,
  allowDifficultyFilter: false,
};

export type CoursePracticeDifficultyFilter = CardDifficulty | null;
