import type { RomanizationSystem } from '../../../models';
import { stripPinyinTones } from '../pinyin/cjk-romanization.utils';

/** Нормализует ответ пользователя для системы Палладий: убирает пробелы, заменяет ё на е, приводит к нижнему регистру. */
export function normalizePalladiusAnswer(value: string): string {
  return value.trim().replace(/ё/g, 'е').replace(/\s+/g, ' ').toLowerCase();
}

/** Нормализует ответ пользователя для Пиньинь: при `stripTones` (по умолчанию) убирает тоновые марки, иначе — только трим и нижний регистр. */
export function normalizePinyinAnswer(value: string, stripTones = true): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!stripTones) {
    return trimmed.toLowerCase();
  }

  return stripPinyinTones(trimmed);
}

/** Нормализует ответ пользователя для Чжуинь: убирает все пробелы и приводит к триму. */
export function normalizeZhuyinAnswer(value: string): string {
  return value.trim().replace(/\s+/g, '');
}

/** Нормализует ответ пользователя для иероглифов: убирает пробелы и приводит к триму. */
export function normalizeHanAnswer(value: string): string {
  return value.trim().replace(/\s+/g, '');
}

/** Делегирует нормализацию ответа пользователю в зависимости от системы транскрипции. */
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

/** Сравнивает фактический и ожидаемый ответы с учётом системы транскрипции и опции удаления тонов. */
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
