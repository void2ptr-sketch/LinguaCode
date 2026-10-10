import type { CourseIndexEntry, CourseSearchCriteria } from '../../../models';
import { courseIndexMatchesLanguageCriteria } from '../../../domain/language-pair/language-pair-scope.utils';

/**
 * Filters course index entries according to the given search criteria and the current user's ID.
 *
 * @param entries - The course index entries to filter.
 * @param criteria - The search criteria (excluding pagination).
 * @param currentUserId - The ID of the current user (for scope filtering).
 * @returns The filtered list of course index entries.
 */
export function filterCourseIndex(
  entries: readonly CourseIndexEntry[],
  criteria: Omit<CourseSearchCriteria, 'page'>,
  currentUserId: string,
): readonly CourseIndexEntry[] {
  return entries.filter((entry) => matchesCourseIndexEntry(entry, criteria, currentUserId));
}

/**
 * Checks whether a single `CourseIndexEntry` matches the given search criteria.
 *
 * @remarks
 * Applies scope filtering (`mine` / `published`), author ID, text query, and language pair constraints.
 *
 * @param entry - The course index entry to check.
 * @param criteria - The search criteria (excluding pagination).
 * @param currentUserId - The ID of the current user (for scope filtering).
 * @returns `true` if the entry matches all criteria, `false` otherwise.
 */
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
