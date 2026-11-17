import type { ContentLanguage } from '../../card/model';
import {
  buildMirrorGroupKey,
  formatLanguagePair,
  isContentLanguage,
  normalizeLanguagePair,
} from './language-pair.utils';
import { DEFAULT_LANGUAGE_PAIR } from '../model/language-pair.types';
describe('language-pair.utils', () => {
  it('should format language pair label', () => {
    expect(formatLanguagePair({ known: 'ru', learning: 'en' })).toBe('ru → en');
  });

  it('should format language pair label with labels', () => {
    expect(
      formatLanguagePair({ known: 'ru', learning: 'en' }, { ru: 'Русский', en: 'English' }),
    ).toBe('Русский → English');
  });

  it('should normalize invalid pair to default', () => {
    expect(normalizeLanguagePair({ known: 'ru', learning: 'ru' })).toEqual(DEFAULT_LANGUAGE_PAIR);
    // isContentLanguage accepts any non-empty string; same known+learning returns default
    expect(
      normalizeLanguagePair({ known: 'xx' as ContentLanguage, learning: 'xx' as ContentLanguage }),
    ).toEqual(DEFAULT_LANGUAGE_PAIR);
  });

  describe('buildMirrorGroupKey', () => {
    it('should produce the same key for both mirror directions', () => {
      expect(buildMirrorGroupKey('ru', 'en')).toBe('en|ru');
      expect(buildMirrorGroupKey('en', 'ru')).toBe('en|ru');
    });

    it('should produce distinct keys for distinct mirror pairs', () => {
      expect(buildMirrorGroupKey('ja', 'zh')).not.toBe(buildMirrorGroupKey('en', 'ru'));
    });

    it('should sort codes canonically', () => {
      expect(buildMirrorGroupKey('zh', 'ja')).toBe('ja|zh');
      expect(buildMirrorGroupKey('cpp', 'ru')).toBe('cpp|ru');
    });
  });

  it('should accept valid content languages', () => {
    expect(isContentLanguage('zh')).toBe(true);
    expect(isContentLanguage('perl')).toBe(true);
    expect(isContentLanguage('java')).toBe(true);
    expect(isContentLanguage('cpp')).toBe(true);
    expect(isContentLanguage('de')).toBe(true);
  });

  it('should format programming language pairs', () => {
    expect(formatLanguagePair({ known: 'ru', learning: 'perl' })).toBe('ru → perl');
    expect(formatLanguagePair({ known: 'ru', learning: 'java' })).toBe('ru → java');
    expect(formatLanguagePair({ known: 'ru', learning: 'cpp' })).toBe('ru → cpp');
  });

  it('should format programming language pairs with labels', () => {
    expect(
      formatLanguagePair({ known: 'ru', learning: 'perl' }, { ru: 'Русский', perl: 'Perl' }),
    ).toBe('Русский → Perl');
    expect(
      formatLanguagePair({ known: 'ru', learning: 'java' }, { ru: 'Русский', java: 'Java' }),
    ).toBe('Русский → Java');
    expect(
      formatLanguagePair({ known: 'ru', learning: 'cpp' }, { ru: 'Русский', cpp: 'C++' }),
    ).toBe('Русский → C++');
  });
});
