import type { PageResponse } from '../../shared/pagination';

import type { ContentLanguage } from './card-index.types';

export type CourseIndexEntry = {
  id: string;
  title: string;
  authorId: string;
  lessonCount: number;
  published: boolean;
  updatedAt: string;
  languagePairSummary: string;
};

export type CourseListScope = 'mine' | 'all' | 'published';

export type CourseSearchCriteria = {
  query?: string;
  authorId?: string;
  scope?: CourseListScope;
  knownLanguage?: ContentLanguage;
  learningLanguage?: ContentLanguage;
  page: import('../../shared/pagination').PageRequest;
};

export type CourseSearchPage = PageResponse<CourseIndexEntry>;
