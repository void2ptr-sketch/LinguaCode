import type { ScenarioIndexEntry, ScenarioSearchCriteria } from '../models';
import { scenarioIndexMatchesLanguageCriteria } from './language-pair-scope.utils';

export function filterScenarioIndex(
  entries: readonly ScenarioIndexEntry[],
  criteria: Omit<ScenarioSearchCriteria, 'page'>,
  currentUserId: string,
): readonly ScenarioIndexEntry[] {
  return entries.filter((entry) => matchesScenarioIndexEntry(entry, criteria, currentUserId));
}

export function matchesScenarioIndexEntry(
  entry: ScenarioIndexEntry,
  criteria: Omit<ScenarioSearchCriteria, 'page'>,
  currentUserId: string,
): boolean {
  const scope = criteria.scope ?? 'mine';

  if (scope === 'mine' && entry.authorId !== currentUserId) {
    return false;
  }

  if (scope === 'published' && !entry.published && entry.authorId !== currentUserId) {
    return false;
  }

  if (criteria.authorId && entry.authorId !== criteria.authorId) {
    return false;
  }

  if (criteria.cardSourceMode && entry.cardSourceMode !== criteria.cardSourceMode) {
    return false;
  }

  if (criteria.courseId && entry.courseId !== criteria.courseId) {
    return false;
  }

  if (criteria.query?.trim()) {
    const query = criteria.query.trim().toLowerCase();
    const haystack = `${entry.title} ${entry.authorId}`.toLowerCase();
    if (!haystack.includes(query)) {
      return false;
    }
  }

  if (
    !scenarioIndexMatchesLanguageCriteria(entry, criteria.knownLanguage, criteria.learningLanguage)
  ) {
    return false;
  }

  return true;
}
