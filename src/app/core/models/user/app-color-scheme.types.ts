/**
 * Application color scheme (light or dark mode).
 *
 * @remarks
 * Distinct from card theme slug — this controls the overall UI appearance.
 */
export type AppColorScheme = 'light' | 'dark';

/**
 * Default color scheme applied when no user preference exists.
 *
 * @remarks
 * `light` — standard light mode UI. Switched to `dark` via `AppThemeService` based on user preference or system setting.
 */
export const DEFAULT_APP_COLOR_SCHEME: AppColorScheme = 'light';
