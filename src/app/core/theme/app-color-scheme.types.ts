// Re-export color scheme types from core/models (single source of truth).
// The theme layer (AppThemeService) consumes them from there.
export type { AppColorScheme } from '../models';
export { DEFAULT_APP_COLOR_SCHEME } from '../models';
