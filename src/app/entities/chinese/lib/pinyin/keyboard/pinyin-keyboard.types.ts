import type { ToneMark } from '../../../../phonetic/model';

/** Клавиша виртуальной клавиатуры пиньинь. */
export type PinyinKeyboardKey =
  | { kind: 'letter'; char: string; label?: string }
  | { kind: 'tone'; tone: ToneMark }
  | { kind: 'space' }
  | { kind: 'backspace' };

/**
 * Состояние клавиатуры пиньинь при свободном вводе.
 * Вся строка хранится в `value`; пробелы вставляет только пользователь.
 */
export type PinyinKeyboardState = {
  value: string;
  toneRowOpen: boolean;
};
