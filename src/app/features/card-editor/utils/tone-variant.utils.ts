import { applyToneToPinyinSyllable } from '../../../core/data/chinese/tone-mark.utils';
import type { ToneMark } from '../../../core/models/phonetic-content.types';

export function toneVariantLabels(
  syllableBase: string,
  toneOptions: readonly ToneMark[],
): readonly string[] {
  return toneOptions.map((tone) => applyToneToPinyinSyllable(syllableBase, tone));
}

export function toneVariantPreview(syllableBase: string, toneOptions: readonly ToneMark[]): string {
  const labels = toneVariantLabels(syllableBase, toneOptions).filter((label) => label.length > 0);
  return labels.length > 0 ? labels.join(' · ') : '—';
}
