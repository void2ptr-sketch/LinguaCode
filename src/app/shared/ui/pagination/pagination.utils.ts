import type { PageRequest, PageResponse } from './pagination.types';

export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZE_OPTIONS: readonly number[] = [20, 50, 100];

export function totalPages(totalItems: number, pageSize: number): number {
  if (pageSize <= 0) {
    return 0;
  }

  return Math.ceil(totalItems / pageSize);
}

export function clampPage(page: number, totalItems: number, pageSize: number): number {
  const maxPage = Math.max(0, totalPages(totalItems, pageSize) - 1);
  return Math.min(Math.max(0, page), maxPage);
}

export function toOffsetLimit(request: PageRequest): { offset: number; limit: number } {
  return {
    offset: request.page * request.pageSize,
    limit: request.pageSize,
  };
}

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

/** Client-side / mock: нарезка массива по `PageRequest`. */
export function paginateArray<T>(items: readonly T[], request: PageRequest): PageResponse<T> {
  const page = clampPage(request.page, items.length, request.pageSize);
  const { offset, limit } = toOffsetLimit({ page, pageSize: request.pageSize });
  const slice = items.slice(offset, offset + limit);

  return createPageResponse(slice, items.length, { page, pageSize: request.pageSize });
}
