import { Injectable, signal, computed } from '@angular/core';
import {
  resolveHanziHintStrokeFrame,
  resolveHanziTracingFrame,
  type HanziHintStrokeFrame,
  type HanziTracingFrame,
  type HanziTracingStrokeSample,
} from '../../../../chinese/lib/animation';

/**
 * Animation mode for the draw canvas.
 */
export type DrawCanvasAnimationMode = 'tracing' | 'hints' | 'none';

/**
 * Animation token to prevent race conditions between animation loops.
 */
type AnimationLoopState = {
  token: number;
  active: boolean;
  frameId: number;
  startTimestamp: number;
};

/**
 * Service managing tracing and hint animation state for the draw canvas.
 *
 * @remarks
 * Handles animation frames, sample data, and frame computation.
 * Rendering is delegated to the component via the exposed signals.
 *
 * This service replaces the duplicated animation logic that was previously
 * embedded in DrawCanvasComponent. The component now delegates all animation
 * management to this service.
 */
@Injectable({ providedIn: 'root' })
export class DrawCanvasAnimationService {
  private _destroyed = false;

  /** Marks the service as destroyed to prevent post-destroy emissions. */
  markDestroyed(): void {
    this._destroyed = true;
    this.stopTracingAnimation(false);
    this.stopHintAnimation(false);
  }

  /** Returns whether the service has been marked as destroyed. */
  get destroyed(): boolean {
    return this._destroyed;
  }

  // --- Tracing animation state ---
  readonly tracingFrame = signal<HanziTracingFrame>({ ...EMPTY_TRACING_FRAME });
  private tracingSamples: readonly HanziTracingStrokeSample[] = [];
  private tracingLoopState: AnimationLoopState = {
    token: 0,
    active: false,
    frameId: 0,
    startTimestamp: 0,
  };

  // --- Hint animation state ---
  readonly hintFrame = signal<HanziHintStrokeFrame>({ ...EMPTY_HINT_FRAME });
  private hintSamples: readonly HanziTracingStrokeSample[] = [];
  private hintLoopState: AnimationLoopState = {
    token: 0,
    active: false,
    frameId: 0,
    startTimestamp: 0,
  };
  private hintDrawingPaused = false;

  // --- Computed ---
  readonly tracingAnimationActive = computed(() => this.tracingLoopState.active);
  readonly hintAnimationActive = computed(() => this.hintLoopState.active);

  // --- Duration ---
  private readonly tracingStrokeDurationMsSignal = signal(1500);
  readonly tracingStrokeDurationMs = computed(() => this.tracingStrokeDurationMsSignal());

  // --- Sync signature ---
  private guidanceSyncSignature = '';

  /**
   * Sets tracing animation samples and duration.
   */
  setTracingSamples(samples: readonly HanziTracingStrokeSample[], durationMs: number): void {
    this.tracingSamples = samples;
    this.tracingStrokeDurationMsSignal.set(durationMs);
  }

  /**
   * Sets hint animation samples.
   */
  setHintSamples(samples: readonly HanziTracingStrokeSample[]): void {
    this.hintSamples = samples;
  }

  /**
   * Starts the tracing animation loop.
   */
  startTracingAnimation(): void {
    this.stopTracingAnimation(false);
    this.tracingLoopState = {
      token: this.tracingLoopState.token + 1,
      active: true,
      frameId: 0,
      startTimestamp: performance.now(),
    };
    this.runTracingAnimation(this.tracingLoopState.token);
  }

  /**
   * Stops the tracing animation loop.
   */
  stopTracingAnimation(redraw = true): void {
    this.tracingLoopState.active = false;
    if (this.tracingLoopState.frameId) {
      cancelAnimationFrame(this.tracingLoopState.frameId);
      this.tracingLoopState.frameId = 0;
    }
    if (redraw) {
      this.tracingFrame.set({ ...EMPTY_TRACING_FRAME });
    }
  }

  /**
   * Starts the hint animation loop.
   */
  startHintAnimation(): void {
    this.stopHintAnimation(false);
    this.hintLoopState = {
      token: this.hintLoopState.token + 1,
      active: true,
      frameId: 0,
      startTimestamp: performance.now(),
    };
    this.runHintAnimation(this.hintLoopState.token);
  }

  /**
   * Stops the hint animation loop.
   */
  stopHintAnimation(redraw = true): void {
    this.hintLoopState.active = false;
    if (this.hintLoopState.frameId) {
      cancelAnimationFrame(this.hintLoopState.frameId);
      this.hintLoopState.frameId = 0;
    }
    if (redraw) {
      this.hintFrame.set({ ...EMPTY_HINT_FRAME });
    }
  }

  /**
   * Pauses hint drawing (used during hint animation when user starts drawing).
   */
  pauseHintDrawing(): void {
    this.hintDrawingPaused = true;
  }

  /**
   * Resumes hint drawing.
   */
  resumeHintDrawing(): void {
    this.hintDrawingPaused = false;
  }

