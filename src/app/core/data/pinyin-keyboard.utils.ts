import type { ToneMark } from '../models/phonetic-content.types';
import { applyToneToPinyinSyllable } from './tone-mark.utils';

export type PinyinKeyboardKey =
  | { kind: 'letter'; char: string; label?: string }
  | { kind: 'tone'; tone: ToneMark }
  | { kind: 'space' }
  | { kind: 'backspace' };

export type PinyinKeyboardState = {
  committed: string;
  pendingSyllable: string;
};

const LETTER_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const;

const TONE_PREVIEW_BASE = 'a';

export const PINYIN_KEYBOARD_LAYOUT: readonly (readonly PinyinKeyboardKey[])[] = [
  LETTER_ROWS[0].split('').map((char) => ({ kind: 'letter' as const, char })),
  LETTER_ROWS[1].split('').map((char) => ({ kind: 'letter' as const, char })),
  [{ kind: 'letter' as const, char: 'v', label: 'ü' }, ...'zxcbnm'.split('').map((char) => ({ kind: 'letter' as const, char }))],
  [
    { kind: 'tone' as const, tone: 1 },
    { kind: 'tone' as const, tone: 2 },
    { kind: 'tone' as const, tone: 3 },
    { kind: 'tone' as const, tone: 4 },
    { kind: 'tone' as const, tone: 5 },
    { kind: 'space' as const },
    { kind: 'backspace' as const },
  ],
];

export function createPinyinKeyboardState(value = ''): PinyinKeyboardState {
  return {
    committed: value.trimEnd(),
    pendingSyllable: '',
  };
}

export function formatPinyinKeyboardValue(state: PinyinKeyboardState): string {
  const { committed, pendingSyllable } = state;
  if (!pendingSyllable) {
    return committed;
  }

  if (!committed) {
    return pendingSyllable;
  }

  return committed.endsWith(' ') ? `${committed}${pendingSyllable}` : `${committed} ${pendingSyllable}`;
}

export function toneKeyPreview(tone: ToneMark): string {
  return applyToneToPinyinSyllable(TONE_PREVIEW_BASE, tone);
}

export function canApplyPinyinTone(state: PinyinKeyboardState): boolean {
  return state.pendingSyllable.trim().length > 0;
}

function appendTonedSyllable(committed: string, syllable: string, tone: ToneMark): string {
  const toned = applyToneToPinyinSyllable(syllable, tone);
  if (!committed) {
    return toned;
  }

  if (committed.endsWith(' ')) {
    return `${committed}${toned}`;
  }

  return `${committed} ${toned}`;
}

export function applyPinyinKeyboardKey(
  state: PinyinKeyboardState,
  key: PinyinKeyboardKey,
): PinyinKeyboardState {
  switch (key.kind) {
    case 'letter': {
      const nextSyllable = `${state.pendingSyllable}${key.char}`;
      if (nextSyllable.length > 6) {
        return state;
      }

      return {
        ...state,
        pendingSyllable: nextSyllable,
      };
    }
    case 'tone': {
      if (!canApplyPinyinTone(state)) {
        return state;
      }

      return {
        committed: appendTonedSyllable(state.committed, state.pendingSyllable, key.tone),
        pendingSyllable: '',
      };
    }
    case 'space': {
      if (state.pendingSyllable) {
        return {
          committed: appendTonedSyllable(state.committed, state.pendingSyllable, 5),
          pendingSyllable: '',
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
        return {
          ...state,
          pendingSyllable: state.pendingSyllable.slice(0, -1),
        };
      }

      return {
        ...state,
        committed: state.committed.slice(0, -1),
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
