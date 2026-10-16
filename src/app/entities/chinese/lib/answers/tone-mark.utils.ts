import { ALL_TONE_MARKS } from '../../../phonetic/model';
import type { ToneMark } from '../../../phonetic/model';

/** Тоны по умолчанию для выбора: 1–4 (лёгкий тон исключён). */
export const DEFAULT_TONE_OPTIONS: readonly ToneMark[] = [1, 2, 3, 4];

export const TONE_LABELS_RU: Record<ToneMark, string> = {
  1: '1-й тон',
  2: '2-й тон',
  3: '3-й тон',
  4: '4-й тон',
  5: 'лёгкий',
};

export function isToneMark(value: number): value is ToneMark {
  return ALL_TONE_MARKS.includes(value as ToneMark);
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
