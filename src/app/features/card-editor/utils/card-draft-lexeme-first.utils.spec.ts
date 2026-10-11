import type { LexemeDraftFields } from '../../../core/domain/chinese/phonetics/lexeme-draft.utils';

import { deriveOptionText, deriveOptionTexts, applyLexemeFirstToDraft } from './card-draft-lexeme-first.utils';
import type { SelectCardDraft, SymbolCardDraft, SoundCardDraft, MemoryCardDraft, KeyboardCardDraft } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLexeme(primary: string): LexemeDraftFields {
  return {
    primary,
    script: 'latn',
    pinyin: '',
    zhuyin: '',
    palladius: '',
    ipa: '',
    audioUrl: '',
    acceptedReadings: '',
  };
}

describe('deriveOptionText', () => {
  it('returns lexeme primary when non-empty', () => {
    const result = deriveOptionText(makeLexeme('hello'), 'fallback');
    expect(result).toBe('hello');
  });

  it('returns trimmed lexeme primary', () => {
    const result = deriveOptionText(makeLexeme('  spaced  '), 'fallback');
    expect(result).toBe('spaced');
  });

  it('returns fallback when lexeme primary is empty', () => {
    const result = deriveOptionText(makeLexeme(''), 'fallback text');
    expect(result).toBe('fallback text');
  });

  it('returns trimmed fallback when lexeme primary is empty', () => {
    const result = deriveOptionText(makeLexeme(''), '  trimmed  ');
    expect(result).toBe('trimmed');
  });

  it('returns trimmed fallback when lexeme is undefined', () => {
    const result = deriveOptionText(undefined, 'fallback');
    expect(result).toBe('fallback');
  });

  it('returns empty string when both lexeme and fallback are empty', () => {
    const result = deriveOptionText(undefined, '');
    expect(result).toBe('');
  });
});

describe('deriveOptionTexts', () => {
  it('derives texts for all options', () => {
    const lexemes = [makeLexeme('a'), makeLexeme('b'), makeLexeme('')];
    const fallbacks = ['fa', 'fb', 'fc'];
    const result = deriveOptionTexts(lexemes, fallbacks);

    expect(result).toEqual(['a', 'b', 'fc']);
  });

  it('uses fallbacks when lexemes array is undefined', () => {
    const fallbacks = ['a', 'b'];
    const result = deriveOptionTexts(undefined, fallbacks);

    expect(result).toEqual(['a', 'b']);
  });

  it('handles empty fallbacks array', () => {
    const result = deriveOptionTexts([], []);
    expect(result).toEqual([]);
  });

  it('handles more fallbacks than lexemes', () => {
    const lexemes = [makeLexeme('x')];
    const fallbacks = ['a', 'b', 'c'];
    const result = deriveOptionTexts(lexemes, fallbacks);

    expect(result).toEqual(['x', 'b', 'c']);
  });
});

// ---------------------------------------------------------------------------
// applyLexemeFirstToDraft
// ---------------------------------------------------------------------------

