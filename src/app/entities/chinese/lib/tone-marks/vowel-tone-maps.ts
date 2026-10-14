/**
 * Маппинг тоновых гласных → базовые буквы и номера тонов.
 * Единый источник данных для всей логики тоновых марок.
 *
 * Все остальные карты (`TONE_MARK_TO_BASE`, `TONE_MARK_TO_TONE`, `PINYIN_TONE_MAP`)
 * являются производными от `VOWEL_TONE_MARKS` и не должны дублировать данные вручную.
 */

/** Номер тона, который может быть проставлен маркой (1–4). */
export type MarkedTone = 1 | 2 | 3 | 4;

/** Базовая гласная (без тона) → набор тоновых марок (1–4). Ключ 'ü' (не 'v'). */
export const VOWEL_TONE_MARKS: Readonly<Record<string, Readonly<Record<MarkedTone, string>>>> = {
  a: { 1: '\u0101', 2: '\u00e1', 3: '\u01ce', 4: '\u00e0' },
  e: { 1: '\u0113', 2: '\u00e9', 3: '\u011b', 4: '\u00e8' },
  i: { 1: '\u012b', 2: '\u00ed', 3: '\u01d0', 4: '\u00ec' },
  o: { 1: '\u014d', 2: '\u00f3', 3: '\u01d2', 4: '\u00f2' },
  u: { 1: '\u016b', 2: '\u00fa', 3: '\u01d4', 4: '\u00f9' },
  ü: { 1: '\u01d6', 2: '\u01d8', 3: '\u01da', 4: '\u01dc' },
};

/** Внутренняя базовая форма для ü — 'v' (как в `stripPinyinTones`). */
const BASE_FOR_Ü = 'v';

/** Тоновая гласная (с тоном) → базовая буква. Формы ü → 'v'. */
export const TONE_MARK_TO_BASE: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(VOWEL_TONE_MARKS).flatMap(([vowel, marks]) =>
    Object.values(marks).map((mark) => [mark, vowel === 'ü' ? BASE_FOR_Ü : vowel]),
  ),
);

/** Тоновая гласная → номер тона (1–4). */
const TONE_MARK_TO_TONE: Readonly<Record<string, MarkedTone>> = Object.fromEntries(
  Object.entries(VOWEL_TONE_MARKS).flatMap(([, marks]) =>
    ([1, 2, 3, 4] as const).map((tone) => [marks[tone], tone]),
  ),
);

/** Тоновая гласная → номер тона (1–4). Возвращает `null` для нетоновых символов. */
export function toneFromMarkedVowel(char: string): MarkedTone | null {
  return TONE_MARK_TO_TONE[char] ?? null;
}

/**
 * Маппинг тоновых символов пиньинь → базовые латинские буквы.
 * Производная от `VOWEL_TONE_MARKS`; дополнительно включает нетонированный ü → 'v'.
 */
export const PINYIN_TONE_MAP: Readonly<Record<string, string>> = {
  ...TONE_MARK_TO_BASE,
  '\u00fc': 'v', // ü
};
