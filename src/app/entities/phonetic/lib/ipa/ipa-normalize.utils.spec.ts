import {
  answersMatchIpa,
  isLikelyIpa,
  normalizeIpa,
  validateIpaInput,
} from './ipa-normalize.utils';

describe('ipa-normalize.utils', () => {
  describe('normalizeIpa', () => {
    it('should normalize ipa brackets and spaces', () => {
      expect(normalizeIpa('[ həˈləʊ ]')).toBe('həˈləʊ');
    });

    it('should strip forward slash brackets', () => {
      expect(normalizeIpa('/həˈləʊ/')).toBe('həˈləʊ');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeIpa('hə   ləʊ')).toBe('hə ləʊ');
    });

    it('should trim whitespace', () => {
      expect(normalizeIpa('  həˈləʊ  ')).toBe('həˈləʊ');
    });

    it('should skip bracket stripping when stripBrackets is false', () => {
      expect(normalizeIpa('[ həˈləʊ ]', false)).toBe('[ həˈləʊ ]');
    });

    it('should return empty string for empty input', () => {
      expect(normalizeIpa('')).toBe('');
    });
  });

  describe('answersMatchIpa', () => {
    it('should compare ipa answers', () => {
      expect(answersMatchIpa('[həˈloʊ]', 'həˈloʊ')).toBe(true);
      expect(answersMatchIpa('həˈloʊ', 'həˈləʊ')).toBe(false);
    });

    it('should return true for identical strings', () => {
      expect(answersMatchIpa('həˈloʊ', 'həˈloʊ')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(answersMatchIpa('hello', 'world')).toBe(false);
    });
  });

  describe('isLikelyIpa', () => {
    it('should return false for empty string', () => {
      expect(isLikelyIpa('')).toBe(false);
    });

    it('should return true for IPA characters', () => {
      expect(isLikelyIpa('həˈləʊ')).toBe(true);
    });

    it('should return false for plain ASCII text', () => {
      expect(isLikelyIpa('hello world')).toBe(false);
    });

    it('should return true for stress marks', () => {
      expect(isLikelyIpa('ˈ')).toBe(true);
      expect(isLikelyIpa('ˌ')).toBe(true);
    });

    it('should return false for numbers', () => {
      expect(isLikelyIpa('123')).toBe(false);
    });
  });

  describe('validateIpaInput', () => {
    it('should return true for empty string', () => {
      expect(validateIpaInput('')).toBe(true);
    });

    it('should return false for strings with apostrophe', () => {
      expect(validateIpaInput("hello'world")).toBe(false);
    });

    it('should return true for valid IPA', () => {
      expect(validateIpaInput('həˈləʊ')).toBe(true);
    });

    it('should return true for stress mark', () => {
      expect(validateIpaInput('ˈ')).toBe(true);
      expect(validateIpaInput('ˌ')).toBe(true);
    });

    it('should return false for non-IPA with apostrophe', () => {
      expect(validateIpaInput("don't")).toBe(false);
    });
  });
});
