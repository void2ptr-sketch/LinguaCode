/**
 * DTO for a language content item returned from the backend.
 */
export type LanguageDto = {
  /** Numeric ID of the language. */
  id: number;
  /** ISO 639-1 code, e.g. `'ru'`, `'en'`, `'zh'`. */
  code: string;
  /** Display name in English, e.g. `'Russian'`. */
  displayName: string;
  /** Native name, e.g. `'Русский'`. */
  nativeName: string;
  /** Writing direction: `'ltr'` or `'rtl'`. */
  writingDir: string;
  /** Whether the language supports tones (e.g. Chinese). */
  supportsTones: boolean;
  /** Whether the language supports pinyin (e.g. Chinese). */
  supportsPinyin: boolean;
  /** Recommended font family. */
  fontFamily: string;
  /** Whether the language is active and available for selection. */
  activeFlag: boolean;
};
