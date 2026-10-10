import { cloneCourseCatalog, type CourseCatalogState } from './course-catalog-state';
import { getCourseSeedCache } from '../content-seed/content-seed.cache';
import { migrateUserContentOverlayIfNeeded } from '../user/user-content-overlay.migration';
import {
  computeCourseCatalogOverlay,
  mergeLegacyCourseCatalogWithSeed,
  resolveCourseCatalog,
} from '../user/user-content-overlay.resolver';
import {
  patchUserContentOverlay,
  readUserContentOverlay,
} from '../user/user-content-overlay.storage';

export type { CourseCatalogState } from './course-catalog-state';

/** @deprecated Legacy monolithic storage key; migrated into user-content overlay. */
export const COURSE_CATALOG_STORAGE_KEY = 'lingua-code.course-catalog';

/**
 * Loads the default course catalog by applying the user-content overlay on top of the content seed.
 *
 * Runs the legacy migration if needed before resolving the catalog.
 */
export function getDefaultCourseCatalog(): CourseCatalogState {
  migrateUserContentOverlayIfNeeded();
  return cloneCourseCatalog(resolveCourseCatalog(getCourseSeedCache(), readUserContentOverlay()));
}

/** @deprecated Use getDefaultCourseCatalog() after content seed preload. */
export const DEFAULT_COURSE_CATALOG: CourseCatalogState = { courses: [], lessons: [] };

/**
 * Merges a stored (user-modified) course catalog with the seed catalog.
 *
 * Delegates to the overlay resolver to produce a unified catalog with user edits applied on top of the seed.
 */
export function mergeCourseCatalogWithDefaults(
  stored: CourseCatalogState,
  seed: CourseCatalogState = getCourseSeedCache(),
): CourseCatalogState {
  return mergeLegacyCourseCatalogWithSeed(stored, seed);
}

/**
 * Loads the current course catalog from storage (overlay + seed).
 *
 * Runs the legacy migration if needed. This is a thin wrapper around `getDefaultCourseCatalog`.
 */
export function loadCourseCatalogFromStorage(): CourseCatalogState {
  migrateUserContentOverlayIfNeeded();
  return getDefaultCourseCatalog();
}

/**
 * Persists a course catalog to user-content overlay storage.
 *
 * Computes the overlay delta relative to the seed and previous state, then patches the overlay with
 * the new courses, lessons, and deleted system IDs.
 */
export function saveCourseCatalogToStorage(catalog: CourseCatalogState): void {
  migrateUserContentOverlayIfNeeded();
  const seed = getCourseSeedCache();
  const previous = readUserContentOverlay();
  const computed = computeCourseCatalogOverlay(catalog, seed, previous);

  patchUserContentOverlay({
    courses: computed.courses,
    lessons: computed.lessons,
    deletedSystemIds: {
      ...previous.deletedSystemIds,
      courses: computed.deletedSystemIds?.courses,
      lessons: computed.deletedSystemIds?.lessons,
    },
  });
}

/**
 * Reads the stored course catalog from overlay storage, returning `null` when no user data exists.
 *
 * Checks whether the overlay contains any courses, lessons, or deleted-system IDs before attempting to load.
 */
export function readStoredCourseCatalog(): CourseCatalogState | null {
  const overlay = readUserContentOverlay();
  const hasStored =
    Object.keys(overlay.courses).length > 0 ||
    Object.keys(overlay.lessons).length > 0 ||
    Boolean(overlay.deletedSystemIds?.courses?.length || overlay.deletedSystemIds?.lessons?.length);

  if (!hasStored) {
    return null;
  }

  return loadCourseCatalogFromStorage();
}
