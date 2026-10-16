// ===== Components =====
export * from './components';

// ===== Services =====
// Re-exported from entities layer (moved for FSD compliance)
export { LearningDashboardService } from '../../entities/learning/services';

// ===== Utils / Types =====
export type { HomeSectionLink, HomeTab } from './types/home-tab.types';
export type { ContinueLinkQueryParams } from './types/learning-dashboard.types';
export {
  buildContinueLinkQueryParams,
  continueButtonLabel,
} from './types/learning-dashboard.types';
