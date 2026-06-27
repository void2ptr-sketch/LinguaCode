import { emptyLexemeDraftFields } from '../../../core/data/lexeme-draft.utils';
import { applyLexemeFirstToDraft, deriveOptionText } from './card-draft-lexeme-first.utils';
import type { SelectCardDraft } from '../types';

describe('card-draft-lexeme-first.utils', () => {
  it('derives option text from lexeme primary', () => {
    const lexeme = { ...emptyLexemeDraftFields(), primary: 'hello' };
    expect(deriveOptionText(lexeme, 'fallback')).toBe('hello');
    expect(deriveOptionText(emptyLexemeDraftFields(), 'fallback')).toBe('fallback');
  });

  it('applies lexeme-first to select draft on save', () => {
    const draft: SelectCardDraft = {
      kind: 'select',
      title: 'Test',
      direction: 'known-to-learning',
      promptKnown: 'Q',
      optionsLearning: ['old-a', 'old-b'],
      optionsLexemes: [{ ...emptyLexemeDraftFields(), primary: 'new-a' }, emptyLexemeDraftFields()],
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      promptLexeme: emptyLexemeDraftFields(),
      audioUrl: '',
    };

    const next = applyLexemeFirstToDraft(draft);
    expect(next.kind).toBe('select');
    if (next.kind === 'select') {
      expect(next.optionsLearning).toEqual(['new-a', 'old-b']);
    }
  });
});
