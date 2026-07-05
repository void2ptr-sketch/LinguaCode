import { stripPinyinTones } from './cjk-romanization.utils';
import type { ToneMark } from '../../models/phonetic-content.types';

export const DEFAULT_TONE_OPTIONS: readonly ToneMark[] = [1, 2, 3, 4];

const VALID_TONE_MARKS: readonly ToneMark[] = [1, 2, 3, 4, 5];

const VOWEL_TONE_MARKS: Record<string, Record<1 | 2 | 3 | 4, string>> = {
  a: { 1: 'ā', 2: 'á', 3: 'ǎ', 4: 'à' },
  e: { 1: 'ē', 2: 'é', 3: 'ě', 4: 'è' },
  i: { 1: 'ī', 2: 'í', 3: 'ǐ', 4: 'ì' },
  o: { 1: 'ō', 2: 'ó', 3: 'ǒ', 4: 'ò' },
  u: { 1: 'ū', 2: 'ú', 3: 'ǔ', 4: 'ù' },
  ü: { 1: 'ǖ', 2: 'ǘ', 3: 'ǚ', 4: 'ǜ' },
};

export const TONE_LABELS_RU: Record<ToneMark, string> = {
  1: '1-й тон',
  2: '2-й тон',
  3: '3-й тон',
  4: '4-й тон',
  5: 'лёгкий',
};

export function isToneMark(value: number): value is ToneMark {
  return VALID_TONE_MARKS.includes(value as ToneMark);
}

export function normalizeToneOptions(options: readonly ToneMark[]): readonly ToneMark[] | null {
  const unique = [...new Set(options.filter(isToneMark))].sort((left, right) => left - right);

  if (unique.length < 2 || unique.length > 5) {
    return null;
  }

  return unique;
}

export function toneMarkLabel(tone: ToneMark): string {
  return TONE_LABELS_RU[tone];
}

export function applyToneMarkToVowel(vowel: string, tone: ToneMark): string {
  const normalized = vowel === 'v' ? 'ü' : vowel.toLowerCase();
  if (tone === 5) {
    return normalized === 'ü' ? 'ü' : normalized;
  }

  const marks = VOWEL_TONE_MARKS[normalized];
  return marks?.[tone] ?? vowel;
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
    if (char === 'a' || char === 'e' || char === 'i' || char === 'o' || char === 'u' || char === 'v') {
      const vowelKey = char === 'v' ? 'ü' : char;
      return applyToneMarkAtIndex(displayBase, index, vowelKey, tone);
    }
  }

  return displayBase;
}

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
