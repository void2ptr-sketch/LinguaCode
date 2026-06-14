import { toneVariantLabels, toneVariantPreview } from './tone-variant.utils';

describe('tone-variant.utils', () => {
  it('generates toned syllable labels from base', () => {
    const labels = toneVariantLabels('ma', [1, 2, 3, 4]);
    expect(labels.join(' ')).toContain('mā');
    expect(toneVariantPreview('ma', [1, 2, 3, 4])).toContain('mā');
  });
});
