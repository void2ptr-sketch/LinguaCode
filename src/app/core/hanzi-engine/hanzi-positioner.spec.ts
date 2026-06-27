import { HanziPositioner } from './hanzi-positioner';

describe('HanziPositioner', () => {
  it('should round-trip character space coordinates', () => {
    const positioner = new HanziPositioner({ width: 280, height: 280, padding: 20 });
    const original = { x: 475, y: 485 };
    const canvas = positioner.toCanvas(original);
    const restored = positioner.toCharacterSpace(canvas);

    expect(restored.x).toBeCloseTo(original.x, 3);
    expect(restored.y).toBeCloseTo(original.y, 3);
  });

  it('should scale MMH width into padded canvas width', () => {
    const width = 280;
    const positioner = new HanziPositioner({ width, height: 280, padding: 20 });
    const left = positioner.toCanvas({ x: 0, y: 0 });
    const right = positioner.toCanvas({ x: 1024, y: 0 });

    expect(right.x - left.x).toBeCloseTo(width - 40, 0);
  });
});
