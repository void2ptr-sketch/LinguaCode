import { HanziPositioner, mapPointsToCanvas, parseHanziMedianPoints } from './hanzi-positioner';

describe('HanziPositioner', () => {
  it('should round-trip character space coordinates', () => {
    const positioner = new HanziPositioner({ width: 280, height: 280, padding: 20 });
    const original = { x: 475, y: 485 };
    const canvas = positioner.toCanvas(original);
    const restored = positioner.toCharacterSpace(canvas);

    expect(restored.x).toBeCloseTo(original.x, 3);
    expect(restored.y).toBeCloseTo(original.y, 3);
  });

  it('should fit MMH bounding box inside padded canvas', () => {
    const height = 280;
    const positioner = new HanziPositioner({ width: height, height, padding: 20 });
    const top = positioner.toCanvas({ x: 512, y: 900 });
    const bottom = positioner.toCanvas({ x: 512, y: -124 });

    expect(top.y).toBeCloseTo(20, 0);
    expect(bottom.y).toBeCloseTo(260, 0);
  });

  it('should scale MMH width into padded canvas width', () => {
    const width = 280;
    const positioner = new HanziPositioner({ width, height: 280, padding: 20 });
    const left = positioner.toCanvas({ x: 0, y: 0 });
    const right = positioner.toCanvas({ x: 1024, y: 0 });

    expect(right.x - left.x).toBeCloseTo(width - 40, 0);
  });

  it('should return canvas transform object', () => {
    const positioner = new HanziPositioner({ width: 280, height: 280, padding: 20 });
    const transform = positioner.toCanvasTransform();

    expect(transform).toEqual({
      offsetX: positioner.xOffset,
      offsetY: positioner.yOffset,
      scale: positioner.scale,
    });
  });

  it('should generate svg group transform string', () => {
    const positioner = new HanziPositioner({ width: 280, height: 280, padding: 20 });
    const svgTransform = positioner.toSvgGroupTransform(280, 280);

    expect(svgTransform).toMatch(/^translate\(/);
    expect(svgTransform).toContain('scale(');
  });

  it('should use default padding when not specified', () => {
    const positioner = new HanziPositioner({ width: 280, height: 280 });
    expect(positioner.padding).toBe(20);
  });

  it('should use custom padding when specified', () => {
    const positioner = new HanziPositioner({ width: 280, height: 280, padding: 40 });
    expect(positioner.padding).toBe(40);
  });
});

describe('parseHanziMedianPoints', () => {
  it('should parse object-style points', () => {
    const medians = [
      [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
      [{ x: 50, y: 60 }],
    ];

    const result = parseHanziMedianPoints(medians as never);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);
    expect(result[1]).toEqual([{ x: 50, y: 60 }]);
  });

  it('should parse tuple-style points', () => {
    const medians = [[[10, 20] as [number, number], [30, 40] as [number, number]]];

    const result = parseHanziMedianPoints(medians as never);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);
  });

  it('should handle empty medians', () => {
    const result = parseHanziMedianPoints([]);
    expect(result).toEqual([]);
  });
});

describe('mapPointsToCanvas', () => {
  it('should transform all points using the positioner', () => {
    const positioner = new HanziPositioner({ width: 280, height: 280, padding: 20 });
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];

    const result = mapPointsToCanvas(points, positioner);

    expect(result).toHaveLength(2);
    expect(result[0].x).toBeCloseTo(positioner.xOffset, 3);
    expect(result[1].x).toBeCloseTo(100 * positioner.scale + positioner.xOffset, 3);
  });
});
