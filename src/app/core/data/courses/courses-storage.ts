import {
  cloneCourseCatalog,
  type CourseCatalogState,
} from './course-catalog-state';
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

export function getDefaultCourseCatalog(): CourseCatalogState {
  migrateUserContentOverlayIfNeeded();
  return cloneCourseCatalog(resolveCourseCatalog(getCourseSeedCache(), readUserContentOverlay()));
}

/** @deprecated Use getDefaultCourseCatalog() after content seed preload. */
export const DEFAULT_COURSE_CATALOG: CourseCatalogState = { courses: [], lessons: [] };

export function mergeCourseCatalogWithDefaults(
  stored: CourseCatalogState,
  seed: CourseCatalogState = getCourseSeedCache(),
): CourseCatalogState {
  return mergeLegacyCourseCatalogWithSeed(stored, seed);
}

export function loadCourseCatalogFromStorage(): CourseCatalogState {
  migrateUserContentOverlayIfNeeded();
  return getDefaultCourseCatalog();
}

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
