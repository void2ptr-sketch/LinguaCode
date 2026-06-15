import { USER_STORAGE_KEY } from '../state/user.persistence';
import { DEFAULT_APP_COLOR_SCHEME, type AppColorScheme } from './app-color-scheme.types';

export function isAllowedColorScheme(value: unknown): value is AppColorScheme {
  return value === 'light' || value === 'dark';
}

export function normalizeColorScheme(value: unknown): AppColorScheme {
  return isAllowedColorScheme(value) ? value : DEFAULT_APP_COLOR_SCHEME;
}

export function readStoredColorScheme(): AppColorScheme {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_APP_COLOR_SCHEME;
    }

    const parsed = JSON.parse(raw) as { preferences?: { colorScheme?: unknown } };
    return normalizeColorScheme(parsed.preferences?.colorScheme);
  } catch {
    return DEFAULT_APP_COLOR_SCHEME;
  }
}

export function applyColorSchemeToDocument(scheme: AppColorScheme): void {
  const root = document.documentElement;
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(scheme === 'dark' ? 'theme-dark' : 'theme-light');
  root.style.colorScheme = scheme;
}
