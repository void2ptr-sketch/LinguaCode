import type { ToneMark } from '../../../phonetic/model';
import { applyToneMarkToVowel } from '../answers/tone-mark.utils';
import { stripPinyinTones } from './cjk-romanization.utils';

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

const PINYIN_VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'v']);

const LETTER_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const;

/** Доступные тоны для клавиатуры пиньинь: 1–4 тона + лёгкий тон (5). */
export const PINYIN_TONE_MARKS: readonly ToneMark[] = [1, 2, 3, 4, 5];

export const PINYIN_KEYBOARD_LETTER_ROWS: readonly (readonly PinyinKeyboardKey[])[] = [
  LETTER_ROWS[0].split('').map((char) => ({ kind: 'letter' as const, char })),
  LETTER_ROWS[1].split('').map((char) => ({ kind: 'letter' as const, char })),
  [
    { kind: 'letter' as const, char: 'v', label: 'ü' },
    ...'zxcbnm'.split('').map((char) => ({ kind: 'letter' as const, char })),
  ],
];

export const PINYIN_KEYBOARD_UTILITY_KEYS: readonly PinyinKeyboardKey[] = [
  { kind: 'space' },
  { kind: 'backspace' },
];

/** @deprecated Используйте PINYIN_KEYBOARD_LETTER_ROWS + динамический ряд тонов. */
export const PINYIN_KEYBOARD_LAYOUT: readonly (readonly PinyinKeyboardKey[])[] = [
  ...PINYIN_KEYBOARD_LETTER_ROWS,
  [
    ...PINYIN_TONE_MARKS.map((tone) => ({ kind: 'tone' as const, tone })),
    ...PINYIN_KEYBOARD_UTILITY_KEYS,
  ],
];

export function createPinyinKeyboardState(value = ''): PinyinKeyboardState {
  return { value, toneRowOpen: false };
}

export function isPinyinKeyboardVowel(char: string): boolean {
  return PINYIN_VOWELS.has(char.toLowerCase());
}

export function lastPendingVowel(syllable: string): string {
  const base = stripPinyinTones(syllable).toLowerCase();
  for (let index = base.length - 1; index >= 0; index -= 1) {
    const char = base[index];
    if (isPinyinKeyboardVowel(char)) {
      return char === 'v' ? 'ü' : char;
    }
  }

  return '';
}

function lastSyllable(value: string): string {
  return value.slice(value.lastIndexOf(' ') + 1);
}

/** Последний символ непустой и является гласной (с тоном или без). */
function endsWithVowel(value: string): boolean {
  const last = lastSyllable(value).slice(-1);
  return last.length > 0 && isPinyinKeyboardVowel(stripPinyinTones(last));
}

/** Возвращает последнюю введённую гласную слога — для предпросмотра ряда тонов. */
function lastRawVowel(syllable: string): { index: number; vowelKey: string } | null {
  const base = stripPinyinTones(syllable).toLowerCase();
  for (let index = base.length - 1; index >= 0; index -= 1) {
    const char = base[index];
    if (isPinyinKeyboardVowel(char)) {
      return { index, vowelKey: char === 'v' ? 'ü' : char };
    }
  }

  return null;
}

/**
 * Применяет тон к последней введённой гласной последнего слога строки
 * (сегмент после последнего пробела), сохраняя остальные тоны нетронутыми.
 * Тон всегда попадает ровно на ту гласную, которую показывает ряд тонов.
 */
function applyToneToLastSyllable(value: string, tone: ToneMark): string {
  const spaceIndex = value.lastIndexOf(' ');
  const syllable = value.slice(spaceIndex + 1);
  const placement = lastRawVowel(syllable);
  if (!syllable || !placement) {
    return value;
  }

  const chars = value.split('');
  chars[spaceIndex + 1 + placement.index] = applyToneMarkToVowel(placement.vowelKey, tone);
  return chars.join('');
}

export function formatPinyinKeyboardValue(state: PinyinKeyboardState): string {
  return state.value;
}

export function toneKeyPreview(tone: ToneMark, syllable = 'a'): string {
  const placement = lastRawVowel(syllable);
  const vowel = placement?.vowelKey ?? (lastPendingVowel(syllable) || syllable);
  return applyToneMarkToVowel(vowel, tone);
}

export function syllableSupportsToneMarking(syllable: string): boolean {
  return lastPendingVowel(syllable).length > 0;
}

export function shouldShowPinyinToneRow(state: PinyinKeyboardState): boolean {
  return state.toneRowOpen && syllableSupportsToneMarking(lastSyllable(state.value));
}

export function pendingSyllableTonePreview(state: PinyinKeyboardState, tone: ToneMark): string {
  const placement = lastRawVowel(lastSyllable(state.value));
  if (!placement) {
    return '';
  }

  return applyToneMarkToVowel(placement.vowelKey, tone);
}

export function canApplyPinyinTone(state: PinyinKeyboardState): boolean {
  return shouldShowPinyinToneRow(state);
}

export function applyPinyinKeyboardKey(
  state: PinyinKeyboardState,
  key: PinyinKeyboardKey,
): PinyinKeyboardState {
  switch (key.kind) {
    case 'letter':
      return {
        value: `${state.value}${key.char}`,
        toneRowOpen: isPinyinKeyboardVowel(key.char),
      };
    case 'tone': {
      if (!canApplyPinyinTone(state)) {
        return state;
      }

      // Ряд тонов остаётся активным: после выбора тона можно сразу выбрать другой
      // тон для того же слога. Закроется он при вводе согласной или пробела.
      return {
        value: applyToneToLastSyllable(state.value, key.tone),
        toneRowOpen: true,
      };
    }
    case 'space': {
      if (!state.value || state.value.endsWith(' ')) {
        return state;
      }

      return {
        value: `${state.value} `,
        toneRowOpen: false,
      };
    }
    case 'backspace':
      return {
        value: state.value.slice(0, -1),
        toneRowOpen: endsWithVowel(state.value.slice(0, -1)),
      };
  }
}

export function pinyinKeyboardKeyLabel(key: PinyinKeyboardKey): string {
  switch (key.kind) {
    case 'letter':
      return key.label ?? key.char;
    case 'tone':
      return toneKeyPreview(key.tone);
    case 'space':
      return '␣';
    case 'backspace':
      return '⌫';
  }
}

export function pinyinKeyboardKeyAriaLabel(key: PinyinKeyboardKey): string {
  switch (key.kind) {
    case 'letter':
      return key.label ? `Буква ${key.label}` : `Буква ${key.char}`;
    case 'tone':
      return key.tone === 5 ? 'Лёгкий тон' : `${key.tone}-й тон`;
    case 'space':
      return 'Пробел';
    case 'backspace':
      return 'Удалить';
  }
}

/** Возвращает ARIA-метку тональной клавиши с превью слога для доступности. */
export function pinyinKeyboardToneKeyAriaLabel(state: PinyinKeyboardState, tone: ToneMark): string {
  const preview = pendingSyllableTonePreview(state, tone);
  const toneLabel = tone === 5 ? 'Лёгкий тон' : `${tone}-й тон`;
  return `${toneLabel}: ${preview}`;
}
