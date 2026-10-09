export type SortDirection = 'asc' | 'desc';

/** Нулевая страница (0-based), размер страницы — для API и store. */
export type PageRequest = {
  page: number;
  pageSize: number;
};

/** Постраничный ответ сервиса поиска / каталога. */
export type PageResponse<T> = {
  items: readonly T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type PaginationMeta = Pick<
  PageResponse<unknown>,
  'page' | 'pageSize' | 'totalItems' | 'totalPages'
>;

export type PaginationOptions = {
  initialPageSize?: number;
  pageSizeOptions?: readonly number[];
};

/** In-memory slice (соглашение MatPaginator: `pageIndex`). */
export type PaginationSlice<T> = {
  items: readonly T[];
  pageIndex: number;
  pageSize: number;
  totalItems: number;
};
