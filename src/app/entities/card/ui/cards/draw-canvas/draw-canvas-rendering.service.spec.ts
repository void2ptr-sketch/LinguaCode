import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { DrawCanvasRenderingService } from './draw-canvas-rendering.service';
import type { DrawCanvasMode, DrawStrokePath } from '../../../../phonetic/model';
import type { HanziCharacterModel, HanziLoadState } from '../../../../chinese/model';
import type { DrawRadicalHint } from './draw-canvas.component';
import type { HanziHintStrokeFrame, HanziTracingFrame } from '../../../../chinese/lib/animation';
import type { HanziPositioner } from '../../../../chinese/lib/positioning';

describe('DrawCanvasRenderingService', () => {
  let service: DrawCanvasRenderingService;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;
  let mockDestroyRef: DestroyRef;

  const createMockCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    return canvas;
  };

  const createMockCtx = (): CanvasRenderingContext2D => {
    const ctx = {
      lineCap: '' as CanvasLineCap,
      lineJoin: '' as CanvasLineJoin,
      lineWidth: 0,
      strokeStyle: '',
      fillStyle: '',
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      font: '',
      textAlign: '' as CanvasTextAlign,
      textBaseline: '' as CanvasTextBaseline,
      globalAlpha: 0,
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    return ctx;
  };

  beforeEach(() => {
    mockDestroyRef = {
      onDestroy: () => {
        // No-op for tests
        return () => {
          // cleanup
        };
      },
      get destroyed() {
        return false;
      },
    };
    mockCanvas = createMockCanvas();
    mockCtx = createMockCtx();

    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas);
    vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockCtx);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    service = TestBed.inject(DrawCanvasRenderingService);
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should initialize with default surface size', () => {
      service = TestBed.inject(DrawCanvasRenderingService);
      expect(service.surfaceWidth()).toBe(280);
      expect(service.surfaceHeight()).toBe(280);
    });

    it('should set up canvas context on first getContext call', () => {
      service = TestBed.inject(DrawCanvasRenderingService);
      service.initialize(mockCanvas, mockDestroyRef);

      const ctx = service.getContext();
      expect(ctx).toBeDefined();
      expect(mockCtx.lineCap).toBe('round');
      expect(mockCtx.lineJoin).toBe('round');
      expect(mockCtx.lineWidth).toBe(4);
    });

    it('should return same context on subsequent calls', () => {
      service = TestBed.inject(DrawCanvasRenderingService);
      service.initialize(mockCanvas, mockDestroyRef);

      const ctx1 = service.getContext();
      const ctx2 = service.getContext();
      expect(ctx1).toBe(ctx2);
    });
  });

  describe('resize', () => {
    it('should update surface dimensions', () => {
      service = TestBed.inject(DrawCanvasRenderingService);
      service.initialize(mockCanvas, mockDestroyRef);

      // Manually trigger resize with new dimensions
      Object.defineProperty(mockCanvas, 'clientWidth', {
        value: 400,
        writable: false,
        configurable: true,
      });
      Object.defineProperty(mockCanvas, 'clientHeight', {
        value: 300,
        writable: false,
        configurable: true,
      });
      service.resize();

      expect(service.surfaceWidth()).toBe(400);
      expect(service.surfaceHeight()).toBe(300);
    });

    it('should call redraw callback after resize', () => {
      service = TestBed.inject(DrawCanvasRenderingService);
      service.initialize(mockCanvas, mockDestroyRef);

      let callbackCalled = false;
      service.setRedrawCallback(() => {
        callbackCalled = true;
      });

      Object.defineProperty(mockCanvas, 'clientWidth', {
        value: 350,
        writable: false,
        configurable: true,
      });
      Object.defineProperty(mockCanvas, 'clientHeight', {
        value: 350,
        writable: false,
        configurable: true,
      });

      service.resize();

      expect(callbackCalled).toBe(true);
    });
  });

  describe('pointerPoint', () => {
    it('should return zero point when canvas not initialized', () => {
      service = TestBed.inject(DrawCanvasRenderingService);

      const event = {
        clientX: 100,
        clientY: 100,
      } as PointerEvent;

      const point = service.pointerPoint(event);
      expect(point).toEqual({ x: 0, y: 0 });
    });

    it('should convert pointer event to canvas coordinates', () => {
      service = TestBed.inject(DrawCanvasRenderingService);
      service.initialize(mockCanvas, mockDestroyRef);

      const rect = { left: 10, top: 10, width: 280, height: 280 } as DOMRect;
      vi.spyOn(mockCanvas, 'getBoundingClientRect').mockReturnValue(rect);

      const event = {
        clientX: 50,
        clientY: 60,
      } as PointerEvent;

      const point = service.pointerPoint(event);

      expect(point.x).toBeGreaterThan(0);
      expect(point.y).toBeGreaterThan(0);
    });
  });

  describe('getCanvasSize', () => {
    it('should return current surface dimensions', () => {
      service = TestBed.inject(DrawCanvasRenderingService);
      service.initialize(mockCanvas, mockDestroyRef);

      const size = service.getCanvasSize();
      expect(size.width).toBe(280);
      expect(size.height).toBe(280);
    });
  });

  describe('redraw', () => {
    it('should clear canvas and paint all layers', () => {
      service = TestBed.inject(DrawCanvasRenderingService);
      service.initialize(mockCanvas, mockDestroyRef);

      const mockStrokes: readonly DrawStrokePath[] = [];
      const mockRadicalHints: readonly DrawRadicalHint[] = [];
      const mockRadicalModels: ReadonlyMap<string, HanziCharacterModel> = new Map();

      service.redraw({
        strokes: mockStrokes,
        activeStroke: [],
        memoryGrade: null,
        reviewActive: false,
        tracingFrame: {} as HanziTracingFrame,
        tracingActive: false,
        tracingSamples: [],
        hintFrame: {} as HanziHintStrokeFrame,
        hintActive: false,
        hintDrawingPaused: false,
        hintSamples: [],
        radicalHints: mockRadicalHints,
        radicalModels: mockRadicalModels,
        radicalLoadState: 'idle' as HanziLoadState,
        canvasMode: 'memory' as DrawCanvasMode,
        positioner: {} as HanziPositioner,
        resolveThemeColor: (v: string, f: string) => f,
      });

      expect(mockCtx.clearRect).toHaveBeenCalled();
    });

    it('should not redraw when context is null', () => {
      service = TestBed.inject(DrawCanvasRenderingService);

      service.redraw({
        strokes: [],
        activeStroke: [],
        memoryGrade: null,
        reviewActive: false,
        tracingFrame: {} as HanziTracingFrame,
        tracingActive: false,
        tracingSamples: [],
        hintFrame: {} as HanziHintStrokeFrame,
        hintActive: false,
        hintDrawingPaused: false,
        hintSamples: [],
        radicalHints: [],
        radicalModels: new Map(),
        radicalLoadState: 'idle' as HanziLoadState,
        canvasMode: 'memory' as DrawCanvasMode,
        positioner: {} as HanziPositioner,
        resolveThemeColor: (v: string, f: string) => f,
      });

      expect(mockCtx.clearRect).not.toHaveBeenCalled();
    });
  });
});
