import {
  resolveRadicalComponentCellCenter,
  resolveRadicalComponentSvgTransform,
} from './hanzi-radical-layout.utils';

describe('hanzi-radical-layout.utils', () => {
  const canvasSize = { width: 280, height: 280 };

  it('should offset SVG transform by cell index', () => {
    const first = resolveRadicalComponentSvgTransform(0, 2, canvasSize);
    const second = resolveRadicalComponentSvgTransform(1, 2, canvasSize);

    expect(first).toContain('translate(0 0)');
    expect(second).toContain('translate(140 0)');
    expect(first).not.toEqual(second);
  });

  it('should place fallback text at cell centers', () => {
    const first = resolveRadicalComponentCellCenter(0, 2, canvasSize);
    const second = resolveRadicalComponentCellCenter(1, 2, canvasSize);

    expect(first).toEqual({ x: 70, y: 140 });
    expect(second).toEqual({ x: 210, y: 140 });
  });
});
