import { computed, effect, type Signal, signal, type WritableSignal } from '@angular/core';
import type { PageEvent } from '@angular/material/paginator';

import { clampPageIndex, paginateItems } from './paginate-items';
import type { PaginationOptions } from './pagination.types';

export type PaginationStateController = {
  pageIndex: WritableSignal<number>;
  pageSize: WritableSignal<number>;
  pageSizeOptions: readonly number[];
  onPageChange: (event: PageEvent) => void;
  createSlice: <T>(items: Signal<readonly T[]>) => Signal<readonly T[]>;
  bindItemCount: (count: Signal<number>) => void;
};

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
