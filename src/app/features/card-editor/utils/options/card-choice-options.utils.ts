import type { LexemeDraftFields } from '../../../../entities/chinese/lib/phonetics/lexeme-draft.utils';
import type { ChoiceCardDraft } from '../../types/card-draft.types';
import type { CardOptionsEditorState, CardOptionsEditorConfig } from './card-options-editor.utils';

/**
 * Resolves the editor configuration for a choice card draft.
 *
 * @param draft - The choice card draft, or `null` for non-choice kinds.
 * @returns Configuration object with title, option label prefix, and showCorrectRadio flag.
 */
export function resolveChoiceOptionsConfig(draft: ChoiceCardDraft | null): CardOptionsEditorConfig {
  if (!draft) {
    return { title: '', optionLabelPrefix: '', showCorrectRadio: true };
  }

  switch (draft.kind) {
    case 'reading':
      return { title: 'Варианты чтения', optionLabelPrefix: 'Чтение', showCorrectRadio: true };
    case 'symbol':
      return { title: 'Символы', optionLabelPrefix: 'Символ', showCorrectRadio: true };
    case 'select':
    case 'timed':
      return {
        title: 'Варианты (новый)',
        optionLabelPrefix: 'Ответ',
        showCorrectRadio: true,
      };
    default:
      return { title: 'Варианты', optionLabelPrefix: 'Вариант', showCorrectRadio: true };
  }
}

/**
 * Resolves the option text array for a choice card draft.
 *
 * @param draft - The choice card draft, or `null`.
 * @returns Array of option text strings, or empty array for unsupported kinds.
 */
export function resolveChoiceOptionTexts(draft: ChoiceCardDraft | null): readonly string[] {
  if (!draft) {
    return [];
  }

  if (draft.kind === 'symbol') {
    return draft.symbols;
  }

  if (draft.kind === 'tone') {
    return [];
  }

  return draft.optionsLearning;
}

/**
 * Resolves the lexeme drafts for a choice card draft's options.
 *
 * @param draft - The choice card draft, or `null`.
 * @returns Array of lexeme draft fields, or empty array for unsupported kinds.
 */
export function resolveChoiceOptionLexemes(draft: ChoiceCardDraft | null): readonly LexemeDraftFields[] {
  if (!draft) {
    return [];
  }

  if (draft.kind === 'symbol') {
    return draft.symbolLexemes;
  }

  if (draft.kind === 'tone') {
    return [];
  }

  return draft.optionsLexemes;
}

/**
 * Applies an options editor state change to a choice card draft.
 *
 * @param draft - The choice card draft (must not be null).
 * @param state - The updated options editor state.
 * @returns A new draft with updated options, lexemes, and correct index.
 * @remarks
 * Exhaustive switch: `never` assertion ensures all ChoiceCardDraft kinds are handled.
 * `tone` is handled implicitly — it has no editable options (syllable/toneOptions
 * are managed separately), so unreachable default is correct.
 */
export function applyChoiceOptionsState(
  draft: ChoiceCardDraft,
  state: CardOptionsEditorState,
): ChoiceCardDraft {
  switch (draft.kind) {
    case 'select':
    case 'reading':
    case 'timed':
      return {
        ...draft,
        optionsLearning: state.options,
        optionsLexemes: state.lexemes,
        correctIndex: state.correctIndex,
      };

    case 'symbol':
      return {
        ...draft,
        symbols: state.options,
        symbolLexemes: state.lexemes,
        correctIndex: state.correctIndex,
      };

    case 'tone':
      // Tone cards have no editable options — syllable/toneOptions managed separately
      return draft;

    default: {
      const _exhaustive: never = draft;
      throw new Error(`Unhandled choice card kind: ${(_exhaustive as { kind: string }).kind}`);
    }
  }
}
