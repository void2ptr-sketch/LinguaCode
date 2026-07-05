import type { CourseIndexEntry, CourseSearchCriteria } from '../../models';
import { courseIndexMatchesLanguageCriteria } from '../language-pair/language-pair-scope.utils';

export function filterCourseIndex(
  entries: readonly CourseIndexEntry[],
  criteria: Omit<CourseSearchCriteria, 'page'>,
  currentUserId: string,
): readonly CourseIndexEntry[] {
  return entries.filter((entry) => matchesCourseIndexEntry(entry, criteria, currentUserId));
}

export function matchesCourseIndexEntry(
  entry: CourseIndexEntry,
  criteria: Omit<CourseSearchCriteria, 'page'>,
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

  if (criteria.query?.trim()) {
    const query = criteria.query.trim().toLowerCase();
    const haystack = `${entry.title} ${entry.authorId}`.toLowerCase();
    if (!haystack.includes(query)) {
      return false;
    }
  }

  if (
    !courseIndexMatchesLanguageCriteria(entry, criteria.knownLanguage, criteria.learningLanguage)
  ) {
    return false;
  }

  return true;
}
