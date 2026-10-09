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

/** Уровень владения изучаемым языком (настройка строгости проверки ответов). */
export const LEARNING_PROFICIENCY_LEVELS: readonly LearningProficiencyOption[] = [
  { id: 'new-to-language', label: 'New to language' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'elementary', label: 'Elementary' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'upper-intermediate', label: 'Upper Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'professional', label: 'Professional' },
] as const;

export const DEFAULT_LEARNING_PROFICIENCY_LEVEL: LearningProficiencyLevel = 'beginner';

export const LEARNING_PROFICIENCY_LEVEL_IDS: readonly LearningProficiencyLevel[] =
  LEARNING_PROFICIENCY_LEVELS.map((level) => level.id);
