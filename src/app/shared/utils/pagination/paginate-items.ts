import type { PaginationSlice } from './pagination.types';

/**
 * Clamps a page index to the valid range `[0, totalPages - 1]`.
 *
 * @param totalItems - The total number of items.
 * @param pageIndex - The current page index to clamp.
 * @param pageSize - The number of items per page.
 * @returns The clamped page index.
 */
export function clampPageIndex(totalItems: number, pageIndex: number, pageSize: number): number {
  const maxPage = Math.max(0, Math.ceil(totalItems / pageSize) - 1);
  return Math.min(pageIndex, maxPage);
}

/**
 * Slices an array into a `PaginationSlice` for the given page.
 *
 * @param items - The full array of items to paginate.
 * @param pageIndex - The zero-based page index.
 * @param pageSize - The number of items per page.
 * @returns A `PaginationSlice` containing the items for the requested page and metadata.
 *
 * @remarks
 * The page index is clamped to a valid range before slicing.
 */
export function paginateItems<T>(
  items: readonly T[],
  pageIndex: number,
  pageSize: number,
): PaginationSlice<T> {
  const safePageIndex = clampPageIndex(items.length, pageIndex, pageSize);
  const start = safePageIndex * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    pageIndex: safePageIndex,
    pageSize,
    totalItems: items.length,
  };
}
