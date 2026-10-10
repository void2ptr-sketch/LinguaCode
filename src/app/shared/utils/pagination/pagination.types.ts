// Re-export pagination types from core/models (single source of truth).
// Consumers should import from the core/models barrel.
/* eslint-disable no-restricted-imports -- intentional re-export shim */
export type {
  PageRequest,
  PageResponse,
  PaginationMeta,
  PaginationOptions,
  PaginationSlice,
  SortDirection,
} from '../../../core/models/pagination.types';
