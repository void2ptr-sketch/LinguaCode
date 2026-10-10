import { computed, effect, type Signal, signal, type WritableSignal } from '@angular/core';
import type { PageEvent } from '@angular/material/paginator';

import { clampPageIndex, paginateItems } from '../../utils/pagination/paginate-items';
import type { PaginationOptions } from '../../utils/pagination/pagination.types';

/**
 * Controller returned by `createPaginationState`, providing signals and helpers
 * for binding Angular Material's `MatPaginator` to local state.
 */
export type PaginationStateController = {
  /** Current zero-based page index. */
  pageIndex: WritableSignal<number>;
  /** Number of items per page. */
  pageSize: WritableSignal<number>;
  /** Available page size options for the paginator UI. */
  pageSizeOptions: readonly number[];
  /** Handler to call with `PageEvent` from `MatPaginator`. */
  onPageChange: (event: PageEvent) => void;
  /** Creates a computed signal that slices a items signal by current pagination state. */
  createSlice: <T>(items: Signal<readonly T[]>) => Signal<readonly T[]>;
  /** Binds the item count signal so that the page index auto-adjusts when items change. */
  bindItemCount: (count: Signal<number>) => void;
};

/**
 * Creates a pagination state controller for use with Angular Material's paginator.
 *
 * @param options - Configuration for initial page size and page size options.
 * @returns A `PaginationStateController` with signals and helper functions.
 *
 * @remarks
 * The returned controller manages `pageIndex` and `pageSize` as writable signals,
 * provides a `createSlice` helper for computing the current page's items, and
 * `bindItemCount` to auto-clamp the page index when the total item count changes.
 */
export function createPaginationState(options: PaginationOptions = {}): PaginationStateController {
  const pageIndex = signal(0);
  const pageSize = signal(options.initialPageSize ?? 10);
  const pageSizeOptions = options.pageSizeOptions ?? [5, 10, 25];

  const createSlice = <T>(items: Signal<readonly T[]>) =>
    computed(() => paginateItems(items(), pageIndex(), pageSize()).items);

  const bindItemCount = (count: Signal<number>) => {
    effect(() => {
      const nextPageIndex = clampPageIndex(count(), pageIndex(), pageSize());
      if (pageIndex() !== nextPageIndex) {
        pageIndex.set(nextPageIndex);
      }
    });
  };

  const onPageChange = (event: PageEvent) => {
    pageIndex.set(event.pageIndex);
    pageSize.set(event.pageSize);
  };

  return {
    pageIndex,
    pageSize,
    pageSizeOptions,
    onPageChange,
    createSlice,
    bindItemCount,
  };
}