  /**
   * Checks if hint drawing is currently paused.
   */
  isHintDrawingPaused(): boolean {
    return this.hintDrawingPaused;
  }

  /**
   * Syncs the guidance animation (tracing or hints) based on current mode.
   *
   * @param mode - The current canvas animation mode.
   * @param hanziLoadState - Whether hanzi data is loaded ('ready' to start).
   * @param hanziCharacter - The character being drawn (for cache busting).
   * @param strokeCount - Number of strokes already drawn (for hints mode).
   * @param redraw - Whether to redraw after stopping animations.
   * @returns true if animation was started, false otherwise.
   */
  syncGuidanceAnimation(
    mode: DrawCanvasAnimationMode,
    hanziLoadState: string,
    hanziCharacter: string,
    strokeCount: number,
    redraw: () => void,
  ): boolean {
    const signature = `${mode}|${hanziLoadState}|${hanziCharacter}|${this.tracingStrokeDurationMs()}`;

    if (mode === 'none') {
      if (this.guidanceSyncSignature !== '') {
        this.guidanceSyncSignature = '';
        this.stopTracingAnimation(false);
        this.stopHintAnimation(false);
        redraw();
      }
      return false;
    }

    if (hanziLoadState !== 'ready') {
      this.guidanceSyncSignature = '';
      this.stopTracingAnimation(false);
      this.stopHintAnimation(false);
      redraw();
      return false;
    }

    if (signature === this.guidanceSyncSignature) {
      const animationRunning =
        mode === 'tracing' ? this.tracingLoopState.active : this.hintLoopState.active;
      if (animationRunning) {
        return false;
      }
    }

    this.guidanceSyncSignature = signature;
    this.stopTracingAnimation(false);
    this.stopHintAnimation(false);

    const samples = mode === 'tracing' ? this.tracingSamples : this.hintSamples;
    if (!samples || samples.length === 0) {
      redraw();
      return false;
    }

    if (mode === 'tracing') {
      this.tracingFrame.set(
        resolveHanziTracingFrame(0, samples, {
          strokeDurationMs: this.tracingStrokeDurationMs(),
        }),
      );
      this.startTracingAnimation();
      redraw();
      return true;
    }

    // hints mode
    if (strokeCount >= samples.length) {
      redraw();
      return false;
    }

    this.hintDrawingPaused = false;
    this.hintFrame.set(
      resolveHanziHintStrokeFrame(0, samples[strokeCount]!, {
        strokeDurationMs: this.tracingStrokeDurationMs(),
      }),
    );
    this.startHintAnimation();
    redraw();
    return true;
  }

  /**
   * Restarts hint animation if it should be active.
   * Called after stroke changes (undo, clear, new stroke).
   */
  restartHintAnimationIfActive(redraw: () => void): void {
    this.guidanceSyncSignature = '';
    this.hintDrawingPaused = false;
    this.syncGuidanceAnimation('hints', 'ready', '', 0, redraw);
  }

  // --- Private animation runners ---

  private runTracingAnimation(token: number): void {
    if (this._destroyed || !this.tracingLoopState.active || this.tracingSamples.length === 0)
      return;

    const elapsed = performance.now() - this.tracingLoopState.startTimestamp;
    const frame = resolveHanziTracingFrame(elapsed, this.tracingSamples, {
      strokeDurationMs: this.tracingStrokeDurationMs(),
    });
    this.tracingFrame.set(frame);

    if (token === this.tracingLoopState.token && !this._destroyed) {
      this.tracingLoopState.frameId = requestAnimationFrame(() => this.runTracingAnimation(token));
    }
  }

  private runHintAnimation(token: number): void {
    if (this._destroyed || !this.hintLoopState.active || this.hintSamples.length === 0) return;
    if (this.hintDrawingPaused && token === this.hintLoopState.token) {
      // Keep running but don't update frame while user is drawing
      this.hintLoopState.frameId = requestAnimationFrame(() => this.runHintAnimation(token));
      return;
    }

    const elapsed = performance.now() - this.hintLoopState.startTimestamp;
    // Animate the first hint sample; the consumer selects which stroke to hint.
    const sample = this.hintSamples[0];
    if (!sample) return;

    const frame = resolveHanziHintStrokeFrame(elapsed, sample, {
      strokeDurationMs: this.tracingStrokeDurationMs(),
    });
    this.hintFrame.set(frame);

    if (token === this.hintLoopState.token && !this._destroyed) {
      this.hintLoopState.frameId = requestAnimationFrame(() => this.runHintAnimation(token));
    }
  }
}

const EMPTY_TRACING_FRAME: HanziTracingFrame = {
  completedStrokeCount: 0,
  activeStrokeIndex: 0,
  activeProgress: 0,
  isLoopPause: false,
  tip: null,
};

const EMPTY_HINT_FRAME: HanziHintStrokeFrame = {
  phase: 'brush-placement',
  progress: 0,
  showStartCircle: false,
  tip: null,
};
