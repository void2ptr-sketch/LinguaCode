import type { ToneMark } from '../../models/phonetic-content.types';
import { applyToneMarkToVowel, applyToneToLastVowelInSyllable } from './tone-mark.utils';
import { stripPinyinTones } from './cjk-romanization.utils';

export type PinyinKeyboardKey =
  | { kind: 'letter'; char: string; label?: string }
  | { kind: 'tone'; tone: ToneMark }
  | { kind: 'space' }
  | { kind: 'backspace' };

export type PinyinKeyboardState = {
  committed: string;
  pendingSyllable: string;
  toneRowOpen: boolean;
};

const PINYIN_VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'v']);

export const MAX_PENDING_SYLLABLE_LENGTH = 6;

const LETTER_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const;

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
  const trimmed = value.trimEnd();
  if (!trimmed) {
    return {
      committed: '',
      pendingSyllable: '',
      toneRowOpen: false,
    };
  }

  const lastSpaceIndex = trimmed.lastIndexOf(' ');
  if (lastSpaceIndex >= 0) {
    return {
      committed: trimmed.slice(0, lastSpaceIndex + 1),
      pendingSyllable: trimmed.slice(lastSpaceIndex + 1),
      toneRowOpen: false,
    };
  }

  if (hasPinyinToneMarks(trimmed)) {
    return {
      committed: trimmed,
      pendingSyllable: '',
      toneRowOpen: false,
    };
  }

  return {
    committed: '',
    pendingSyllable: trimmed,
    toneRowOpen: false,
  };
}

function hasPinyinToneMarks(text: string): boolean {
  return stripPinyinTones(text) !== text;
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

function resolveToneRowOpen(pendingSyllable: string): boolean {
  return lastPendingVowel(pendingSyllable).length > 0;
}

export function formatPinyinKeyboardValue(state: PinyinKeyboardState): string {
  const { committed, pendingSyllable } = state;
  if (!pendingSyllable) {
    return committed;
  }

  if (!committed) {
    return pendingSyllable;
  }

  return committed.endsWith(' ')
    ? `${committed}${pendingSyllable}`
    : `${committed} ${pendingSyllable}`;
}

export function toneKeyPreview(tone: ToneMark, syllable = 'a'): string {
  const vowel = lastPendingVowel(syllable) || syllable;
  return applyToneMarkToVowel(vowel, tone);
}

export function syllableSupportsToneMarking(syllable: string): boolean {
  return lastPendingVowel(syllable).length > 0;
}

export function shouldShowPinyinToneRow(state: PinyinKeyboardState): boolean {
  return state.toneRowOpen && syllableSupportsToneMarking(state.pendingSyllable);
}

export function pendingSyllableTonePreview(state: PinyinKeyboardState, tone: ToneMark): string {
  const vowel = lastPendingVowel(state.pendingSyllable);
  if (!vowel) {
    return '';
  }

  return applyToneMarkToVowel(vowel, tone);
}

export function canApplyPinyinTone(state: PinyinKeyboardState): boolean {
  return shouldShowPinyinToneRow(state);
}

function appendTonedSyllable(committed: string, syllable: string, tone: ToneMark): string {
  const toned = applyToneToLastVowelInSyllable(syllable, tone);
  if (!committed) {
    return toned;
  }

  if (committed.endsWith(' ')) {
    return `${committed}${toned}`;
  }

  return `${committed} ${toned}`;
}

function commitPendingNeutral(state: PinyinKeyboardState): PinyinKeyboardState {
  if (!state.pendingSyllable) {
    return state;
  }

  return {
    committed: appendTonedSyllable(state.committed, state.pendingSyllable, 5),
    pendingSyllable: '',
    toneRowOpen: false,
  };
}

function ensurePendingCapacity(state: PinyinKeyboardState): PinyinKeyboardState {
  if (state.pendingSyllable.length < MAX_PENDING_SYLLABLE_LENGTH) {
    return state;
  }

  return commitPendingNeutral(state);
}

export function applyPinyinKeyboardKey(
  state: PinyinKeyboardState,
  key: PinyinKeyboardKey,
): PinyinKeyboardState {
  switch (key.kind) {
    case 'letter': {
      const baseState = ensurePendingCapacity(state);

      if (isPinyinKeyboardVowel(key.char)) {
        const lastChar = baseState.pendingSyllable.slice(-1);
        if (lastChar === key.char) {
          return {
            ...baseState,
            toneRowOpen: resolveToneRowOpen(baseState.pendingSyllable),
          };
        }

        const nextSyllable = `${baseState.pendingSyllable}${key.char}`;
        if (nextSyllable.length > MAX_PENDING_SYLLABLE_LENGTH) {
          return state;
        }

        return {
          ...baseState,
          pendingSyllable: nextSyllable,
          toneRowOpen: resolveToneRowOpen(nextSyllable),
        };
      }

      const nextSyllable = `${baseState.pendingSyllable}${key.char}`;
      if (nextSyllable.length > MAX_PENDING_SYLLABLE_LENGTH) {
        return state;
      }

      return {
        ...baseState,
        pendingSyllable: nextSyllable,
        toneRowOpen: false,
      };
    }
    case 'tone': {
      if (!canApplyPinyinTone(state)) {
        return state;
      }

      return {
        committed: appendTonedSyllable(state.committed, state.pendingSyllable, key.tone),
        pendingSyllable: '',
        toneRowOpen: false,
      };
    }
    case 'space': {
      if (state.pendingSyllable) {
        return {
          committed: appendTonedSyllable(state.committed, state.pendingSyllable, 5),
          pendingSyllable: '',
          toneRowOpen: false,
        };
      }

      if (!state.committed || state.committed.endsWith(' ')) {
        return state;
      }

      return {
        ...state,
        committed: `${state.committed} `,
      };
    }
    case 'backspace': {
      if (state.pendingSyllable) {
        const nextPending = state.pendingSyllable.slice(0, -1);
        return {
          ...state,
          pendingSyllable: nextPending,
          toneRowOpen: resolveToneRowOpen(nextPending),
        };
      }

      return {
        ...state,
        committed: state.committed.slice(0, -1),
        toneRowOpen: false,
      };
    }
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

export function pinyinKeyboardToneKeyAriaLabel(
  state: PinyinKeyboardState,
  tone: ToneMark,
): string {
  const preview = pendingSyllableTonePreview(state, tone);
  const toneLabel = tone === 5 ? 'Лёгкий тон' : `${tone}-й тон`;
  return `${toneLabel}: ${preview}`;
}
