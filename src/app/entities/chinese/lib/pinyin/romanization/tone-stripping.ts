import { PINYIN_TONE_MAP } from './pinyin-tone-map';

/**
 * Удаляет тоновые марки из строки пиньинь, возвращая базовые латинские символы (ü → v).
 */
export function stripPinyinTones(value: string): string {
  let result = '';
  // Заменяем ü и все тонированные формы ü на v ДО NFD-нормализации,
  // чтобы разложение ü → u + combining diaeresis не приводило к потере символа
  const normalized = value
    .replace(/\u01d6/g, 'v') // ǖ
    .replace(/\u01d8/g, 'v') // ǘ
    .replace(/\u01da/g, 'v') // ǚ
    .replace(/\u01dc/g, 'v') // ǜ
    .replace(/\u00fc/g, 'v'); // ü
  for (const char of normalized.normalize('NFD')) {
    if (PINYIN_TONE_MAP[char]) {
      result += PINYIN_TONE_MAP[char];
      continue;
    }

    if (/\p{M}/u.test(char)) {
      continue;
    }

    result += char;
  }

  return result.toLowerCase();
}
