import { describe, expect, it } from 'vitest';

import { getLanguageFlagEmoji } from './language-flag.utils';

describe('getLanguageFlagEmoji', () => {
  it('returns known flags for ISO 639-1 codes (case-insensitive)', () => {
    expect(getLanguageFlagEmoji('en')).toBe('\u{1F1EC}\u{1F1E7}');
    expect(getLanguageFlagEmoji('EN')).toBe('\u{1F1EC}\u{1F1E7}');
    expect(getLanguageFlagEmoji('ru')).toBe('\u{1F1F7}\u{1F1FA}');
    expect(getLanguageFlagEmoji('zh')).toBe('\u{1F1E8}\u{1F1F3}');
    expect(getLanguageFlagEmoji('ja')).toBe('\u{1F1EF}\u{1F1F5}');
  });

  it('builds a flag from any valid unlisted two-letter A-Z code', () => {
    // 'qz' is a valid A-Z pair not in the fixed map → regional indicators Q+Z
    expect(getLanguageFlagEmoji('qz')).toBe('\u{1F1F6}\u{1F1FF}');
  });

  it('returns a flag for short unlisted codes (js is a valid A-Z pair)', () => {
    expect(getLanguageFlagEmoji('js')).toBe('\u{1F1EF}\u{1F1F8}');
  });

  it('returns empty string for non-country codes (CSS badge fallback)', () => {
    expect(getLanguageFlagEmoji('cpp')).toBe('');
    expect(getLanguageFlagEmoji('perl')).toBe('');
  });

  it('returns empty string for empty or too-short codes', () => {
    expect(getLanguageFlagEmoji('')).toBe('');
    expect(getLanguageFlagEmoji('z')).toBe('');
  });
});
