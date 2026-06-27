import type { LexemeDraftFields } from '../../../core/data/lexeme-draft.utils';
import { emptyLexemeDraftFields } from '../../../core/data/lexeme-draft.utils';
import type { ContentLanguage } from '../../../core/models';
import { defaultScriptForLanguages, syncLexemePrimaryFromText } from './card-editor-ux.utils';

export const MIN_CARD_OPTIONS = 2;
export const MAX_CARD_OPTIONS = 8;

export type CardOptionsEditorState = {
  options: readonly string[];
  lexemes: readonly LexemeDraftFields[];
  correctIndex: number;
};

export type CardOptionsEditorPatch = Partial<CardOptionsEditorState>;

export function createEmptyOptionsState(count = MIN_CARD_OPTIONS): CardOptionsEditorState {
  return {
    options: Array.from({ length: count }, () => ''),
    lexemes: Array.from({ length: count }, () => emptyLexemeDraftFields()),
    correctIndex: 0,
  };
}

export function optionTextReadonly(isAdvanced: boolean, lexeme: LexemeDraftFields): boolean {
  return isAdvanced && lexeme.primary.trim().length > 0;
}

export function syncOptionLexemes(
  lexemes: readonly LexemeDraftFields[],
  texts: readonly string[],
  index: number,
  value: string,
  known: ContentLanguage,
  learning: ContentLanguage,
  isAdvanced: boolean,
): readonly LexemeDraftFields[] {
  const next = [...lexemes];
  const script = defaultScriptForLanguages(known, learning);

  while (next.length < texts.length) {
    next.push(emptyLexemeDraftFields(script));
  }

  const current = next[index] ?? emptyLexemeDraftFields(script);

  if (!isAdvanced) {
    next[index] = syncLexemePrimaryFromText(current, value, known, learning);
    return next;
  }

  if (!current.primary.trim() && value.trim()) {
    next[index] = syncLexemePrimaryFromText(current, value, known, learning);
  }

  return next;
}

export function updateOptionText(
  state: CardOptionsEditorState,
  index: number,
  value: string,
  known: ContentLanguage,
  learning: ContentLanguage,
  isAdvanced: boolean,
): CardOptionsEditorState {
  const options = [...state.options];
  options[index] = value;

  return {
    ...state,
    options,
    lexemes: syncOptionLexemes(state.lexemes, options, index, value, known, learning, isAdvanced),
  };
}

export function updateOptionLexeme(
  state: CardOptionsEditorState,
  index: number,
  fields: LexemeDraftFields,
): CardOptionsEditorState {
  const lexemes = [...state.lexemes];
  lexemes[index] = fields;

  const options = [...state.options];
  if (fields.primary.trim()) {
    options[index] = fields.primary;
  }

  return { ...state, options, lexemes };
}

export function addOption(state: CardOptionsEditorState): CardOptionsEditorState | null {
  if (state.options.length >= MAX_CARD_OPTIONS) {
    return null;
  }

  return {
    ...state,
    options: [...state.options, ''],
    lexemes: [...state.lexemes, emptyLexemeDraftFields()],
  };
}

export function removeOption(
  state: CardOptionsEditorState,
  index: number,
): CardOptionsEditorState | null {
  if (state.options.length <= MIN_CARD_OPTIONS) {
    return null;
  }

  const options = state.options.filter((_, itemIndex) => itemIndex !== index);
  const lexemes = state.lexemes.filter((_, itemIndex) => itemIndex !== index);

  let correctIndex = state.correctIndex;
  if (correctIndex === index) {
    correctIndex = 0;
  } else if (correctIndex > index) {
    correctIndex -= 1;
  }

  return { options, lexemes, correctIndex };
}
