import { applyToneToPinyinSyllable } from '../../../core/data/chinese/tone-mark.utils';
import type { ToneMark } from '../../../core/models/phonetic-content.types';

/**
 * Generates tone-variant labels for a Pinyin syllable base.
 *
 * @remarks
 * Applies each tone mark from `toneOptions` to `syllableBase` using
 * `applyToneToPinyinSyllable`, producing an array of labeled variants
 * (e.g., "ma1", "ma2", "ma3", "ma4", "ma5").
 *
 * @param syllableBase - The base Pinyin syllable without tone marks.
 * @param toneOptions - Array of tone marks to apply.
 * @returns An array of tone-labeled syllable strings.
 */
export function toneVariantLabels(
  syllableBase: string,
  toneOptions: readonly ToneMark[],
): readonly string[] {
  return toneOptions.map((tone) => applyToneToPinyinSyllable(syllableBase, tone));
}

/**
 * Generates a preview string combining all tone-variant labels.
 *
 * @remarks
 * Joins non-empty tone labels with a bullet separator (` · `).
 * Returns an em dash (`—`) when no valid labels are produced.
 * Useful for displaying tone options in UI labels or tooltips.
 *
 * @param syllableBase - The base Pinyin syllable without tone marks.
 * @param toneOptions - Array of tone marks to apply.
 * @returns A concatenated preview string, or `—` if no labels are produced.
 */
export function toneVariantPreview(syllableBase: string, toneOptions: readonly ToneMark[]): string {
  const labels = toneVariantLabels(syllableBase, toneOptions).filter((label) => label.length > 0);
  return labels.length > 0 ? labels.join(' · ') : '—';
}
