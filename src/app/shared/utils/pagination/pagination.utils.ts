import type { PageRequest, PageResponse } from './pagination.types';

/** Default page size for paginated requests. */
export const DEFAULT_PAGE_SIZE = 50;

/** Available page size options for pagination controls. */
export const PAGE_SIZE_OPTIONS: readonly number[] = [20, 50, 100];

/**
 * Calculates the total number of pages for a given item count and page size.
 *
 * @param totalItems - The total number of items to paginate.
 * @param pageSize - The number of items per page.
 * @returns The total number of pages, or `0` if `pageSize` is non-positive.
 */
export function totalPages(totalItems: number, pageSize: number): number {
  if (pageSize <= 0) {
    return 0;
  }

  return Math.ceil(totalItems / pageSize);
}

/**
 * Clamps a page index to the valid range `[0, totalPages - 1]`.
 *
 * @param page - The page index to clamp.
 * @param totalItems - The total number of items (used to compute max page).
 * @param pageSize - The number of items per page.
 * @returns The clamped page index.
 */
export function clampPage(page: number, totalItems: number, pageSize: number): number {
  const maxPage = Math.max(0, totalPages(totalItems, pageSize) - 1);
  return Math.min(Math.max(0, page), maxPage);
}

/**
 * Converts a `PageRequest` into SQL-style `offset` and `limit` values.
 *
 * @param request - The page request containing page index and size.
 * @returns An object with `offset` and `limit` numbers.
 */
export function toOffsetLimit(request: PageRequest): { offset: number; limit: number } {
  return {
    offset: request.page * request.pageSize,
    limit: request.pageSize,
  };
}

/**
 * Creates a `PageResponse` from a slice of items and pagination metadata.
 *
 * @param items - The items for the current page.
 * @param totalItems - The total number of items across all pages.
 * @param request - The original page request.
 * @returns A fully populated `PageResponse<T>`.
 */
export function createPageResponse<T>(
  items: readonly T[],
  totalItems: number,
  request: PageRequest,
): PageResponse<T> {
  const page = clampPage(request.page, totalItems, request.pageSize);

  return {
    items,
    page,
    pageSize: request.pageSize,
    totalItems,
    totalPages: totalPages(totalItems, request.pageSize),
  };
}

/**
 * Client-side pagination: slices an array according to a `PageRequest`.
 *
 * @param items - The full array of items to paginate.
 * @param request - The page request specifying page index and size.
 * @returns A `PageResponse<T>` containing the sliced items and pagination metadata.
 */
export function paginateArray<T>(items: readonly T[], request: PageRequest): PageResponse<T> {
  const page = clampPage(request.page, items.length, request.pageSize);
  const { offset, limit } = toOffsetLimit({ page, pageSize: request.pageSize });
  const slice = items.slice(offset, offset + limit);

  return createPageResponse(slice, items.length, { page, pageSize: request.pageSize });
}
