// ===== Services =====
export * from './api';
export * from './search';

// ===== Mapping =====
export * from './mapping';

// ===== Storage =====
export * from './storage';

// ===== Utils =====
export * from './utils';

// Explicit re-export resolves the star-export ambiguity between
// ./storage (re-export from courses-storage) and ./utils.
export type { CourseCatalogState } from './utils/course-catalog-state';
