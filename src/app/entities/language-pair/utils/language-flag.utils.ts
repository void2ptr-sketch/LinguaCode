/**
 * Language flag emoji resolution.
 *
 * @remarks
 * Known ISO 639-1 codes resolve to a fixed flag emoji; other valid
 * two-letter codes are converted to regional-indicator emoji on the fly.
 * Non-country codes (e.g. `cpp`, `perl`, `js`) return an empty string —
 * callers should fall back to a CSS text badge (see
 * `getLanguageBadgeCode`).
 */

/** Fixed flag emoji per known ISO 639-1 language code. */
const LANGUAGE_FLAG_EMOJI: Record<string, string> = {
  EN: '\u{1F1EC}\u{1F1E7}',
  RU: '\u{1F1F7}\u{1F1FA}',
  DE: '\u{1F1E9}\u{1F1EA}',
  ZH: '\u{1F1E8}\u{1F1F3}',
  JA: '\u{1F1EF}\u{1F1F5}',
  FR: '\u{1F1EB}\u{1F1F7}',
  ES: '\u{1F1EA}\u{1F1F8}',
  KO: '\u{1F1F0}\u{1F1F7}',
  AR: '\u{1F1E6}\u{1F1E8}',
  PT: '\u{1F1F5}\u{1F1F9}',
  IT: '\u{1F1EE}\u{1F1F9}',
  NL: '\u{1F1F3}\u{1F1F1}',
  PL: '\u{1F1F5}\u{1F1F1}',
  TR: '\u{1F1F9}\u{1F1F7}',
  CS: '\u{1F1E8}\u{1F1F8}',
  SV: '\u{1F1F8}\u{1F1FB}',
  DA: '\u{1F1E9}\u{1F1F0}',
  FI: '\u{1F1EB}\u{1F1EE}',
  NO: '\u{1F1F3}\u{1F1F4}',
  HU: '\u{1F1ED}\u{1F1FA}',
  HE: '\u{1F1EE}\u{1F1F1}',
  TH: '\u{1F1F9}\u{1F1ED}',
  VI: '\u{1F1FB}\u{1F1EE}',
  UK: '\u{1F1FA}\u{1F1F6}',
  LT: '\u{1F1F1}\u{1F1F9}',
  LV: '\u{1F1F1}\u{1F1FB}',
  EE: '\u{1F1EA}\u{1F1EA}',
  RO: '\u{1F1F7}\u{1F1F4}',
  BG: '\u{1F1E7}\u{1F1EC}',
  HR: '\u{1F1ED}\u{1F1F7}',
  SK: '\u{1F1F8}\u{1F1F0}',
  SL: '\u{1F1F1}\u{1F1EE}',
  CA: '\u{1F1E8}\u{1F1E6}',
  GL: '\u{1F1EC}\u{1F1F1}',
  EU: '\u{1F1EA}\u{1F1FA}',
  ID: '\u{1F1EE}\u{1F1E9}',
  MS: '\u{1F1F2}\u{1F1F8}',
  TL: '\u{1F1F5}\u{1F1FD}',
};

/** White flag shown when a code is too short or invalid. */
const FALLBACK_FLAG = '\u{1F3F3}';

/** Checks whether the code is a valid two-letter A-Z code (ISO 3166-1 style). */
function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code.toUpperCase());
}

/** Builds regional-indicator emoji from a two-letter A-Z code. */
function codeToEmoji(code: string): string {
  if (code.length < 2) {
    return FALLBACK_FLAG;
  }
  const c1 = code[0].toUpperCase().charCodeAt(0);
  const c2 = code[1].toUpperCase().charCodeAt(0);
  if (c1 < 65 || c1 > 90 || c2 < 65 || c2 > 90) {
    return FALLBACK_FLAG;
  }
  const f1 = String.fromCodePoint(0x1f1e6 + (c1 - 65));
  const f2 = String.fromCodePoint(0x1f1e6 + (c2 - 65));
  return f1 + f2;
}

/**
 * Returns a flag emoji for a language code, or an empty string if no flag
 * is available.
 *
 * @param code - Language code (e.g. `en`, `ru`, `cpp`).
 * @remarks Empty string result means "no flag" — the caller is expected to
 *          render a CSS badge fallback (`getLanguageBadgeColor` /
 *          `getLanguageBadgeCode`).
 */
export function getLanguageFlagEmoji(code: string): string {
  if (!code || code.length < 2) {
    return '';
  }
  const upper = code.toUpperCase();

  const known = LANGUAGE_FLAG_EMOJI[upper];
  if (known) {
    return known;
  }

  // Two-letter code that isn't in the map → try to build a flag
  if (code.length === 2 && isValidCountryCode(code)) {
    return codeToEmoji(code);
  }

  // No flag available (e.g. C++, PERL, JS) → return empty; caller shows a CSS badge
  return '';
}
