const HTML_TAG_PATTERN = /<[^>]*>/g;

const isAllowedPlainTextCharacter = (code: number): boolean => code > 31 && code !== 127;

const isAllowedMarkdownCharacter = (code: number): boolean =>
  code === 9 || code === 10 || code === 13 || isAllowedPlainTextCharacter(code);

const stripControlCharacters = (value: string): string => {
  return [...value]
    .filter((char) => isAllowedPlainTextCharacter(char.charCodeAt(0)))
    .join('');
};

const stripMarkdownControlCharacters = (value: string): string => {
  return [...value]
    .filter((char) => isAllowedMarkdownCharacter(char.charCodeAt(0)))
    .join('');
};

export const sanitizePlainText = (value: string, maxLength = 64): string => {
  return stripControlCharacters(value.replace(HTML_TAG_PATTERN, '')).trim().slice(0, maxLength);
};

/** Preserves Markdown line breaks and indentation; strips HTML tags and unsafe control chars. */
export const sanitizeMarkdownText = (value: string, maxLength = 16_000): string => {
  return stripMarkdownControlCharacters(value.replace(HTML_TAG_PATTERN, '')).slice(0, maxLength);
};

export const sanitizeTheme = (value: string, maxLength = 32): string => {
  const normalized = sanitizePlainText(value, maxLength)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'azure-blue';
};

export const isAllowedFontSize = (value: string): value is 'sm' | 'md' | 'lg' => {
  return value === 'sm' || value === 'md' || value === 'lg';
};
