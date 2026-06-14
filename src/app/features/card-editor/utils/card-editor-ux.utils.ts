import type { ContentLanguage } from '../../../core/models';
import type { ScriptCode } from '../../../core/models/phonetic-content.types';
import type { LexemeDraftFields } from '../../../core/data/lexeme-draft.utils';

export type CardEditorUxMode = 'basic' | 'advanced';

export const EDITOR_UX_MODE_STORAGE_KEY = 'lingua-code.card-editor.ux-mode';

export function loadEditorUxMode(): CardEditorUxMode {
  if (typeof sessionStorage === 'undefined') {
    return 'basic';
  }

  const stored = sessionStorage.getItem(EDITOR_UX_MODE_STORAGE_KEY);
  return stored === 'advanced' ? 'advanced' : 'basic';
}

export function saveEditorUxMode(mode: CardEditorUxMode): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  sessionStorage.setItem(EDITOR_UX_MODE_STORAGE_KEY, mode);
}

export function defaultScriptForLanguages(
  _known: ContentLanguage,
  learning: ContentLanguage,
): ScriptCode {
  return learning === 'zh' ? 'hani' : 'latn';
}

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

export function isRuZhPair(known: ContentLanguage, learning: ContentLanguage): boolean {
  return known === 'ru' && learning === 'zh';
}

export function isEnLearningPair(_known: ContentLanguage, learning: ContentLanguage): boolean {
  return learning === 'en';
}
