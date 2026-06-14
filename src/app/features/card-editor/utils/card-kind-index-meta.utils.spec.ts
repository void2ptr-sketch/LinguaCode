import { indexTagsForDraft } from './card-kind-index-meta.utils';
import type { ReadingCardDraft } from '../types';
import { emptyLexemeDraftFields } from '../../../core/data/lexeme-draft.utils';

describe('card-kind-index-meta.utils', () => {
  it('adds reading and polyphony tags for reading cards', () => {
    const draft: ReadingCardDraft = {
      kind: 'reading',
      title: 'T',
      direction: 'known-to-learning',
      promptKnown: '行',
      optionsLearning: ['xíng', 'háng'],
      optionsLexemes: [emptyLexemeDraftFields(), emptyLexemeDraftFields()],
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      promptLexeme: emptyLexemeDraftFields(),
      audioUrl: '',
    };

    const tags = indexTagsForDraft(draft);
    expect(tags.includes('reading')).toBe(true);
    expect(tags.includes('polyphony')).toBe(true);
  });
});
