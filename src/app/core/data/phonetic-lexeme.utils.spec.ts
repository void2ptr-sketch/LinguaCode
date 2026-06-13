import { lexemeFromHan, resolveIpaString, resolveRomanizationReading } from './phonetic-lexeme.utils';

describe('phonetic-lexeme.utils', () => {
  it('should build han lexeme', () => {
    expect(lexemeFromHan('国').primary).toBe('国');
    expect(lexemeFromHan('国').script).toBe('hani');
  });

  it('should resolve romanization readings', () => {
    const lexeme = {
      primary: '国',
      script: 'hani' as const,
      pinyin: 'guó',
      palladius: 'го',
    };

    expect(resolveRomanizationReading(lexeme, 'pinyin')).toBe('guó');
    expect(resolveRomanizationReading(lexeme, 'palladius')).toBe('го');
  });

  it('should resolve ipa variants by label', () => {
    const ipa = [
      { label: 'BrE', transcription: '[həˈləʊ]' },
      { label: 'AmE', transcription: '[həˈloʊ]' },
    ];

    expect(resolveIpaString(ipa, 'AmE')).toBe('[həˈloʊ]');
  });
});
