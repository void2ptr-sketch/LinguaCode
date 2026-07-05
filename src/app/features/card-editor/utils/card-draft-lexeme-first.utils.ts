import type { LexemeDraftFields } from '../../../core/data/chinese/lexeme-draft.utils';
import type { CardDraft } from '../types';

export function deriveOptionText(lexeme: LexemeDraftFields | undefined, fallback: string): string {
  const primary = lexeme?.primary.trim() ?? '';
  return primary || fallback.trim();
}

export function deriveOptionTexts(
  lexemes: readonly LexemeDraftFields[] | undefined,
  fallbacks: readonly string[],
): readonly string[] {
  return fallbacks.map((fallback, index) => deriveOptionText(lexemes?.[index], fallback));
}

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
