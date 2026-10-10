import type { LexemeDraftFields } from '../../../core/repositories/chinese/lexeme-draft.utils';

import { deriveOptionText, deriveOptionTexts } from './card-draft-lexeme-first.utils';

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
    const lexemes = [
      makeLexeme('a'),
      makeLexeme('b'),
      makeLexeme(''),
    ];
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
