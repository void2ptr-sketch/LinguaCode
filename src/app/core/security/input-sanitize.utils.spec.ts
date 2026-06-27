import {
  isAllowedFontSize,
  sanitizeMarkdownText,
  sanitizePlainText,
  sanitizeTheme,
} from './input-sanitize.utils';

describe('input-sanitize.utils', () => {
  it('should strip html tags and control characters from plain text', () => {
    expect(sanitizePlainText('<b>Hello</b>')).toBe('Hello');
  });

  it('should limit plain text length', () => {
    expect(sanitizePlainText('abcdef', 3)).toBe('abc');
  });

  it('should strip newlines from plain text', () => {
    expect(sanitizePlainText('a\nb')).toBe('ab');
  });

  it('should preserve markdown line breaks and syntax', () => {
    const markdown = '# Title\n\n**bold** and `code`\n\n- item';
    expect(sanitizeMarkdownText(markdown)).toBe(markdown);
  });

  it('should strip html tags from markdown while keeping structure', () => {
    expect(sanitizeMarkdownText('# Hi\n\n<b>x</b>')).toBe('# Hi\n\nx');
  });

  it('should limit markdown length without removing internal newlines first', () => {
    expect(sanitizeMarkdownText('ab\ncd', 3)).toBe('ab\n');
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
