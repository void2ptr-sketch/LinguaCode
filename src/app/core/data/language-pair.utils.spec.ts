import {
  formatLanguagePair,
  isContentLanguage,
  normalizeLanguagePair,
} from './language-pair.utils';
import { DEFAULT_LANGUAGE_PAIR } from '../models/language-pair.types';

describe('language-pair.utils', () => {
  it('should format language pair label', () => {
    expect(formatLanguagePair({ known: 'ru', learning: 'en' })).toBe('Русский → English');
  });

  it('should normalize invalid pair to default', () => {
    expect(normalizeLanguagePair({ known: 'ru', learning: 'ru' })).toEqual(DEFAULT_LANGUAGE_PAIR);
    expect(normalizeLanguagePair({ known: 'xx' as 'en', learning: 'en' })).toEqual(
      DEFAULT_LANGUAGE_PAIR,
    );
  });

  it('should accept valid content languages', () => {
    expect(isContentLanguage('zh')).toBeTrue();
    expect(isContentLanguage('perl')).toBeTrue();
    expect(isContentLanguage('java')).toBeTrue();
    expect(isContentLanguage('cpp')).toBeTrue();
    expect(isContentLanguage('de')).toBeFalse();
  });

  it('should format programming language pairs', () => {
    expect(formatLanguagePair({ known: 'ru', learning: 'perl' })).toBe('Русский → Perl');
    expect(formatLanguagePair({ known: 'ru', learning: 'java' })).toBe('Русский → Java');
    expect(formatLanguagePair({ known: 'ru', learning: 'cpp' })).toBe('Русский → C++');
  });
});
