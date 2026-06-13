import { sanitizePlainText, sanitizeTheme, isAllowedFontSize } from './input-sanitize.utils';

describe('input-sanitize.utils', () => {
  it('should strip html tags and control characters from plain text', () => {
    expect(sanitizePlainText('<b>Hello</b>')).toBe('Hello');
  });

  it('should limit plain text length', () => {
    expect(sanitizePlainText('abcdef', 3)).toBe('abc');
  });

  it('should normalize theme to safe slug', () => {
    expect(sanitizeTheme(' Azure Blue! ')).toBe('azure-blue');
  });

  it('should fallback theme to default when empty', () => {
    expect(sanitizeTheme('   !!! ')).toBe('azure-blue');
  });

  it('should validate font sizes', () => {
    expect(isAllowedFontSize('md')).toBeTrue();
    expect(isAllowedFontSize('xl')).toBeFalse();
  });
});
