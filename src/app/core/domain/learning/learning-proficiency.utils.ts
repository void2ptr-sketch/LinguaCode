import { DEFAULT_LEARNING_PROFICIENCY_LEVEL, LEARNING_PROFICIENCY_LEVEL_IDS, type LearningProficiencyLevel } from '../../models';

const LEGACY_PROFICIENCY_LEVEL_ALIASES: Readonly<Record<string, LearningProficiencyLevel>> = {
  'new-to-chinese': 'new-to-language',
};

/**
 * Type guard that checks whether the given value is a valid learning proficiency level.
 *
 * Returns `true` if the value is a string that matches one of the known proficiency level IDs
 * or a legacy alias supported by the application.
 *
 * @param value — Value to validate.
 * @returns `true` if `value` is a recognised `LearningProficiencyLevel`.
 */
export function isLearningProficiencyLevel(value: unknown): value is LearningProficiencyLevel {
  return (
    typeof value === 'string' &&
    ((LEARNING_PROFICIENCY_LEVEL_IDS as readonly string[]).includes(value) ||
      value in LEGACY_PROFICIENCY_LEVEL_ALIASES)
  );
}

/**
 * Normalises a raw proficiency level value, resolving legacy aliases and falling back to the
 * default level for invalid or missing input.
 *
 * Legacy string aliases (e.g. `'new-to-chinese'`) are mapped to their canonical equivalents.
 * Invalid values default to `DEFAULT_LEARNING_PROFICIENCY_LEVEL`.
 *
 * @param raw — Raw or normalised proficiency level, possibly `null` or `undefined`.
 * @returns A valid `LearningProficiencyLevel`, never `undefined`.
 */
export function normalizeLearningProficiencyLevel(
  raw?: LearningProficiencyLevel | string | null,
): LearningProficiencyLevel {
  if (typeof raw === 'string' && raw in LEGACY_PROFICIENCY_LEVEL_ALIASES) {
    return LEGACY_PROFICIENCY_LEVEL_ALIASES[raw];
  }

  return isLearningProficiencyLevel(raw) ? raw : DEFAULT_LEARNING_PROFICIENCY_LEVEL;
}
