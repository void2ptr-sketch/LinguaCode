// ===== Services =====
export { AppThemeService } from './app-theme.service';

// ===== Types =====
export type { AppColorScheme } from '../../shared/theme/app-color-scheme.types';
export { DEFAULT_APP_COLOR_SCHEME } from '../../shared/theme/app-color-scheme.types';

// ===== Utils =====
export {
  isAllowedColorScheme,
  normalizeColorScheme,
  readStoredColorScheme,
  applyColorSchemeToDocument,
} from '../../entities/user/lib/app-color-scheme.utils';
