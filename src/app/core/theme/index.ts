// ===== Services =====
export { AppThemeService } from './app-theme.service';

// ===== Types =====
export type { AppColorScheme } from './app-color-scheme.types';
export { DEFAULT_APP_COLOR_SCHEME } from './app-color-scheme.types';

// ===== Utils =====
export {
  isAllowedColorScheme,
  normalizeColorScheme,
  readStoredColorScheme,
  applyColorSchemeToDocument,
} from './app-color-scheme.utils';
