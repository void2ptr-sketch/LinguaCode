import type { LearningSessionPreferences, UserLanguagePairEntry } from '../../models';

function optionalId(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Normalises raw learning session preferences, returning `undefined` for empty or invalid input.
 *
 * Strips empty or whitespace-only ID fields. Returns a partial `LearningSessionPreferences`
 * object only when at least one meaningful field is present.
 *
 * @param raw — Raw preferences to normalise.
 * @returns Normalised preferences, or `undefined` if no valid fields are present.
 */
export function normalizeLearningSessionPreferences(
  raw?: Partial<LearningSessionPreferences> | null,
): LearningSessionPreferences | undefined {
  if (!raw) {
    return undefined;
  }

  const activeCourseId = optionalId(raw.activeCourseId);
  const lastLessonId = optionalId(raw.lastLessonId);
  const lastScenarioId = optionalId(raw.lastScenarioId);

  if (!activeCourseId && !lastLessonId && !lastScenarioId) {
    return undefined;
  }

  return {
    ...(activeCourseId ? { activeCourseId } : {}),
    ...(lastLessonId ? { lastLessonId } : {}),
    ...(lastScenarioId ? { lastScenarioId } : {}),
  };
}

/**
 * Extracts and normalises learning session preferences from a user language pair entry.
 *
 * Returns an empty object when the entry or its learning settings are missing.
 *
 * @param entry — User language pair entry, possibly `null` or `undefined`.
 * @returns Normalised learning session preferences.
 */
export function resolveLearningSessionForPair(
  entry: UserLanguagePairEntry | null | undefined,
): LearningSessionPreferences {
  return normalizeLearningSessionPreferences(entry?.settings?.learning) ?? {};
}
