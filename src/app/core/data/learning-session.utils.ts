import type { LearningSessionPreferences } from '../models/learning-session.types';
import type { UserLanguagePairEntry } from '../models/user.types';

function optionalId(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

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

export function resolveLearningSessionForPair(
  entry: UserLanguagePairEntry | null | undefined,
): LearningSessionPreferences {
  return normalizeLearningSessionPreferences(entry?.settings?.learning) ?? {};
}
