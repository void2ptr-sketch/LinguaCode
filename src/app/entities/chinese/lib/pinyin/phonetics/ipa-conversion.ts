import { PINYIN_TONE_MAP } from '../romanization/pinyin-tone-map';
import { convertPinyinToIpa } from './ipa-mapping';
import type { ToneMark } from '../../../../phonetic/model';
import { toneFromMarkedVowel } from '../../tone-marks/vowel-tone-maps';

/** Число тона пиньинь (1–4 + лёгкий 5). */
export type PinyinTone = ToneMark;

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
      if (toneFromVowel !== null) {
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
