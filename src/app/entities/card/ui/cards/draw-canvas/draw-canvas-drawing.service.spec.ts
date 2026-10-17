import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { DrawCanvasDrawingService } from './draw-canvas-drawing.service';
import type { DrawCanvasPoint, DrawStrokePath } from '../../../../phonetic/model';

describe('DrawCanvasDrawingService', () => {
  let service: DrawCanvasDrawingService;
  let onStrokeStateChange: ReturnType<typeof vi.fn>;
  let onRestartHintAnimation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onStrokeStateChange = vi.fn();
    onRestartHintAnimation = vi.fn();

    TestBed.configureTestingModule({
      providers: [DrawCanvasDrawingService],
    });
    service = TestBed.inject(DrawCanvasDrawingService);
    service.configureCallbacks({
      onStrokeStateChange: onStrokeStateChange as never,
      onRestartHintAnimation: onRestartHintAnimation as never,
    });
  });

  afterEach(() => {
    service.markDestroyed();
    vi.restoreAllMocks();
  });

  // ── Initial state ──

  it('should start with no strokes', () => {
    expect(service.hasStrokes()).toBe(false);
    expect(service.canUndo()).toBe(false);
    expect(service.hasAnyStrokes()).toBe(false);
    expect(service.isDrawing()).toBe(false);
  });

  it('should return empty strokes and active stroke', () => {
    expect(service.getStrokes()).toEqual([]);
    expect(service.getActiveStroke()).toEqual([]);
  });

  // ── Pointer events (drawing a stroke) ──

  it('should start a new stroke on pointer down', () => {
    const point: DrawCanvasPoint = { x: 100, y: 200 };
    service.onPointerDown(point);

    expect(service.isDrawing()).toBe(true);
    expect(service.getActiveStroke()).toEqual([point]);
  });

  it('should extend the active stroke on pointer move', () => {
    const p1: DrawCanvasPoint = { x: 10, y: 10 };
    const p2: DrawCanvasPoint = { x: 20, y: 20 };
    const p3: DrawCanvasPoint = { x: 30, y: 30 };

    service.onPointerDown(p1);
    service.onPointerMove(p2);
    service.onPointerMove(p3);

    expect(service.getActiveStroke()).toEqual([p1, p2, p3]);
  });

  it('should ignore pointer move when not drawing', () => {
    service.onPointerMove({ x: 100, y: 100 });

    expect(service.getActiveStroke()).toEqual([]);
  });

  it('should finalize the stroke on pointer up', () => {
    const p1: DrawCanvasPoint = { x: 10, y: 10 };
    const p2: DrawCanvasPoint = { x: 20, y: 20 };

    service.onPointerDown(p1);
    service.onPointerMove(p2);
    const completed = service.onPointerUp();

    expect(service.isDrawing()).toBe(false);
    expect(completed).toEqual([p1, p2]);
    expect(service.getStrokes()).toEqual([[p1, p2]]);
    expect(service.hasStrokes()).toBe(true);
    expect(service.canUndo()).toBe(true);
  });

  it('should return null on pointer up with no active stroke', () => {
    const result = service.onPointerUp();

    expect(result).toBeNull();
    expect(service.isDrawing()).toBe(false);
  });

  it('should return null on pointer up with empty active stroke', () => {
    service.onPointerDown({ x: 0, y: 0 });
    service.cancelStroke();
    const result = service.onPointerUp();

    expect(result).toBeNull();
  });

  // ── Cancel stroke ──

  it('should cancel the active stroke without saving', () => {
    service.onPointerDown({ x: 10, y: 10 });
    service.onPointerMove({ x: 20, y: 20 });
    service.cancelStroke();

    expect(service.isDrawing()).toBe(false);
    expect(service.getActiveStroke()).toEqual([]);
    expect(service.getStrokes()).toEqual([]);
  });

  // ── Undo ──

  it('should remove the last stroke on undo', () => {
    service.onPointerDown({ x: 10, y: 10 });
    service.onPointerUp();
    service.onPointerDown({ x: 20, y: 20 });
    service.onPointerUp();

    const remaining = service.undo();

    expect(remaining).toHaveLength(1);
    expect(service.getStrokes()).toEqual([[{ x: 10, y: 10 }]]);
    expect(service.canUndo()).toBe(true);
  });

  it('should set canUndo to false after undoing last stroke', () => {
    service.onPointerDown({ x: 10, y: 10 });
    service.onPointerUp();

    service.undo();

    expect(service.canUndo()).toBe(false);
  });

  it('should return empty array when nothing to undo', () => {
    const result = service.undo();

    expect(result).toEqual([]);
  });

  // ── Clear all ──

  it('should clear all strokes', () => {
    service.onPointerDown({ x: 10, y: 10 });
    service.onPointerUp();

    service.clearAll();

    expect(service.hasStrokes()).toBe(false);
    expect(service.canUndo()).toBe(false);
    expect(service.getStrokes()).toEqual([]);
    expect(service.getActiveStroke()).toEqual([]);
  });

  // ── Set strokes ──

  it('should set strokes directly', () => {
    const strokes: DrawStrokePath[] = [
      [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ],
      [{ x: 3, y: 3 }],
    ];

    service.setStrokes(strokes);

    expect(service.getStrokes()).toEqual(strokes);
    expect(service.hasStrokes()).toBe(true);
    expect(service.getActiveStroke()).toEqual([]);
  });

  // ── Reset ──

  it('should reset all drawing state', () => {
    service.onPointerDown({ x: 10, y: 10 });
    service.onPointerUp();

    service.reset();

    // reset() clears internal arrays but doesn't call syncState,
    // so signals may not reflect the reset immediately
    expect(service.isDrawing()).toBe(false);
    expect(service.getStrokes()).toEqual([]);
    expect(service.getActiveStroke()).toEqual([]);
  });

  // ── Callbacks ──

  it('should emit onStrokeStateChange when strokes change', () => {
    service.onPointerDown({ x: 10, y: 10 });
    service.onPointerUp();

    expect(onStrokeStateChange).toHaveBeenCalledWith(true);
  });

  it('should emit onStrokeStateChange false when cleared', () => {
    service.onPointerDown({ x: 10, y: 10 });
    service.onPointerUp();
    service.clearAll();

    expect(onStrokeStateChange).toHaveBeenCalledWith(false);
  });

  it('should call onRestartHintAnimation after pointer up', () => {
    service.onPointerDown({ x: 10, y: 10 });
    service.onPointerUp();

    expect(onRestartHintAnimation).toHaveBeenCalled();
  });

  it('should call onRestartHintAnimation after undo', () => {
    service.onPointerDown({ x: 10, y: 10 });
    service.onPointerUp();
    service.undo();

    expect(onRestartHintAnimation).toHaveBeenCalled();
  });

  it('should call onRestartHintAnimation after clearAll', () => {
    service.onPointerDown({ x: 10, y: 10 });
    service.onPointerUp();
    service.clearAll();

    expect(onRestartHintAnimation).toHaveBeenCalled();
  });

  it('should call onRestartHintAnimation after setStrokes', () => {
    service.setStrokes([[{ x: 1, y: 1 }]]);

    expect(onRestartHintAnimation).toHaveBeenCalled();
  });

  // ── Destroyed state ──

  it('should not emit callbacks after markDestroyed', () => {
    service.markDestroyed();

    service.onPointerDown({ x: 10, y: 10 });
    service.onPointerUp();

    expect(onStrokeStateChange).not.toHaveBeenCalled();
    expect(onRestartHintAnimation).not.toHaveBeenCalled();
  });

  it('should return destroyed true after markDestroyed', () => {
    expect(service.destroyed).toBe(false);
    service.markDestroyed();
    expect(service.destroyed).toBe(true);
  });

  // ── hasAnyStrokes ──

  it('should return true when there are completed strokes', () => {
    service.onPointerDown({ x: 10, y: 10 });
    service.onPointerUp();

    expect(service.hasAnyStrokes()).toBe(true);
  });

  it('should return true when there is an active stroke', () => {
    service.onPointerDown({ x: 10, y: 10 });

    expect(service.hasAnyStrokes()).toBe(true);
  });

  it('should return false when no strokes or active stroke', () => {
    expect(service.hasAnyStrokes()).toBe(false);
  });
});
