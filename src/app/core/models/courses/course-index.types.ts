import type { PageResponse } from '../common/pagination.types';

import type { ContentLanguage } from '../cards/card-index.types';

/**
 * Lightweight catalog entry for a course.
 *
 * @remarks
 * Used in course lists, filters, and search results. Does not include full course payload.
 */
export type CourseIndexEntry = {
  id: string;
  title: string;
  authorId: string;
  lessonCount: number;
  published: boolean;
  updatedAt: string;
  languagePairSummary: string;
};

/**
 * Scope filter for course listing.
 *
 * @remarks
 * Determines which set of courses is shown in the catalog:
 * - 'mine' — only courses authored by the current user
 * - 'all' — all courses (including drafts)
 * - 'published' — only published courses
 */
export type CourseListScope = 'mine' | 'all' | 'published';

/**
 * Criteria for searching courses in the catalog.
 *
 * @remarks
 * Used by `CourseSearchService` to query the course catalog with filters
 * and pagination. All fields are optional except `page`.
 */
export type CourseSearchCriteria = {
  /** Free-text search query. */
  query?: string;
  /** Filter by author ID. */
  authorId?: string;
  /** Scope filter (mine, all, or published). */
  scope?: CourseListScope;
  /** Filter by known (source) language. */
  knownLanguage?: ContentLanguage;
  /** Filter by learning (target) language. */
  learningLanguage?: ContentLanguage;
  /** Pagination parameters. */
  page: import('../../../shared/utils/pagination').PageRequest;
};

/** Paginated search results for course catalog. */
export type CourseSearchPage = PageResponse<CourseIndexEntry>;
