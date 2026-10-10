import type { LexemeDraftFields } from '../../../core/data/chinese/lexeme-draft.utils';
import type { CardDraft } from '../types';

/**
 * Derives the display text for an option, preferring the lexeme primary over the fallback.
 *
 * @param lexeme - The lexeme draft fields for the option.
 * @param fallback - Fallback text if the lexeme primary is empty.
 * @returns The lexeme primary if non-empty, otherwise the trimmed fallback.
 */
export function deriveOptionText(lexeme: LexemeDraftFields | undefined, fallback: string): string {
  const primary = lexeme?.primary.trim() ?? '';
  return primary || fallback.trim();
}

/**
 * Derives option texts from lexemes and fallbacks for all entries.
 *
 * @param lexemes - Array of lexeme drafts corresponding to each option.
 * @param fallbacks - Fallback texts for each option.
 * @returns An array of derived option texts, one per fallback.
 */
export function deriveOptionTexts(
  lexemes: readonly LexemeDraftFields[] | undefined,
  fallbacks: readonly string[],
): readonly string[] {
  return fallbacks.map((fallback, index) => deriveOptionText(lexemes?.[index], fallback));
}

/**
 * Applies lexeme-first priority to a card draft, updating option arrays from lexemes.
 *
 * For choice-type cards (select, reading, timed), updates optionsLearning from optionsLexemes.
 * For symbol cards, updates symbols from symbolLexemes.
 * For sound cards, updates optionsKnown and audioLabelLearning from lexemes.
 * For memory cards, updates pair learning values from learningLexeme.
 * Other card kinds are returned unchanged.
 *
 * @param draft - The card draft to transform.
 * @returns A new draft with option arrays derived from lexeme primaries.
 */
export function applyLexemeFirstToDraft(draft: CardDraft): CardDraft {
  switch (draft.kind) {
    case 'select':
    case 'reading':
    case 'timed':
      return {
        ...draft,
        optionsLearning: deriveOptionTexts(draft.optionsLexemes, draft.optionsLearning),
      };
    case 'symbol':
      return {
        ...draft,
        symbols: deriveOptionTexts(draft.symbolLexemes, draft.symbols),
      };
    case 'sound':
      return {
        ...draft,
        optionsKnown: deriveOptionTexts(draft.optionsLexemes, draft.optionsKnown),
        audioLabelLearning: deriveOptionText(draft.audioLabelLexeme, draft.audioLabelLearning),
      };
    case 'memory':
      return {
        ...draft,
        pairs: draft.pairs.map((pair) => ({
          ...pair,
          learning: deriveOptionText(pair.learningLexeme, pair.learning),
        })),
      };
    default:
      return draft;
  }
}
