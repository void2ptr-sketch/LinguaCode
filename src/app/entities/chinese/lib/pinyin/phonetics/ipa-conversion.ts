import type { ToneMark } from '../../../../phonetic/model';
import { PINYIN_TONE_MAP, toneFromMarkedVowel } from '../../tone-marks/vowel-tone-maps';

/** Число тона пиньинь (1–4 + лёгкий 5). */
export type PinyinTone = ToneMark;

/** Базовый слог (без тона) → IPA-ядро/начало (Mandarin, simplified). */
export const PINYIN_SYLLABLE_IPA: Readonly<Record<string, string>> = {
  guo: 'kuɔ',
  hao: 'xaʊ',
  ma: 'ma',
  ni: 'ni',
  xie: 'ɕjɛ',
  zhong: 'ʈʂʊŋ',
};

/** Число тона пиньинь → контурная маркировка Чао. */
const CHAO_TONE_CONTOURS: Record<number, string> = {
  1: '˥',
  2: '˧˥',
  3: '˨˩˦',
  4: '˥˩',
  5: '',
};

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
