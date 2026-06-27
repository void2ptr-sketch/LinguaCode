import type { RomanizationSystem } from '../models/phonetic-content.types';
import { stripPinyinTones } from './cjk-romanization.utils';

export function normalizePalladiusAnswer(value: string): string {
  return value.trim().replace(/ё/g, 'е').replace(/\s+/g, ' ').toLowerCase();
}

export function normalizePinyinAnswer(value: string, stripTones = true): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!stripTones) {
    return trimmed.toLowerCase();
  }

  return stripPinyinTones(trimmed);
}

export function normalizeZhuyinAnswer(value: string): string {
  return value.trim().replace(/\s+/g, '');
}

export function normalizeHanAnswer(value: string): string {
  return value.trim().replace(/\s+/g, '');
}

export function normalizeRomanizationAnswer(
  value: string,
  system: RomanizationSystem,
  stripTones = true,
): string {
  switch (system) {
    case 'palladius':
      return normalizePalladiusAnswer(value);
    case 'pinyin':
      return normalizePinyinAnswer(value, stripTones);
    case 'zhuyin':
      return normalizeZhuyinAnswer(value);
  }
}

export function answersMatchRomanization(
  actual: string,
  expected: string,
  system: RomanizationSystem,
  stripTones = true,
): boolean {
  return (
    normalizeRomanizationAnswer(actual, system, stripTones) ===
    normalizeRomanizationAnswer(expected, system, stripTones)
  );
}
