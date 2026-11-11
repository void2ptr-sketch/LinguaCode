import { describe, expect, it } from 'vitest';

import { normalizeLanguageCode } from './language-code.utils';

describe('normalizeLanguageCode', () => {
  it('maps c++ aliases to cpp', () => {
    expect(normalizeLanguageCode('c++')).toBe('cpp');
    expect(normalizeLanguageCode('C++')).toBe('cpp');
  });

  it('maps javascript aliases to js', () => {
    expect(normalizeLanguageCode('javascript')).toBe('js');
    expect(normalizeLanguageCode('JS')).toBe('js');
    expect(normalizeLanguageCode('js')).toBe('js');
  });

  it('maps haskell aliases to hs', () => {
    expect(normalizeLanguageCode('haskell')).toBe('hs');
    expect(normalizeLanguageCode('Haskell')).toBe('hs');
    expect(normalizeLanguageCode('hs')).toBe('hs');
  });

  it('maps rust aliases to rs', () => {
    expect(normalizeLanguageCode('rust')).toBe('rs');
    expect(normalizeLanguageCode('Rust')).toBe('rs');
    expect(normalizeLanguageCode('rs')).toBe('rs');
  });

  it('passes canonical ISO codes through unchanged', () => {
    expect(normalizeLanguageCode('en')).toBe('en');
    expect(normalizeLanguageCode('ru')).toBe('ru');
    expect(normalizeLanguageCode('zh')).toBe('zh');
  });

  it('trims surrounding whitespace before matching', () => {
    expect(normalizeLanguageCode(' c++ ')).toBe('cpp');
    expect(normalizeLanguageCode(' en ')).toBe('en');
  });

  it('passes unknown codes through unchanged', () => {
    expect(normalizeLanguageCode('perl')).toBe('perl');
    expect(normalizeLanguageCode('xx')).toBe('xx');
  });
});
