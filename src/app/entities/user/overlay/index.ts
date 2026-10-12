// ===== Types =====
export {
  USER_CONTENT_OVERLAY_VERSION,
  USER_CONTENT_OVERLAY_KEY,
  USER_CONTENT_MIGRATED_KEY,
  LEGACY_COURSE_CATALOG_KEY,
  LEGACY_SCENARIOS_KEY,
  LEGACY_CARDS_KEY,
  LEGACY_CARD_INDEX_META_KEY,
  type CoursePatch,
  type LessonPatch,
  type ScenarioPatch,
  type UserContentDeletedIds,
  type UserContentOverlay,
} from './user-content-overlay.types';

// ===== Resolver =====
export {
  resolveCourseCatalog,
  resolveScenarios,
  resolveCards,
  computeCourseCatalogOverlay,
  computeScenariosOverlay,
  computeCardsOverlay,
  mergeLegacyCourseCatalogWithSeed,
  mergeLegacyScenariosWithSeed,
} from './user-content-overlay.resolver';

// ===== Repair / Migration =====
export {
  repairUserContentOverlayIfNeeded,
  bindPerlInterviewCourseLanguagePair,
  migratePerlInterviewAuthoringToSeed,
  USER_CONTENT_OVERLAY_REPAIR_KEY,
  USER_CONTENT_OVERLAY_REPAIR_VERSION,
  PERL_INTERVIEW_COURSE_TITLE,
  PERL_INTERVIEW_COURSE_ID,
  RU_PERL_LANGUAGE_PAIR,
} from './user-content-overlay.repair';
export { migrateUserContentOverlayIfNeeded } from './user-content-overlay.migration';

// ===== Storage =====
export {
  emptyUserContentOverlay,
  readUserContentOverlay,
  writeUserContentOverlay,
  patchUserContentOverlay,
} from './user-content-overlay.storage';
