import { PINYIN_TONE_MAP, VOWEL_TONE_MARKS } from './vowel-tone-maps';

/** Все формы ü (4 тонированные + нетонированная) — производные от `VOWEL_TONE_MARKS`. */
const Ü_FORMS: ReadonlySet<string> = new Set([...Object.values(VOWEL_TONE_MARKS['ü']), '\u00fc']);

/**
 * Удаляет тоновые марки из строки пиньинь, возвращая базовые латинские символы (ü → v).
 */
export function stripPinyinTones(value: string): string {
  let result = '';
  // Заменяем ü и все тонированные формы ü на v ДО NFD-нормализации,
  // чтобы разложение ü → u + combining diaeresis не приводило к потере символа
  let normalized = '';
  for (const char of value) {
    normalized += Ü_FORMS.has(char) ? 'v' : char;
  }
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
