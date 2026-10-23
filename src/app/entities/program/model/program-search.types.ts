import type { PageResponse } from '../../../shared/utils/pagination/pagination.types';

/**
 * Lightweight catalog entry for a program.
 *
 * @remarks
 * Used in program lists, filters, and search results. Does not include full program payload.
 */
export type ProgramIndexEntry = {
  /** Unique program identifier. */
  id: string;
  /** ID of the parent Course this program belongs to. */
  courseId: string;
  /** Display title of the program. */
  title: string;
  /** Display order within the parent Course. */
  order: number;
  /** Number of lessons contained in this program. */
  lessonCount: number;
  /** ISO 8601 timestamp of the last update. */
  updatedAt: string;
};

/**
 * Criteria for searching programs in the catalog.
 *
 * @remarks
 * Used by `ProgramsApiService` to query the program catalog with filters
 * and pagination. All fields are optional except `page`.
 */
export type ProgramSearchCriteria = {
  /** Free-text search query. */
  query?: string;
  /** Filter by parent course ID. */
  courseId?: string;
  /** Pagination parameters. */
  page: import('../../../shared/utils/pagination').PageRequest;
};

/** Paginated search results for program catalog. */
export type ProgramSearchPage = PageResponse<ProgramIndexEntry>;
