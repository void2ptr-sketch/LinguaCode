import {
  DEFAULT_LEARNING_PROFICIENCY_LEVEL,
  LEARNING_PROFICIENCY_LEVEL_IDS,
  type LearningProficiencyLevel,
} from '../../models/learning-proficiency.types';

const LEGACY_PROFICIENCY_LEVEL_ALIASES: Readonly<Record<string, LearningProficiencyLevel>> = {
  'new-to-chinese': 'new-to-language',
};

export function isLearningProficiencyLevel(value: unknown): value is LearningProficiencyLevel {
  return (
    typeof value === 'string' &&
    ((LEARNING_PROFICIENCY_LEVEL_IDS as readonly string[]).includes(value) ||
      value in LEGACY_PROFICIENCY_LEVEL_ALIASES)
  );
}

export function normalizeLearningProficiencyLevel(
  raw?: LearningProficiencyLevel | string | null,
): LearningProficiencyLevel {
  if (typeof raw === 'string' && raw in LEGACY_PROFICIENCY_LEVEL_ALIASES) {
    return LEGACY_PROFICIENCY_LEVEL_ALIASES[raw];
  }

  return isLearningProficiencyLevel(raw) ? raw : DEFAULT_LEARNING_PROFICIENCY_LEVEL;
}
