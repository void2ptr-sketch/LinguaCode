import type { ContentLanguage } from '../../../core/models';
import type { ScriptCode } from '../../../core/models/phonetic-content.types';
import type { LexemeDraftFields } from '../../../core/repositories/chinese/phonetics/lexeme-draft.utils';

/**
 * UX mode for the card editor: basic (simplified) or advanced (full feature set).
 */
export type CardEditorUxMode = 'basic' | 'advanced';

/** sessionStorage key for persisting the editor UX mode preference. */
export const EDITOR_UX_MODE_STORAGE_KEY = 'lingua-code.card-editor.ux-mode';

/**
 * Loads the saved editor UX mode from sessionStorage.
 *
 * @remarks
 * Defaults to `'basic'` when sessionStorage is unavailable or no value is stored.
 * Only `'advanced'` is recognized as advanced mode; any other value falls back to basic.
 *
 * @returns The saved UX mode, or `'basic'` as default.
 */
export function loadEditorUxMode(): CardEditorUxMode {
  if (typeof sessionStorage === 'undefined') {
    return 'basic';
  }

  const stored = sessionStorage.getItem(EDITOR_UX_MODE_STORAGE_KEY);
  return stored === 'advanced' ? 'advanced' : 'basic';
}

/**
 * Saves the editor UX mode to sessionStorage.
 *
 * @remarks
 * No-op when sessionStorage is unavailable.
 *
 * @param mode - The UX mode to save (`'basic'` or `'advanced'`).
 */
export function saveEditorUxMode(mode: CardEditorUxMode): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  sessionStorage.setItem(EDITOR_UX_MODE_STORAGE_KEY, mode);
}

/**
 * Returns the default script code for a given learning language.
 *
 * @remarks
 * Chinese (`'zh'`) defaults to Han characters (`'hani'`);
 * all other languages default to Latin (`'latn'`).
 *
 * @param _known - The known language (unused, kept for API symmetry).
 * @param learning - The learning language.
 * @returns The default script code (`'hani'` for Chinese, `'latn'` otherwise).
 */
export function defaultScriptForLanguages(
  _known: ContentLanguage,
  learning: ContentLanguage,
): ScriptCode {
  return learning === 'zh' ? 'hani' : 'latn';
}

/**
 * Syncs the `primary` field of a lexeme draft from input text.
 *
 * @remarks
 * Trims the input text and sets it as `primary`. Automatically infers
 * the script code from the learning language via `defaultScriptForLanguages`.
 * Returns the original fields unchanged if the text is empty.
 *
 * @param fields - The lexeme draft fields to update.
 * @param text - The input text to sync into `primary`.
 * @param known - The known language (passed to script inference).
 * @param learning - The learning language (passed to script inference).
 * @returns Updated lexeme draft fields with synced `primary` and `script`.
 */
export function syncLexemePrimaryFromText(
  fields: LexemeDraftFields,
  text: string,
  known: ContentLanguage,
  learning: ContentLanguage,
): LexemeDraftFields {
  const trimmed = text.trim();
  if (!trimmed) {
    return fields;
  }

  return {
    ...fields,
    primary: trimmed,
    script: defaultScriptForLanguages(known, learning),
  };
}

/**
 * Checks whether the language pair is Russian→Chinese.
 *
 * @param known - The known language.
 * @param learning - The learning language.
 * @returns `true` if known is Russian and learning is Chinese.
 */
export function isRuZhPair(known: ContentLanguage, learning: ContentLanguage): boolean {
  return known === 'ru' && learning === 'zh';
}

/**
 * Checks whether the learning language is English.
 *
 * @remarks
 * The known language is ignored; only the learning language is checked.
 *
 * @param _known - The known language (unused).
 * @param learning - The learning language.
 * @returns `true` if learning is English.
 */
export function isEnLearningPair(_known: ContentLanguage, learning: ContentLanguage): boolean {
  return learning === 'en';
}
