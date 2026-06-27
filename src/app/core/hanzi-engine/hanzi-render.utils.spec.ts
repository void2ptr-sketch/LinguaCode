import { HanziPositioner } from './hanzi-positioner';
import { medianToSvgPath, resolveHanziSvgGroupTransform } from './hanzi-render.utils';

describe('hanzi-render.utils', () => {
  it('should build median svg path', () => {
    expect(medianToSvgPath([{ x: 10, y: 20 }, { x: 30, y: 40 }])).toBe('M 10 20 L 30 40');
  });

  it('should build svg group transform from positioner (Hanzi Writer compatible)', () => {
    const positioner = new HanziPositioner({ width: 280, height: 280, padding: 20 });
    expect(resolveHanziSvgGroupTransform(positioner)).toBe(
      `translate(${positioner.xOffset}, ${positioner.height - positioner.yOffset}) scale(${positioner.scale}, ${-positioner.scale})`,
    );
  });
});
