/**
 * Last learning session preferences for a language pair.
 *
 * @remarks
 * Used to resume the user's learning progress (G13 group). Tracks the active course,
 * last lesson, and last scenario to provide a "continue where you left off" experience.
 */
export type LearningSessionPreferences = {
  /** ID of the course the user was last working on. */
  activeCourseId?: string;
  /** ID of the last lesson the user visited. */
  lastLessonId?: string;
  /** ID of the last scenario the user attempted. */
  lastScenarioId?: string;
};