describe('applyLexemeFirstToDraft', () => {
  it('updates optionsLearning for select cards', () => {
    const draft = {
      kind: 'select' as const,
      title: 'Test',
      promptKnown: 'Q?',
      direction: 'known-to-learning' as const,
      promptLexeme: makeLexeme('prompt'),
      audioUrl: '',
      optionsLearning: ['fa', 'fb', 'fc'],
      optionsKnown: ['ka', 'kb', 'kc'],
      optionsLexemes: [makeLexeme('la'), makeLexeme('lb'), makeLexeme('')],
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'md' },
    } satisfies SelectCardDraft;

    const result = applyLexemeFirstToDraft(draft);

    expect((result as SelectCardDraft).optionsLearning).toEqual(['la', 'lb', 'fc']);
    expect(result).not.toBe(draft);
  });

  it('updates symbols for symbol cards', () => {
    const draft = {
      kind: 'symbol' as const,
      title: 'Test',
      promptKnown: 'Q?',
      direction: 'known-to-learning' as const,
      promptLexeme: makeLexeme('prompt'),
      audioUrl: '',
      symbols: ['sa', 'sb'],
      symbolLexemes: [makeLexeme('lex-a'), makeLexeme('')],
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'md' },
    } satisfies SymbolCardDraft;

    const result = applyLexemeFirstToDraft(draft);

    expect((result as SymbolCardDraft).symbols).toEqual(['lex-a', 'sb']);
    expect(result).not.toBe(draft);
  });

  it('updates optionsKnown and audioLabelLearning for sound cards', () => {
    const draft = {
      kind: 'sound' as const,
      title: 'Test',
      promptKnown: 'Q?',
      direction: 'known-to-learning' as const,
      promptLexeme: makeLexeme('prompt'),
      audioUrl: '',
      audioLabelLearning: 'default-label',
      audioLabelLexeme: makeLexeme('audio-lex'),
      optionsKnown: ['ok1', 'ok2'],
      optionsLexemes: [makeLexeme('ol1'), makeLexeme('ol2')],
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'md' },
    } satisfies SoundCardDraft;

    const result = applyLexemeFirstToDraft(draft);

    expect((result as SoundCardDraft).optionsKnown).toEqual(['ol1', 'ol2']);
    expect((result as SoundCardDraft).audioLabelLearning).toBe('audio-lex');
    expect(result).not.toBe(draft);
  });

  it('updates pairs learning values for memory cards', () => {
    const draft = {
      kind: 'memory' as const,
      title: 'Test',
      promptKnown: 'Q?',
      promptLexeme: makeLexeme('prompt'),
      audioUrl: '',
      pairs: [
        { known: 'k1', learning: 'l1', learningLexeme: makeLexeme('lex-l1') },
        { known: 'k2', learning: 'l2', learningLexeme: makeLexeme('') },
      ],
      appearance: { theme: 'azure-blue', fontSize: 'md' },
    } satisfies MemoryCardDraft;

    const result = applyLexemeFirstToDraft(draft);

    expect((result as MemoryCardDraft).pairs[0].learning).toBe('lex-l1');
    expect((result as MemoryCardDraft).pairs[1].learning).toBe('l2');
    expect(result).not.toBe(draft);
  });

  it('returns unchanged draft for keyboard cards', () => {
    const draft = {
      kind: 'keyboard' as const,
      title: 'Test',
      promptKnown: 'Q?',
      direction: 'known-to-learning' as const,
      promptLexeme: makeLexeme('prompt'),
      audioUrl: '',
      acceptedAnswersKnown: ['a', 'b'],
      appearance: { theme: 'azure-blue', fontSize: 'md' },
    } satisfies KeyboardCardDraft;

    const result = applyLexemeFirstToDraft(draft);

    expect(result).toBe(draft);
  });

  it('uses fallback when lexeme primary is empty', () => {
    const draft = {
      kind: 'select' as const,
      title: 'Test',
      promptKnown: 'Q?',
      direction: 'known-to-learning' as const,
      promptLexeme: makeLexeme('prompt'),
      audioUrl: '',
      optionsLearning: ['fallback-a', 'fallback-b'],
      optionsLexemes: [makeLexeme(''), makeLexeme('lex-b')],
      optionsKnown: ['ok1', 'ok2'],
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'md' },
    } satisfies SelectCardDraft;

    const result = applyLexemeFirstToDraft(draft);

    expect((result as SelectCardDraft).optionsLearning).toEqual(['fallback-a', 'lex-b']);
  });

  it('handles undefined lexemes array gracefully', () => {
    const draft = {
      kind: 'select' as const,
      title: 'Test',
      promptKnown: 'Q?',
      direction: 'known-to-learning' as const,
      promptLexeme: makeLexeme('prompt'),
      audioUrl: '',
      optionsLearning: ['opt1', 'opt2'],
      optionsLexemes: undefined as unknown as readonly LexemeDraftFields[],
      optionsKnown: ['ok1', 'ok2'],
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'md' },
    } satisfies SelectCardDraft;

    const result = applyLexemeFirstToDraft(draft);

    expect((result as SelectCardDraft).optionsLearning).toEqual(['opt1', 'opt2']);
  });
});
