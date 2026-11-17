/**
 * Deterministic CSS badge fallback for language codes without a flag emoji
 * (e.g. `cpp`, `perl`, `js`).
 *
 * @remarks
 * The background hue is derived from a stable hash of the language code,
 * so the same code always renders the same colors across sessions.
 */

/** Computes a stable hue (0–359) from a language code hash. */
function languageCodeHue(code: string): number {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

/**
 * Deterministic background color for a language code badge.
 *
 * @param code - Language code (e.g. `cpp`).
 * @returns An `hsl()` color, or a neutral CSS variable when the code is empty.
 */
export function getLanguageBadgeColor(code: string): string {
  if (!code) {
    return 'var(--mat-sys-outline-variant)';
  }
  const hue = languageCodeHue(code);
  return `hsl(${hue}, 45%, 82%)`;
}

/**
 * Deterministic text color matching `getLanguageBadgeColor`'s background hue.
 *
 * @param code - Language code (e.g. `cpp`).
 * @returns An `hsl()` color, or a neutral CSS variable when the code is empty.
 */
export function getLanguageBadgeTextColor(code: string): string {
  if (!code) {
    return 'var(--mat-sys-on-surface-variant)';
  }
  const hue = languageCodeHue(code);
  return `hsl(${hue}, 50%, 25%)`;
}

/**
 * First two letters of a language code for the CSS badge fallback.
 *
 * @param code - Language code (e.g. `c++` → `C+`).
 */
export function getLanguageBadgeCode(code: string): string {
  if (!code) {
    return '';
  }
  // Strip non-alpha (C++ → C, JavaScript → JA)
  const alpha = code.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return alpha.length >= 2 ? alpha.slice(0, 2) : code.toUpperCase().slice(0, 2);
}
