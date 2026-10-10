import {
  toneVariantLabels,
  toneVariantPreview,
} from './tone-variant.utils';
import type { ToneMark } from '../../../core/models/phonetic-content.types';

describe('toneVariantLabels', () => {
  it('generates tone variants for a syllable', () => {
    const toneOptions: ToneMark[] = [1, 2, 3, 4, 5];
    const result = toneVariantLabels('ma', toneOptions);

    expect(result.length).toBe(5);
    result.forEach((label) => {
      expect(typeof label).toBe('string');
    });
  });

  it('returns empty array for empty tone options', () => {
    const result = toneVariantLabels('ni', []);
    expect(result).toEqual([]);
  });

  it('handles single tone option', () => {
    const result = toneVariantLabels('hao', [3 as ToneMark]);
    expect(result.length).toBe(1);
    expect(typeof result[0]).toBe('string');
  });
});

describe('toneVariantPreview', () => {
  it('joins tone labels with bullet separator', () => {
    const toneOptions: ToneMark[] = [1, 2, 3, 4, 5];
    const result = toneVariantPreview('ma', toneOptions);

    expect(result).toContain('·');
    expect(result).not.toBe('—');
  });

  it('returns em dash for empty tone options', () => {
    const result = toneVariantPreview('ma', []);
    expect(result).toBe('—');
  });

  it('filters empty labels before joining', () => {
    const result = toneVariantPreview('', []);
    expect(result).toBe('—');
  });

  it('handles single tone label', () => {
    const toneOptions: ToneMark[] = [3 as ToneMark];
    const result = toneVariantPreview('ni', toneOptions);
    expect(result).not.toBe('—');
  });
});
