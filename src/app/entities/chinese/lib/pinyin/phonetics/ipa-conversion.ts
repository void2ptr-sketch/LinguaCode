import { PINYIN_TONE_MAP } from '../romanization/pinyin-tone-map';
import { convertPinyinToIpa } from './ipa-mapping';

/** Число тона пиньинь (1–4 + лёгкий 5). */
export type PinyinTone = 1 | 2 | 3 | 4 | 5;

/**
 * Разбирает слог пиньинь на базовую форму и тон;
 * поддерживает как числовые, так и тоновые марки.
 */
export function parsePinyinSyllable(raw: string): { base: string; tone: PinyinTone } {
  let tone: PinyinTone = 5;
  let base = '';

  for (const char of raw.trim().toLowerCase()) {
    if (char >= '1' && char <= '5') {
      tone = Number(char) as PinyinTone;
      continue;
    }

    if (PINYIN_TONE_MAP[char]) {
      base += PINYIN_TONE_MAP[char];
      const toneFromVowel = toneFromMarkedVowel(char);
      if (toneFromVowel) {
        tone = toneFromVowel;
      }
      continue;
    }

    base += char;
  }

  return { base, tone };
}

/** Преобразует отдельный слог пиньинь в IPA (МФА). */
export function pinyinSyllableToIpa(syllable: string): string {
  return convertPinyinToIpa(syllable, parsePinyinSyllable);
}

/** Преобразует строку пиньинь (один или несколько слогов через пробел) в IPA (МФА). */
export function pinyinToIpa(pinyin: string): string {
  return pinyin
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map((syllable) => pinyinSyllableToIpa(syllable))
    .join(' ');
}

function toneFromMarkedVowel(char: string): PinyinTone | null {
  const toneByChar: Record<string, PinyinTone> = {
    ā: 1,
    á: 2,
    ǎ: 3,
    à: 4,
    ē: 1,
    é: 2,
    ě: 3,
    è: 4,
    ī: 1,
    í: 2,
    ǐ: 3,
    ì: 4,
    ō: 1,
    ó: 2,
    ǒ: 3,
    ò: 4,
    ū: 1,
    ú: 2,
    ǔ: 3,
    ù: 4,
    ǖ: 1,
    ǘ: 2,
    ǚ: 3,
    ǜ: 4,
  };

  return toneByChar[char] ?? null;
}
