import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { DrawCanvasAnimationService } from './draw-canvas-animation.service';
import type { HanziTracingStrokeSample } from '../../../../chinese/lib/animation';

const makeSample = (): HanziTracingStrokeSample => ({
  original: [{ x: 0, y: 0 }],
  densified: [{ x: 0, y: 0 }],
});

describe('DrawCanvasAnimationService', () => {
  let service: DrawCanvasAnimationService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('performance', {
      now: vi.fn(() => 0),
    } as never);
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(
      (cb: FrameRequestCallback) => setTimeout(cb, 0) as unknown as number,
    );
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id: number) => {
      clearTimeout(id);
    });

    TestBed.configureTestingModule({
      providers: [DrawCanvasAnimationService],
    });
    service = TestBed.inject(DrawCanvasAnimationService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ── Initial state ──

  it('should start with empty tracing frame', () => {
    const frame = service.tracingFrame();
    expect(frame.completedStrokeCount).toBe(0);
    expect(frame.activeStrokeIndex).toBe(0);
    expect(frame.activeProgress).toBe(0);
    expect(frame.isLoopPause).toBe(false);
    expect(frame.tip).toBeNull();
  });

  it('should start with empty hint frame', () => {
    const frame = service.hintFrame();
    expect(frame.phase).toBe('brush-placement');
    expect(frame.progress).toBe(0);
    expect(frame.showStartCircle).toBe(false);
    expect(frame.tip).toBeNull();
  });

  it('should start with animations inactive', () => {
    expect(service.tracingAnimationActive()).toBe(false);
    expect(service.hintAnimationActive()).toBe(false);
  });

  it('should start with default tracing duration', () => {
    expect(service.tracingStrokeDurationMs()).toBe(1500);
  });

  // ── setTracingSamples ──

  it('should set tracing samples and duration', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setTracingSamples(samples, 2000);

    expect(service.tracingStrokeDurationMs()).toBe(2000);
  });

  // ── setHintSamples ──

  it('should set hint samples', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setHintSamples(samples);

    // Samples are stored internally — verify via syncGuidanceAnimation
    const callback = vi.fn();
    service.syncGuidanceAnimation('hints', 'ready', '中', 0, callback);
    expect(callback).toHaveBeenCalled();
  });

  // ── Tracing animation ──

  it('should start tracing animation and update frame', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setTracingSamples(samples, 1000);

    service.startTracingAnimation();

    expect(service.tracingAnimationActive()).toBe(true);
    expect(service.hintAnimationActive()).toBe(false);
  });

  it('should stop tracing animation', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setTracingSamples(samples, 1000);

    service.startTracingAnimation();
    service.stopTracingAnimation();

    expect(service.tracingAnimationActive()).toBe(false);
  });

  it('should clear tracing frame when stopped with redraw', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setTracingSamples(samples, 1000);

    service.startTracingAnimation();
    service.stopTracingAnimation(true);

    const frame = service.tracingFrame();
    expect(frame.completedStrokeCount).toBe(0);
  });

  it('should not clear tracing frame when stopped without redraw', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setTracingSamples(samples, 1000);

    service.startTracingAnimation();
    service.stopTracingAnimation(false);

    expect(service.tracingAnimationActive()).toBe(false);
  });

  it('should not restart tracing when already active', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setTracingSamples(samples, 1000);

    service.startTracingAnimation();
    service.startTracingAnimation();

    expect(service.tracingAnimationActive()).toBe(true);
  });

  // ── Hint animation ──

  it('should start hint animation and update frame', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setHintSamples(samples);

    service.startHintAnimation();

    expect(service.hintAnimationActive()).toBe(true);
    expect(service.tracingAnimationActive()).toBe(false);
  });

  it('should stop hint animation', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setHintSamples(samples);

    service.startHintAnimation();
    service.stopHintAnimation();

    expect(service.hintAnimationActive()).toBe(false);
  });

  it('should clear hint frame when stopped with redraw', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setHintSamples(samples);

    service.startHintAnimation();
    service.stopHintAnimation(true);

    const frame = service.hintFrame();
    expect(frame.phase).toBe('brush-placement');
    expect(frame.progress).toBe(0);
  });

  it('should not clear hint frame when stopped without redraw', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setHintSamples(samples);

    service.startHintAnimation();
    service.stopHintAnimation(false);

    expect(service.hintAnimationActive()).toBe(false);
  });

  // ── Pause/Resume hint drawing ──

  it('should pause hint drawing', () => {
    service.pauseHintDrawing();
    expect(service.isHintDrawingPaused()).toBe(true);
  });

  it('should resume hint drawing', () => {
    service.pauseHintDrawing();
    service.resumeHintDrawing();
    expect(service.isHintDrawingPaused()).toBe(false);
  });

  it('should be not paused by default', () => {
    expect(service.isHintDrawingPaused()).toBe(false);
  });

  // ── syncGuidanceAnimation ──

  it('should stop both animations when mode is none', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setTracingSamples(samples, 1000);

    service.startTracingAnimation();
    service.startHintAnimation();

    // First call with mode='none' does nothing (signature is empty)
    service.syncGuidanceAnimation('tracing', 'ready', '中', 0, vi.fn());

    // Now mode='none' should stop animations
    const callback = vi.fn();
    const result = service.syncGuidanceAnimation('none', 'ready', '中', 0, callback);

    expect(result).toBe(false);
    expect(callback).toHaveBeenCalled();
    expect(service.tracingAnimationActive()).toBe(false);
    expect(service.hintAnimationActive()).toBe(false);
  });

  it('should do nothing when mode is none and no active animations', () => {
    const callback = vi.fn();
    const result = service.syncGuidanceAnimation('none', 'ready', '中', 0, callback);

    expect(result).toBe(false);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should stop animations when hanziLoadState is not ready', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setTracingSamples(samples, 1000);

    service.startTracingAnimation();

    const callback = vi.fn();
    const result = service.syncGuidanceAnimation('tracing', 'idle', '中', 0, callback);

    expect(result).toBe(false);
    expect(callback).toHaveBeenCalled();
    expect(service.tracingAnimationActive()).toBe(false);
  });

  it('should start tracing animation when samples exist', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setTracingSamples(samples, 1000);

    const callback = vi.fn();
    const result = service.syncGuidanceAnimation('tracing', 'ready', '中', 0, callback);

    expect(result).toBe(true);
    expect(service.tracingAnimationActive()).toBe(true);
    expect(callback).toHaveBeenCalled();
  });

  it('should not start tracing when samples are empty', () => {
    const callback = vi.fn();
    const result = service.syncGuidanceAnimation('tracing', 'ready', '中', 0, callback);

    expect(result).toBe(false);
    expect(service.tracingAnimationActive()).toBe(false);
    expect(callback).toHaveBeenCalled();
  });

  it('should start hint animation when strokeCount < samples.length', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample(), makeSample()];
    service.setHintSamples(samples);

    const callback = vi.fn();
    const result = service.syncGuidanceAnimation('hints', 'ready', '中', 0, callback);

    expect(result).toBe(true);
    expect(service.hintAnimationActive()).toBe(true);
  });

  it('should not start hint animation when strokeCount >= samples.length', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setHintSamples(samples);

    const callback = vi.fn();
    const result = service.syncGuidanceAnimation('hints', 'ready', '中', 1, callback);

    expect(result).toBe(false);
    expect(service.hintAnimationActive()).toBe(false);
  });

  it('should use tracing samples for tracing mode', () => {
    const tracingSamples: HanziTracingStrokeSample[] = [makeSample()];
    const hintSamples: HanziTracingStrokeSample[] = [makeSample(), makeSample()];
    service.setTracingSamples(tracingSamples, 1000);
    service.setHintSamples(hintSamples);

    service.syncGuidanceAnimation('tracing', 'ready', '中', 0, vi.fn());

    expect(service.tracingAnimationActive()).toBe(true);
    expect(service.hintAnimationActive()).toBe(false);
  });

  it('should use hint samples for hints mode', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setHintSamples(samples);

    service.syncGuidanceAnimation('hints', 'ready', '中', 0, vi.fn());

    expect(service.hintAnimationActive()).toBe(true);
    expect(service.tracingAnimationActive()).toBe(false);
  });

  it('should not restart if signature matches and animation is running', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setTracingSamples(samples, 1000);

    service.syncGuidanceAnimation('tracing', 'ready', '中', 0, vi.fn());

    const secondResult = service.syncGuidanceAnimation('tracing', 'ready', '中', 0, vi.fn());

    expect(secondResult).toBe(false);
  });

  // ── restartHintAnimationIfActive ──

  it('should restart hint animation if active', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setHintSamples(samples);

    const callback = vi.fn();
    service.restartHintAnimationIfActive(callback);

    expect(service.hintAnimationActive()).toBe(true);
    expect(callback).toHaveBeenCalled();
  });

  // ── markDestroyed ──

  it('should stop animations when destroyed', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setTracingSamples(samples, 1000);

    service.startTracingAnimation();
    service.markDestroyed();

    expect(service.tracingAnimationActive()).toBe(false);
    expect(service.hintAnimationActive()).toBe(false);
    expect(service.destroyed).toBe(true);
  });

  it('should return destroyed false by default', () => {
    expect(service.destroyed).toBe(false);
  });

  // ── tracingStrokeDurationMs signal ──

  it('should update tracing stroke duration', () => {
    const samples: HanziTracingStrokeSample[] = [makeSample()];
    service.setTracingSamples(samples, 3000);

    expect(service.tracingStrokeDurationMs()).toBe(3000);
  });
});
