import type { PaginationSlice } from './pagination.types';

export function clampPageIndex(totalItems: number, pageIndex: number, pageSize: number): number {
  const maxPage = Math.max(0, Math.ceil(totalItems / pageSize) - 1);
  return Math.min(pageIndex, maxPage);
}

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
