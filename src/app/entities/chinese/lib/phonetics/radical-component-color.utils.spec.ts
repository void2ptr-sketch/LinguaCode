import {
  MAX_RADICAL_COMPONENTS,
  radicalComponentColor,
  resolveRadicalComponentPalette,
} from './radical-component-color.utils';

describe('radical-component-color.utils', () => {
  it('should map component index to palette slots 1–4 from profile scheme', () => {
    const palette = resolveRadicalComponentPalette('classic');
    expect(palette).toEqual(['#ff0000', '#ffa500', '#008000', '#0000ff']);
    expect(radicalComponentColor(palette, 0)).toBe('#ff0000');
    expect(radicalComponentColor(palette, 1)).toBe('#ffa500');
    expect(radicalComponentColor(palette, 3)).toBe('#0000ff');
    expect(radicalComponentColor(palette, 4)).toBe('#ff0000');
  });

  it('should wrap indices beyond max components', () => {
    const palette = resolveRadicalComponentPalette('classic');
    expect(radicalComponentColor(palette, MAX_RADICAL_COMPONENTS)).toBe(palette[0]);
  });
});
