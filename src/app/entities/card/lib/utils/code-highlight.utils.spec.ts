import { describe, expect, it } from 'vitest';
import {
  CODE_HIGHLIGHT_LANGUAGES,
  CODE_HIGHLIGHT_LANGUAGE_LABELS,
  normalizeCodeAnswer,
  codeAnswersMatch,
} from './code-highlight.utils';

describe('code-highlight.utils', () => {
  // ── CODE_HIGHLIGHT_LANGUAGES ──

  describe('CODE_HIGHLIGHT_LANGUAGES', () => {
    it('should contain all supported languages', () => {
      expect(CODE_HIGHLIGHT_LANGUAGES).toContain('perl');
      expect(CODE_HIGHLIGHT_LANGUAGES).toContain('typescript');
      expect(CODE_HIGHLIGHT_LANGUAGES).toContain('sql');
      expect(CODE_HIGHLIGHT_LANGUAGES.length).toBe(11);
    });
  });

  // ── CODE_HIGHLIGHT_LANGUAGE_LABELS ──

  describe('CODE_HIGHLIGHT_LANGUAGE_LABELS', () => {
    it('should have labels for all languages', () => {
      expect(CODE_HIGHLIGHT_LANGUAGE_LABELS.perl).toBe('Perl');
      expect(CODE_HIGHLIGHT_LANGUAGE_LABELS.cpp).toBe('C++');
      expect(CODE_HIGHLIGHT_LANGUAGE_LABELS.typescript).toBe('TypeScript');
      expect(CODE_HIGHLIGHT_LANGUAGE_LABELS.plain).toBe('Plain text');
    });
  });

  // ── normalizeCodeAnswer ──

  describe('normalizeCodeAnswer', () => {
    it('should trim whitespace', () => {
      expect(normalizeCodeAnswer('  hello  ')).toBe('hello');
    });

    it('should convert CRLF to LF', () => {
      expect(normalizeCodeAnswer('line1\r\nline2')).toBe('line1\nline2');
    });

    it('should handle empty string', () => {
      expect(normalizeCodeAnswer('')).toBe('');
    });

    it('should handle only whitespace', () => {
      expect(normalizeCodeAnswer('   \n  ')).toBe('');
    });

    it('should preserve single LF', () => {
      expect(normalizeCodeAnswer('line1\nline2')).toBe('line1\nline2');
    });
  });

  // ── codeAnswersMatch ──

  describe('codeAnswersMatch', () => {
    it('should match identical answers', () => {
      expect(codeAnswersMatch('hello', 'hello')).toBe(true);
    });

    it('should not match different answers', () => {
      expect(codeAnswersMatch('hello', 'world')).toBe(false);
    });

    it('should match after CRLF normalization', () => {
      expect(codeAnswersMatch('line1\r\nline2', 'line1\nline2')).toBe(true);
    });

    it('should match after trimming', () => {
      expect(codeAnswersMatch('  hello  ', 'hello')).toBe(true);
    });

    it('should match both trimmed and CRLF-normalized', () => {
      expect(codeAnswersMatch('  line1\r\nline2  ', 'line1\nline2')).toBe(true);
    });

    it('should treat empty strings as equal', () => {
      expect(codeAnswersMatch('', '')).toBe(true);
    });

    it('should treat whitespace-only strings as equal', () => {
      expect(codeAnswersMatch('  \n  ', '  ')).toBe(true);
    });
  });
});
