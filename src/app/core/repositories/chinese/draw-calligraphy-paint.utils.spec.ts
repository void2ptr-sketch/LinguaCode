import { describe, expect, it, vi } from 'vitest';

import {
  type CalligraphyPaintOptions,
  type CanvasPoint,
  paintCalligraphyPolyline,
} from './draw-calligraphy-paint.utils';

type MockCall = {
  method: string;
  args: unknown[];
}

type MockCanvasContext = {
  ctx: CanvasRenderingContext2D;
  calls: MockCall[];
}

describe('draw-calligraphy-paint', () => {
  function createMockContext(): MockCanvasContext {
    const calls: MockCall[] = [];
    const ctx: Partial<CanvasRenderingContext2D> = {
      save: vi.fn(() => { calls.push({ method: 'save', args: [] }); }),
      restore: vi.fn(() => { calls.push({ method: 'restore', args: [] }); }),
      beginPath: vi.fn(() => { calls.push({ method: 'beginPath', args: [] }); }),
      arc: vi.fn(
        (x: number, y: number, r: number, s: number, e: number) => {
          calls.push({ method: 'arc', args: [x, y, r, s, e] });
        },
      ),
      fill: vi.fn(() => { calls.push({ method: 'fill', args: [] }); }),
      moveTo: vi.fn((x: number, y: number) => {
        calls.push({ method: 'moveTo', args: [x, y] });
      }),
      lineTo: vi.fn((x: number, y: number) => {
        calls.push({ method: 'lineTo', args: [x, y] });
      }),
      stroke: vi.fn(() => { calls.push({ method: 'stroke', args: [] }); }),
      lineCap: 'round' as CanvasLineCap,
      lineJoin: 'round' as CanvasLineJoin,
      lineWidth: 0,
      globalAlpha: 1,
      strokeStyle: '',
      fillStyle: '',
    };
    return { ctx: ctx as CanvasRenderingContext2D, calls };
  }

  function makeOptions(overrides?: Partial<CalligraphyPaintOptions>): CalligraphyPaintOptions {
    return { baseWidth: 10, color: '#000000', ...overrides };
  }

  describe('paintCalligraphyPolyline', () => {
    it('should return early without drawing for empty points array', () => {
      const { ctx } = createMockContext();
      paintCalligraphyPolyline(ctx, [], makeOptions());
      expect(ctx.save).not.toHaveBeenCalled();
      expect(ctx.beginPath).not.toHaveBeenCalled();
    });

    it('should draw a single dot for one-point array', () => {
      const { ctx } = createMockContext();
      const point: CanvasPoint = { x: 50, y: 50 };
      paintCalligraphyPolyline(ctx, [point], makeOptions());
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalledWith(50, 50, 4.5, 0, Math.PI * 2);
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('should use default alpha and taper when not provided', () => {
      const { ctx, calls } = createMockContext();
      const points: CanvasPoint[] = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
      paintCalligraphyPolyline(ctx, points, makeOptions());
      expect(ctx.globalAlpha).toBe(1);
      expect(calls.some((c) => c.method === 'stroke')).toBe(true);
    });

    it('should apply custom alpha value', () => {
      const { ctx } = createMockContext();
      const points: CanvasPoint[] = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
      paintCalligraphyPolyline(ctx, points, makeOptions({ alpha: 0.5 }));
      expect(ctx.globalAlpha).toBe(0.5);
    });

    it('should apply stroke color to strokeStyle and fillStyle', () => {
      const { ctx } = createMockContext();
      const points: CanvasPoint[] = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
      paintCalligraphyPolyline(ctx, points, makeOptions({ color: '#ff0000' }));
      expect(ctx.strokeStyle).toBe('#ff0000');
      expect(ctx.fillStyle).toBe('#ff0000');
    });

    it('should set lineCap and lineJoin to round', () => {
      const { ctx } = createMockContext();
      const points: CanvasPoint[] = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
      paintCalligraphyPolyline(ctx, points, makeOptions());
      expect(ctx.lineCap).toBe('round');
      expect(ctx.lineJoin).toBe('round');
    });

    it('should stroke multiple segments for a multi-point polyline', () => {
      const { ctx, calls } = createMockContext();
      const points: CanvasPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ];
      paintCalligraphyPolyline(ctx, points, makeOptions());
      const strokeCalls = calls.filter((c) => c.method === 'stroke');
      expect(strokeCalls.length).toBe(2);
    });

    it('should restore context after drawing', () => {
      const { ctx } = createMockContext();
      const points: CanvasPoint[] = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
      paintCalligraphyPolyline(ctx, points, makeOptions());
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('should handle zero-length segments gracefully', () => {
      const { ctx } = createMockContext();
      const points: CanvasPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ];
      paintCalligraphyPolyline(ctx, points, makeOptions());
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('should not stroke when total length is zero', () => {
      const { ctx, calls } = createMockContext();
      const points: CanvasPoint[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
      paintCalligraphyPolyline(ctx, points, makeOptions());
      const strokeCalls = calls.filter((c) => c.method === 'stroke');
      expect(strokeCalls.length).toBe(0);
    });

    it('should respect taper option when set to false', () => {
      const { ctx, calls } = createMockContext();
      const points: CanvasPoint[] = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];
      paintCalligraphyPolyline(ctx, points, makeOptions({ taper: false }));
      const lineWidthCalls = calls.filter((c) => c.method === 'beginPath');
      expect(lineWidthCalls.length).toBeGreaterThan(0);
    });

    it('should set lineWidth for each segment', () => {
      const { ctx, calls } = createMockContext();
      const points: CanvasPoint[] = [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 100 },
      ];
      paintCalligraphyPolyline(ctx, points, makeOptions({ baseWidth: 20 }));
      const lineWidthValues = calls
        .filter((c) => c.method === 'beginPath')
        .map(() => ctx.lineWidth);
      lineWidthValues.forEach((w) => {
        expect(typeof w).toBe('number');
        expect(w).toBeGreaterThan(0);
      });
    });
  });
});
