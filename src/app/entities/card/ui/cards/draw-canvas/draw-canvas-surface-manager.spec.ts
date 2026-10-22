import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { DrawCanvasSurfaceManager } from './draw-canvas-surface-manager';

describe('DrawCanvasSurfaceManager', () => {
  let manager: DrawCanvasSurfaceManager;
  let onResize: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DrawCanvasSurfaceManager] });
    manager = TestBed.inject(DrawCanvasSurfaceManager);
    onResize = vi.fn();
  });

  describe('initialize', () => {
    it('should set canvas element from ElementRef', () => {
      const canvasEl = { nativeElement: {} as HTMLCanvasElement };
      manager.initialize(canvasEl as ElementRef<HTMLCanvasElement>, onResize as () => void);
      expect(onResize).not.toHaveBeenCalled();
    });

    it('should handle undefined canvasRef gracefully', () => {
      manager.initialize(undefined, onResize as () => void);
      expect(onResize).not.toHaveBeenCalled();
    });
  });

  describe('getContext', () => {
    it('should return null when no canvas element', () => {
      const ctx = manager.getContext();
      expect(ctx).toBeNull();
    });

    it('should initialize context after setting canvas', () => {
      const mockCtx = {
        lineCap: '',
        lineJoin: '',
        lineWidth: 0,
        strokeStyle: '',
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;
      const canvasEl = { getContext: vi.fn(() => mockCtx) } as unknown as HTMLCanvasElement;
      manager.initialize({ nativeElement: canvasEl } as ElementRef, onResize as () => void);
      const ctx = manager.getContext();
      expect(ctx).not.toBeNull();
    });
  });

  describe('eventPoint', () => {
    it('should return {x: 0, y: 0} when no canvas', () => {
      const point = manager.eventPoint(new PointerEvent('pointermove'));
      expect(point).toEqual({ x: 0, y: 0 });
    });

    it('should transform pointer coordinates to canvas pixels', () => {
      const mockCtx = {
        lineCap: '',
        lineJoin: '',
        lineWidth: 0,
        strokeStyle: '',
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;
      const canvasEl = {
        getBoundingClientRect: vi.fn(() => ({ left: 10, top: 20 })),
        width: 560,
        height: 560,
        clientWidth: 280,
        clientHeight: 280,
        clientLeft: 0,
        clientTop: 0,
        getContext: vi.fn(() => mockCtx),
      } as unknown as HTMLCanvasElement;
      manager.initialize({ nativeElement: canvasEl } as ElementRef, onResize as () => void);

      const event = new PointerEvent('pointermove', { clientX: 15, clientY: 25 });
      const point = manager.eventPoint(event);
      // x = (15 - 10 - 0) * (560/280) = 5 * 2 = 10
      // y = (25 - 20 - 0) * (560/280) = 5 * 2 = 10
      expect(point.x).toBe(10);
      expect(point.y).toBe(10);
    });
  });

  describe('resizeCanvas', () => {
    it('should return early when no canvas', () => {
      manager.resizeCanvas(onResize as () => void);
      expect(onResize).not.toHaveBeenCalled();
    });

    it('should use DEFAULT_SURFACE_SIZE when client dimensions are 0', () => {
      const mockCtx = {
        lineCap: '',
        lineJoin: '',
        lineWidth: 0,
        strokeStyle: '',
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;
      const canvasEl = {
        clientWidth: 0,
        clientHeight: 0,
        width: 0,
        height: 0,
        clientLeft: 0,
        clientTop: 0,
        getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0 })),
        getContext: vi.fn(() => mockCtx),
      } as unknown as HTMLCanvasElement;
      manager.initialize({ nativeElement: canvasEl } as ElementRef, onResize as () => void);

      manager.resizeCanvas(onResize as () => void);

      expect(manager.surfaceWidth()).toBe(280);
      expect(manager.surfaceHeight()).toBe(280);
    });

    it('should resize and update signals with real dimensions', () => {
      const mockCtx = {
        lineCap: '',
        lineJoin: '',
        lineWidth: 0,
        strokeStyle: '',
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;
      const canvasEl = {
        clientWidth: 300,
        clientHeight: 400,
        width: 300,
        height: 400,
        clientLeft: 0,
        clientTop: 0,
        getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0 })),
        getContext: vi.fn(() => mockCtx),
      } as unknown as HTMLCanvasElement;
      manager.initialize({ nativeElement: canvasEl } as ElementRef, onResize as () => void);

      manager.resizeCanvas(onResize as () => void);

      expect(manager.surfaceWidth()).toBe(300);
      expect(manager.surfaceHeight()).toBe(400);
      expect(onResize).toHaveBeenCalled();
    });
  });

  describe('getCanvasSize', () => {
    it('should return default size initially', () => {
      const size = manager.getCanvasSize();
      expect(size.width).toBe(280);
      expect(size.height).toBe(280);
    });
  });
});
