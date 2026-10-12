/**
 * Application color scheme (light or dark mode).
 *
 * @remarks
 * Distinct from card theme slug — this controls the overall UI appearance.
 * Single source of truth for `AppColorScheme`; re-exported via
 * `entities/user/model` and the transitional `core/models` shim.
 */
export type AppColorScheme = 'light' | 'dark';

/**
 * Default color scheme applied when no user preference exists.
 *
 * @remarks
 * `light` — standard light mode UI. Switched to `dark` via `AppThemeService` based on user preference or system setting.
 */
export const DEFAULT_APP_COLOR_SCHEME: AppColorScheme = 'light';
