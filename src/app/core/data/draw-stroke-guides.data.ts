import type { DrawStrokeGuide } from '../models/draw-practice.types';

/** Curated stroke guides (normalized viewBox 0 0 100 100) — not a full hanzi DB. */
export const HAN_STROKE_GUIDES: Readonly<Record<string, readonly DrawStrokeGuide[]>> = {
  人: [
    { order: 1, path: 'M 35 12 L 65 88' },
    { order: 2, path: 'M 65 12 L 35 88' },
  ],
  大: [
    { order: 1, path: 'M 50 10 L 50 55' },
    { order: 2, path: 'M 18 42 Q 50 68 82 42' },
    { order: 3, path: 'M 28 78 L 72 78' },
  ],
  好: [
    { order: 1, path: 'M 22 18 L 22 82' },
    { order: 2, path: 'M 12 38 L 32 38' },
    { order: 3, path: 'M 12 58 L 32 58' },
    { order: 4, path: 'M 58 22 L 58 78' },
    { order: 5, path: 'M 48 48 L 68 48' },
    { order: 6, path: 'M 78 28 Q 88 48 78 68' },
  ],
};

export const HAN_RADICAL_HINTS: Readonly<Record<string, string>> = {
  好: '女 + 子',
  行: '彳 + 亍',
  明: '日 + 月',
  河: '氵 + 可',
  语: '讠 + 吾',
};

export function lookupHanStrokeGuides(character: string): readonly DrawStrokeGuide[] {
  const key = character.trim();
  return key ? (HAN_STROKE_GUIDES[key] ?? []) : [];
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
