import { PINYIN_TONE_MAP } from './pinyin-tone-map';

/**
 * Удаляет тоновые марки из строки пиньинь, возвращая базовые латинские символы (ü → v).
 */
export function stripPinyinTones(value: string): string {
  let result = '';
  for (const char of value.normalize('NFD')) {
    if (PINYIN_TONE_MAP[char]) {
      result += PINYIN_TONE_MAP[char];
      continue;
    }

    if (/\p{M}/u.test(char)) {
      continue;
    }

    result += char;
  }

  return result.replace(/ü/g, 'v').toLowerCase();
}
