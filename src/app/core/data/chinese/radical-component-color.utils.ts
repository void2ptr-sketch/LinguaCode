import type { ToneColorSchemeId } from '../../models/tone-color.types';
import { resolveToneColorPalette } from './tone-color.utils';

/** Максимум компонентов в типичном разложении (女+子, 日+月, …). */
export const MAX_RADICAL_COMPONENTS = 4;

export type RadicalComponentPalette = readonly [string, string, string, string];

/**
 * Палитра для режима «Радикалы»: четыре различимых цвета по **позиции** компонента.
 * Берёт слоты 1–4 из схемы профиля — это не тоны слога, а визуальные метки частей.
 */
export function resolveRadicalComponentPalette(
  schemeId?: ToneColorSchemeId | null,
): RadicalComponentPalette {
  const palette = resolveToneColorPalette(schemeId);
  return [palette[1], palette[2], palette[3], palette[4]];
}

export function radicalComponentColor(
  componentPalette: RadicalComponentPalette,
  componentIndex: number,
): string {
  const safeIndex =
    ((componentIndex % MAX_RADICAL_COMPONENTS) + MAX_RADICAL_COMPONENTS) % MAX_RADICAL_COMPONENTS;
  return componentPalette[safeIndex];
}
