// Re-export color scheme types from core/models (single source of truth).
// The theme layer (AppThemeService) consumes them from there.
/* eslint-disable no-restricted-imports -- intentional re-export shim */
export type { AppColorScheme } from '../models/app-color-scheme.types';
export { DEFAULT_APP_COLOR_SCHEME } from '../models/app-color-scheme.types';
