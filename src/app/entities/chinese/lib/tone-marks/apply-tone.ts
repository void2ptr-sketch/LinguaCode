import type { ToneMark } from '../../../phonetic/model';
import { stripPinyinTones } from './tone-stripping';
import { VOWEL_TONE_MARKS, type MarkedTone } from './vowel-tone-maps';

/** Гласные пиньинь во внутреннем представлении (ü → 'v'). */
export const PINYIN_VOWELS: ReadonlySet<string> = new Set(['a', 'e', 'i', 'o', 'u', 'v']);

/**
 * Находит последнюю гласную слога (внутреннее представление, ü → 'v').
 * Возвращает `null`, если гласных нет.
 */
export function findLastVowelIndex(syllable: string): { index: number; vowelKey: string } | null {
  const base = stripPinyinTones(syllable).toLowerCase();
  for (let index = base.length - 1; index >= 0; index -= 1) {
    const char = base[index];
    if (PINYIN_VOWELS.has(char)) {
      return { index, vowelKey: char === 'v' ? 'ü' : char };
    }
  }

  return null;
}

/** Применяет тоновую марку к одной гласной. */
export function applyToneMarkToVowel(vowel: string, tone: ToneMark): string {
  const normalized = vowel === 'v' ? 'ü' : vowel.toLowerCase();
  if (tone === 5) {
    return normalized === 'ü' ? 'ü' : normalized;
  }

  const marks = VOWEL_TONE_MARKS[normalized];
  return marks?.[tone] ?? vowel;
}

/**
 * Применяет тон к слогу пиньинь по правилам приоритета гласных:
 * a → e → o в 'ou' → последняя из i/o/u/v.
 */
export function applyToneToPinyinSyllable(rawBase: string, tone: ToneMark): string {
  const base = stripPinyinTones(rawBase);
  if (!base) {
    return '';
  }

  const displayBase = base.replace(/v/g, 'ü');
  if (tone === 5) {
    return displayBase;
  }

  const lower = base.toLowerCase();
  let vowelIndex = -1;
  let vowelKey = '';

  if (lower.includes('a')) {
    vowelIndex = lower.indexOf('a');
    vowelKey = 'a';
  } else if (lower.includes('e')) {
    vowelIndex = lower.indexOf('e');
    vowelKey = 'e';
  } else if (lower.includes('ou')) {
    vowelIndex = lower.indexOf('o');
    vowelKey = 'o';
  } else {
    const last = findLastVowelIndex(base);
    if (last) {
      vowelIndex = last.index;
      vowelKey = last.vowelKey;
    }
  }

  if (vowelIndex < 0) {
    return displayBase;
  }

  return applyToneMarkAtIndex(displayBase, vowelIndex, vowelKey, tone);
}

/**
 * Применяет тон к последней введённой гласной слога (без правил приоритета).
 * Используется клавиатурой — тон попадает на последнюю набранную гласную.
 */
export function applyToneToLastVowelInSyllable(rawBase: string, tone: ToneMark): string {
  const base = stripPinyinTones(rawBase);
  if (!base) {
    return '';
  }

  const displayBase = base.replace(/v/g, 'ü');
  if (tone === 5) {
    return displayBase;
  }

  const last = findLastVowelIndex(base);
  if (!last) {
    return displayBase;
  }

  return applyToneMarkAtIndex(displayBase, last.index, last.vowelKey, tone);
}

function applyToneMarkAtIndex(
  displayBase: string,
  vowelIndex: number,
  vowelKey: string,
  tone: MarkedTone,
): string {
  const chars = Array.from(displayBase);
  const marks = VOWEL_TONE_MARKS[vowelKey];
  chars[vowelIndex] = marks?.[tone] ?? chars[vowelIndex];
  return chars.join('');
}
