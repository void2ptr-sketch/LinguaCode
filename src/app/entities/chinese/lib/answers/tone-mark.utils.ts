import type { ToneMark } from '../../../phonetic/model';
import {
  applyToneMarkToVowel as _applyToneMarkToVowel,
  applyToneToLastVowelInSyllable as _applyToneToLastVowelInSyllable,
  applyToneToPinyinSyllable as _applyToneToPinyinSyllable,
} from '../tone-marks/apply-tone';
import { TONE_MARK_TO_BASE } from '../tone-marks/vowel-tone-maps';

/** Тоны по умолчанию для выбора: 1–4 (лёгкий тон исключён). */
export const DEFAULT_TONE_OPTIONS: readonly ToneMark[] = [1, 2, 3, 4];

const VALID_TONE_MARKS: readonly ToneMark[] = [1, 2, 3, 4, 5];

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

/** @deprecated Используйте `applyToneMarkToVowel` из `../tone-marks/apply-tone`. */
export function applyToneMarkToVowel(vowel: string, tone: ToneMark): string {
  return _applyToneMarkToVowel(vowel, tone);
}

/** @deprecated Используйте `applyToneToLastVowelInSyllable` из `../tone-marks/apply-tone`. */
export function applyToneToLastVowelInSyllable(rawBase: string, tone: ToneMark): string {
  return _applyToneToLastVowelInSyllable(rawBase, tone);
}

/** @deprecated Используйте `applyToneToPinyinSyllable` из `../tone-marks/apply-tone`. */
export function applyToneToPinyinSyllable(rawBase: string, tone: ToneMark): string {
  return _applyToneToPinyinSyllable(rawBase, tone);
}

/**
 * Преобразует тоновую гласную в базовую букву.
 * @deprecated Используйте `TONE_MARK_TO_BASE` из `../tone-marks/vowel-tone-maps`.
 */
export function toneMarkToBase(char: string): string | undefined {
  return TONE_MARK_TO_BASE[char];
}
