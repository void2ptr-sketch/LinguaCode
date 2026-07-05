import type { DrawStrokeGuide } from '../../models/draw-practice.types';

export const HAN_RADICAL_HINTS: Readonly<Record<string, string>> = {
  好: '女 + 子',
  行: '彳 + 亍',
  明: '日 + 月',
  河: '氵 + 可',
  语: '讠 + 吾',
};

/** Типичное пиньинь компонента/радикала для раскраски по тону. */
export const HAN_COMPONENT_PINYIN: Readonly<Record<string, string>> = {
  女: 'nǚ',
  子: 'zǐ',
  彳: 'chì',
  亍: 'chù',
  日: 'rì',
  月: 'yuè',
  氵: 'shuǐ',
  可: 'kě',
  讠: 'yán',
  吾: 'wú',
};

export function lookupHanComponentPinyin(character: string): string | null {
  const key = character.trim();
  if (!key) {
    return null;
  }

  return HAN_COMPONENT_PINYIN[key] ?? null;
}

export function lookupHanRadicalHint(character: string): string | null {
  const key = character.trim();
  if (!key) {
    return null;
  }

  return HAN_RADICAL_HINTS[key] ?? null;
}

export function primaryHanCharacter(value: string): string {
  return [...value.trim()].find((char) => char.codePointAt(0)! > 0x2e7f) ?? value.trim();
}

/** @deprecated Черты берутся из assets/hanzi в runtime; оставлено для чтения legacy JSON. */
export type LegacyDrawStrokeGuide = DrawStrokeGuide;
