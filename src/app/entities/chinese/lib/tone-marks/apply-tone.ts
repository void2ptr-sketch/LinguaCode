import { stripPinyinTones } from '../pinyin/romanization/tone-stripping';
import type { ToneMark } from '../../../phonetic/model';
import { VOWEL_TONE_MARKS } from './vowel-tone-maps';

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
    for (let index = lower.length - 1; index >= 0; index -= 1) {
      const char = lower[index];
      if (char === 'i' || char === 'o' || char === 'u' || char === 'v') {
        vowelIndex = index;
        vowelKey = char === 'v' ? 'ü' : char;
        break;
      }
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

  const lower = base.toLowerCase();
  for (let index = lower.length - 1; index >= 0; index -= 1) {
    const char = lower[index];
    if (
      char === 'a' ||
      char === 'e' ||
      char === 'i' ||
      char === 'o' ||
      char === 'u' ||
      char === 'v'
    ) {
      const vowelKey = char === 'v' ? 'ü' : char;
      return applyToneMarkAtIndex(displayBase, index, vowelKey, tone);
    }
  }

  return displayBase;
}

function applyToneMarkAtIndex(
  displayBase: string,
  vowelIndex: number,
  vowelKey: string,
  tone: 1 | 2 | 3 | 4,
): string {
  const chars = displayBase.split('');
  const marks = VOWEL_TONE_MARKS[vowelKey];
  chars[vowelIndex] = marks?.[tone] ?? chars[vowelIndex];
  return chars.join('');
}
