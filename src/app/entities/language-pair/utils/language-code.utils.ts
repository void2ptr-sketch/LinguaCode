import type { ContentLanguage } from '../../card/model';

/**
 * Alias map: display name / common variation → `ContentLanguage` code.
 *
 * @remarks
 * Backend dictionaries may return non-ISO codes for programming languages
 * (e.g. `c++`, `javascript`). This map normalizes them to the canonical
 * short codes used across the frontend (`cpp`, `js`, `hs`, `rs`).
 */
const CODE_ALIASES: Record<string, ContentLanguage> = {
  'c++': 'cpp',
  cpp: 'cpp',
  'C++': 'cpp',
  javascript: 'js',
  js: 'js',
  JS: 'js',
  haskell: 'hs',
  hs: 'hs',
  Haskell: 'hs',
  rust: 'rs',
  rs: 'rs',
  Rust: 'rs',
};

/**
 * Normalizes a language code from the backend to a valid `ContentLanguage`.
 *
 * @param code - Raw code from the backend (may contain aliases like `c++`).
 * @returns The canonical content language code, or the trimmed input when
 *          no alias matches and the code is already assumed valid.
 */
export function normalizeLanguageCode(code: string): ContentLanguage {
  const trimmed = code.trim();
  const lower = trimmed.toLowerCase();
  const alias = CODE_ALIASES[trimmed] || CODE_ALIASES[lower];
  if (alias) {
    return alias;
  }
  // Return as-is if already valid
  return trimmed as ContentLanguage;
}
