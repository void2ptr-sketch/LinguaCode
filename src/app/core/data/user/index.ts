// ===== Constants =====
export {
  isEditableContentAuthor,
  isSystemAuthor,
  SYSTEM_AUTHOR_ID,
} from './system-author.constants';

// ===== Types =====
export type { UserContentOverlay } from './user-content-overlay.types';
export { USER_CONTENT_OVERLAY_KEY } from './user-content-overlay.types';

// ===== Utils =====
export {
  migrateUserContentOverlayIfNeeded,
} from './user-content-overlay.migration';
export {
  repairUserContentOverlayIfNeeded,
  PERL_INTERVIEW_COURSE_TITLE,
  PERL_INTERVIEW_COURSE_ID,
  RU_PERL_LANGUAGE_PAIR,
} from './user-content-overlay.repair';
export {
  resolveCourseCatalog,
  resolveScenarios,
  resolveCards,
} from './user-content-overlay.resolver';
export {
  readUserContentOverlay,
  writeUserContentOverlay,
  emptyUserContentOverlay,
} from './user-content-overlay.storage';
export {
  normalizeUserPreferences,
  resolveCjkLearningForPair,
  resolvePhoneticForPair,
  findLanguagePairEntryId,
  createUserLanguagePairEntry,
} from './user-language-pair.utils';
