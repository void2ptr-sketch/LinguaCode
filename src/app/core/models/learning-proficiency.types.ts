/**
 * User's proficiency level in the learning language.
 *
 * @remarks
 * Affects the strictness of answer checking. Mapped to CEFR-like levels.
 */
export type LearningProficiencyLevel =
  | 'new-to-language'
  | 'beginner'
  | 'elementary'
  | 'intermediate'
  | 'upper-intermediate'
  | 'advanced'
  | 'professional';

/** A selectable proficiency level option displayed in the UI. */
export type LearningProficiencyOption = {
  id: LearningProficiencyLevel;
  label: string;
};

/**
 * All proficiency level options displayed in the UI selector.
 *
 * @remarks
 * Mapped to CEFR-like levels. Affects the strictness of answer checking in `LearningResultsStore`.
 */
export const LEARNING_PROFICIENCY_LEVELS: readonly LearningProficiencyOption[] = [
  { id: 'new-to-language', label: 'New to language' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'elementary', label: 'Elementary' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'upper-intermediate', label: 'Upper Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'professional', label: 'Professional' },
] as const;

/** Default proficiency level applied when no user preference exists. */
export const DEFAULT_LEARNING_PROFICIENCY_LEVEL: LearningProficiencyLevel = 'beginner';

/**
 * Array of all proficiency level IDs.
 *
 * @remarks
 * Derived from `LEARNING_PROFICIENCY_LEVELS` for validation and dropdown population.
 */
export const LEARNING_PROFICIENCY_LEVEL_IDS: readonly LearningProficiencyLevel[] =
  LEARNING_PROFICIENCY_LEVELS.map((level) => level.id);
