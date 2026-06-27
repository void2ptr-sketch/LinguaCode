import {
  mapViewBoxPoint,
  resolveGhostFontSize,
  resolveGhostGuideTransform,
  resolveSvgGuideGroupTransform,
} from './draw-ghost-layout.utils';

describe('draw-ghost-layout.utils', () => {
  it('should map viewBox center to canvas center for ghost em box', () => {
    const width = 280;
    const height = 280;
    const fontSize = resolveGhostFontSize(width);
    const transform = resolveGhostGuideTransform(width, height, fontSize);
    const center = mapViewBoxPoint({ x: 50, y: 50 }, transform);

    expect(center.x).toBeCloseTo(width / 2, 0);
    expect(center.y).toBeCloseTo(height / 2, 0);
  });

  it('should fit viewBox corners into ghost em square', () => {
    const width = 280;
    const height = 280;
    const fontSize = resolveGhostFontSize(width);
    const transform = resolveGhostGuideTransform(width, height, fontSize);
    const topLeft = mapViewBoxPoint({ x: 0, y: 0 }, transform);
    const bottomRight = mapViewBoxPoint({ x: 100, y: 100 }, transform);

    expect(topLeft.x).toBeCloseTo((width - fontSize) / 2, 0);
    expect(topLeft.y).toBeCloseTo((height - fontSize) / 2, 0);
    expect(bottomRight.x).toBeCloseTo((width + fontSize) / 2, 0);
    expect(bottomRight.y).toBeCloseTo((height + fontSize) / 2, 0);
  });

  it('should align svg viewBox origin with canvas guide offset', () => {
    const width = 280;
    const height = 280;
    const fontSize = resolveGhostFontSize(width);
    const guideTransform = resolveGhostGuideTransform(width, height, fontSize);
    const svgTransform = resolveSvgGuideGroupTransform(width, height, guideTransform);
    const expectedTx = (guideTransform.offsetX * 100) / width;
    const expectedTy = (guideTransform.offsetY * 100) / height;
    const expectedSx = fontSize / width;

    expect(svgTransform).toBe(`translate(${expectedTx} ${expectedTy}) scale(${expectedSx} ${expectedSx})`);
  });
});
