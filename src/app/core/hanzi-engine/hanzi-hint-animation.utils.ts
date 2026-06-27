import type { HanziPoint } from './hanzi-character.types';
import {
  resolveHanziPolylineTip,
  type HanziTracingStrokeSample,
  type HanziTracingTip,
} from './hanzi-tracing-animation.utils';

export type HanziHintStrokeAnimationOptions = {
  brushPlacementMs?: number;
  strokeDurationMs?: number;
  loopPauseMs?: number;
};

export type HanziHintStrokePhase = 'brush-placement' | 'direction';

export type HanziHintStrokeFrame = {
  phase: HanziHintStrokePhase;
  progress: number;
  showStartCircle: boolean;
  tip: HanziTracingTip | null;
};

export const DEFAULT_HANZI_HINT_STROKE_OPTIONS: Required<HanziHintStrokeAnimationOptions> = {
  brushPlacementMs: 700,
  strokeDurationMs: 1000,
  loopPauseMs: 450,
};

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
