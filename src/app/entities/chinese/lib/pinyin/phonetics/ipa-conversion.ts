import type { ToneMark } from '../../../../phonetic/model';
import { PINYIN_TONE_MAP, toneFromMarkedVowel } from '../../tone-marks/vowel-tone-maps';
import { CHAO_TONE_CONTOURS, PINYIN_SYLLABLE_IPA } from './ipa-mapping';

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

/** Проверяет, есть ли IPA-запись для слога (без учёта тона). */
export function isPinyinSyllableCovered(syllable: string): boolean {
  const { base } = parsePinyinSyllable(syllable);
  return base.length > 0 && PINYIN_SYLLABLE_IPA[base] !== undefined;
}

/**
 * Преобразует слог пиньинь (с тоном) в IPA.
 * Возвращает `null`, если слог не найден в словаре.
 */
export function convertPinyinToIpa(syllable: string): string | null {
  const { base, tone } = parsePinyinSyllable(syllable);
  if (!base) {
    return null;
  }

  const ipaBase = PINYIN_SYLLABLE_IPA[base];
  if (!ipaBase) {
    return null;
  }

  return `${ipaBase}${CHAO_TONE_CONTOURS[tone]}`;
}

/** Преобразует отдельный слог пиньинь в IPA (МФА). Возвращает `null`, если слог не найден. */
export function pinyinSyllableToIpa(syllable: string): string | null {
  return convertPinyinToIpa(syllable);
}

/** Преобразует строку пиньинь (один или несколько слогов через пробел) в IPA (МФА). */
export function pinyinToIpa(pinyin: string): string {
  return pinyin
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map((syllable) => pinyinSyllableToIpa(syllable) ?? syllable)
    .join(' ');
}
