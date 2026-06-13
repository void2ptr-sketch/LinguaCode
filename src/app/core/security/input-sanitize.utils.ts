const HTML_TAG_PATTERN = /<[^>]*>/g;

const stripControlCharacters = (value: string): string => {
  return [...value]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('');
};

export const sanitizePlainText = (value: string, maxLength = 64): string => {
  return stripControlCharacters(value.replace(HTML_TAG_PATTERN, '')).trim().slice(0, maxLength);
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
