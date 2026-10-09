import type { PageResponse } from '../../shared/utils/pagination';

import type { ContentLanguage } from './card-index.types';

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

/** Scope filter for course listing. */
export type CourseListScope = 'mine' | 'all' | 'published';

/** Criteria for searching courses in the catalog. */
export type CourseSearchCriteria = {
  query?: string;
  authorId?: string;
  scope?: CourseListScope;
  knownLanguage?: ContentLanguage;
  learningLanguage?: ContentLanguage;
  page: import('../../shared/utils/pagination').PageRequest;
};

/** Paginated search results for course catalog. */
export type CourseSearchPage = PageResponse<CourseIndexEntry>;
