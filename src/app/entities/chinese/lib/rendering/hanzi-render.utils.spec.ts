import { HanziPositioner } from '../positioning/hanzi-positioner';
import {
  applyHanziCanvasPathTransform,
  medianLabelPoint,
  medianToSvgPath,
  resolveHanziSvgGroupTransform,
} from './hanzi-render.utils';

describe('hanzi-render.utils', () => {
  describe('medianToSvgPath', () => {
    it('should build median svg path', () => {
      expect(
        medianToSvgPath([
          { x: 10, y: 20 },
          { x: 30, y: 40 },
        ]),
      ).toBe('M 10 20 L 30 40');
    });

    it('should return empty string for empty points', () => {
      expect(medianToSvgPath([])).toBe('');
    });

    it('should handle single point', () => {
      expect(medianToSvgPath([{ x: 100, y: 200 }])).toBe('M 100 200');
    });

    it('should handle three or more points', () => {
      expect(
        medianToSvgPath([
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 20 },
        ]),
      ).toBe('M 0 0 L 10 10 L 20 20');
    });
  });

  describe('medianLabelPoint', () => {
    it('should return fallback for empty points', () => {
      expect(medianLabelPoint([])).toEqual({ x: 512, y: 388 });
    });

    it('should return the single point for one-point array', () => {
      const point = { x: 100, y: 200 };
      expect(medianLabelPoint([point])).toBe(point);
    });

    it('should return midpoint for even-length array', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
        { x: 30, y: 30 },
      ];
      // midIndex = Math.floor(4 / 2) = 2
      expect(medianLabelPoint(points)).toBe(points[2]);
    });

    it('should return midpoint for odd-length array', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ];
      // midIndex = Math.floor(3 / 2) = 1
      expect(medianLabelPoint(points)).toBe(points[1]);
    });
  });

  describe('resolveHanziSvgGroupTransform', () => {
    it('should build svg group transform from positioner (Hanzi Writer compatible)', () => {
      const positioner = new HanziPositioner({ width: 280, height: 280, padding: 20 });
      expect(resolveHanziSvgGroupTransform(positioner)).toBe(
        `translate(${positioner.xOffset}, ${positioner.height - positioner.yOffset}) scale(${positioner.scale}, ${-positioner.scale})`,
      );
    });
  });

  describe('applyHanziCanvasPathTransform', () => {
    it('should apply correct canvas transform', () => {
      const positioner = new HanziPositioner({ width: 280, height: 280, padding: 20 });
      const ctx = {
        transform: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      applyHanziCanvasPathTransform(ctx, positioner);

      const translateY = positioner.height - positioner.yOffset;
      expect(ctx.transform).toHaveBeenCalledWith(
        positioner.scale,
        0,
        0,
        -positioner.scale,
        positioner.xOffset,
        translateY,
      );
    });
  });
});
