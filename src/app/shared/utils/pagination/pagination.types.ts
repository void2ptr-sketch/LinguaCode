export type SortDirection = 'asc' | 'desc';

/**
 * Zero-based page number and page size for API requests.
 *
 * @remarks
 * Used by search services to paginate server-side results.
 */
export type PageRequest = {
  page: number;
  pageSize: number;
};

/**
 * Paginated response from a search or catalog service.
 *
 * @typeParam T - The type of items in the page.
 */
export type PageResponse<T> = {
  items: readonly T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

/** Subset of PageResponse metadata used by UI pagination controls. */
export type PaginationMeta = Pick<
  PageResponse<unknown>,
  'page' | 'pageSize' | 'totalItems' | 'totalPages'
>;

/**
 * Configuration options for pagination UI components.
 *
 * @remarks
 * Controls initial page size and available page size options.
 */
export type PaginationOptions = {
  initialPageSize?: number;
  pageSizeOptions?: readonly number[];
};

/**
 * In-memory pagination slice (follows MatPaginator convention: `pageIndex`).
 *
 * @typeParam T - The type of items in the slice.
 */
export type PaginationSlice<T> = {
  items: readonly T[];
  pageIndex: number;
  pageSize: number;
  totalItems: number;
};
