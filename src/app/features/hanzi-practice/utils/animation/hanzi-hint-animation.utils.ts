import type { HanziPoint } from '../../models';
import {
  resolveHanziPolylineTip,
  type HanziTracingStrokeSample,
  type HanziTracingTip,
} from './hanzi-tracing-animation.utils';

/**
 * Configuration options for the hint stroke brush animation.
 */
export type HanziHintStrokeAnimationOptions = {
  /** Duration (ms) to pause at the stroke start before drawing. Defaults to `700`. */
  brushPlacementMs?: number;
  /** Duration (ms) to animate the stroke drawing. Defaults to `1000`. */
  strokeDurationMs?: number;
  /** Pause (ms) after the stroke completes before restarting. Defaults to `450`. */
  loopPauseMs?: number;
};

/**
 * Phase of the hint stroke animation cycle.
 */
export type HanziHintStrokePhase = 'brush-placement' | 'direction';

/**
 * A single frame of the hint stroke animation.
 */
export type HanziHintStrokeFrame = {
  /** Current animation phase. */
  phase: HanziHintStrokePhase;
  /** Progress within the `direction` phase (`0`–`1`). Zero during `brush-placement`. */
  progress: number;
  /** Whether the start-circle indicator should be visible. */
  showStartCircle: boolean;
  /** Current tip position and angle, or `null` when no tip is available. */
  tip: HanziTracingTip | null;
};

/**
 * Default options for hint stroke animations.
 */
export const DEFAULT_HANZI_HINT_STROKE_OPTIONS: Required<HanziHintStrokeAnimationOptions> = {
  brushPlacementMs: 700,
  strokeDurationMs: 1000,
  loopPauseMs: 450,
};

/**
 * Computes the animation frame for a single hint stroke based on elapsed time.
 *
 * @param elapsedMs - Elapsed time in milliseconds since animation start.
 * @param sample - The preprocessed stroke sample.
 * @param options - Animation options (durations, delays).
 * @returns The current hint stroke frame with phase, progress, and tip position.
 */
export function resolveHanziHintStrokeFrame(
  elapsedMs: number,
  sample: HanziTracingStrokeSample,
  options: HanziHintStrokeAnimationOptions = {},
): HanziHintStrokeFrame {
  const brushPlacementMs =
    options.brushPlacementMs ?? DEFAULT_HANZI_HINT_STROKE_OPTIONS.brushPlacementMs;
  const strokeDurationMs =
    options.strokeDurationMs ?? DEFAULT_HANZI_HINT_STROKE_OPTIONS.strokeDurationMs;
  const loopPauseMs = options.loopPauseMs ?? DEFAULT_HANZI_HINT_STROKE_OPTIONS.loopPauseMs;

  const densified = sample.densified;
  const startPoint = densified[0] ?? null;
  const startTip = startPoint ? resolveStartTip(densified, startPoint) : null;

  if (densified.length === 0) {
    return emptyHanziHintStrokeFrame();
  }

  const cycleDuration = brushPlacementMs + strokeDurationMs + loopPauseMs;
  const loopTime = elapsedMs % cycleDuration;

  if (loopTime < brushPlacementMs || loopTime >= brushPlacementMs + strokeDurationMs) {
    return {
      phase: 'brush-placement',
      progress: 0,
      showStartCircle: true,
      tip: startTip,
    };
  }

  const progress = (loopTime - brushPlacementMs) / strokeDurationMs;

  return {
    phase: 'direction',
    progress,
    showStartCircle: false,
    tip: resolveHanziPolylineTip(densified, progress),
  };
}

function resolveStartTip(
  densified: readonly HanziPoint[],
  startPoint: HanziPoint,
): HanziTracingTip {
  if (densified.length < 2) {
    return { point: startPoint, angleRad: 0 };
  }

  const next = densified[1]!;
  return {
    point: startPoint,
    angleRad: Math.atan2(next.y - startPoint.y, next.x - startPoint.x),
  };
}

function emptyHanziHintStrokeFrame(): HanziHintStrokeFrame {
  return {
    phase: 'brush-placement',
    progress: 0,
    showStartCircle: false,
    tip: null,
  };
}
