import type { HanziPoint } from './hanzi-character.types';

export type HanziTracingAnimationOptions = {
  strokeDurationMs?: number;
  delayBetweenStrokesMs?: number;
  loopPauseMs?: number;
  sampleSpacing?: number;
};

export type HanziTracingTip = {
  point: HanziPoint;
  angleRad: number;
};

export type HanziTracingFrame = {
  completedStrokeCount: number;
  activeStrokeIndex: number;
  activeProgress: number;
  isLoopPause: boolean;
  tip: HanziTracingTip | null;
};

export type HanziTracingStrokeSample = {
  original: readonly HanziPoint[];
  densified: readonly HanziPoint[];
};

export const DEFAULT_HANZI_TRACING_OPTIONS: Required<HanziTracingAnimationOptions> = {
  strokeDurationMs: 1000,
  delayBetweenStrokesMs: 450,
  loopPauseMs: 800,
  sampleSpacing: 8,
};

export function prepareHanziTracingSamples(
  medians: readonly (readonly HanziPoint[])[],
  sampleSpacing = DEFAULT_HANZI_TRACING_OPTIONS.sampleSpacing,
): readonly HanziTracingStrokeSample[] {
  return medians.map((original) => ({
    original,
    densified: densifyHanziPolyline(original, sampleSpacing),
  }));
}

export function resolveHanziTracingFrame(
  elapsedMs: number,
  samples: readonly HanziTracingStrokeSample[],
  options: HanziTracingAnimationOptions = {},
): HanziTracingFrame {
  const strokeCount = samples.length;
  if (strokeCount === 0) {
    return emptyHanziTracingFrame();
  }

  const strokeDurationMs =
    options.strokeDurationMs ?? DEFAULT_HANZI_TRACING_OPTIONS.strokeDurationMs;
  const delayBetweenStrokesMs =
    options.delayBetweenStrokesMs ?? DEFAULT_HANZI_TRACING_OPTIONS.delayBetweenStrokesMs;
  const loopPauseMs = options.loopPauseMs ?? DEFAULT_HANZI_TRACING_OPTIONS.loopPauseMs;

  const activeDuration =
    strokeCount * strokeDurationMs + Math.max(0, strokeCount - 1) * delayBetweenStrokesMs;
  const cycleDuration = activeDuration + loopPauseMs;
  const loopTime = elapsedMs % cycleDuration;

  if (loopTime >= activeDuration) {
    const lastSample = samples[strokeCount - 1]?.densified ?? [];
    return {
      completedStrokeCount: strokeCount,
      activeStrokeIndex: strokeCount - 1,
      activeProgress: 1,
      isLoopPause: true,
      tip: resolveHanziPolylineTip(lastSample, 1),
    };
  }

  for (let index = 0; index < strokeCount; index += 1) {
    const windowStart = strokeWindowStart(index, strokeDurationMs, delayBetweenStrokesMs);
    const windowEnd = windowStart + strokeDurationMs;

    if (loopTime >= windowStart && loopTime < windowEnd) {
      const progress = (loopTime - windowStart) / strokeDurationMs;
      const densified = samples[index]?.densified ?? [];
      return {
        completedStrokeCount: index,
        activeStrokeIndex: index,
        activeProgress: progress,
        isLoopPause: false,
        tip: resolveHanziPolylineTip(densified, progress),
      };
    }

    const nextStart = strokeWindowStart(index + 1, strokeDurationMs, delayBetweenStrokesMs);
    if (loopTime >= windowEnd && loopTime < nextStart) {
      const nextSample = samples[index + 1]?.densified ?? samples[index]?.densified ?? [];
      return {
        completedStrokeCount: index + 1,
        activeStrokeIndex: index + 1,
        activeProgress: 0,
        isLoopPause: false,
        tip: resolveHanziPolylineTip(nextSample, 0),
      };
    }
  }

  return emptyHanziTracingFrame();
}

export function sliceHanziPolylineByProgress(
  points: readonly HanziPoint[],
  progress: number,
): readonly HanziPoint[] {
  if (points.length === 0 || progress <= 0) {
    return [];
  }

  if (progress >= 1) {
    return points;
  }

  const totalLength = polylineLength(points);
  if (totalLength <= 0) {
    return points.length > 0 ? [points[0]!] : [];
  }

  const targetLength = totalLength * progress;
  const slice: HanziPoint[] = [points[0]!];
  let walked = 0;

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]!;
    const end = points[index]!;
    const segmentLength = distance(start, end);

    if (walked + segmentLength >= targetLength) {
      const remaining = targetLength - walked;
      const t = segmentLength > 0 ? remaining / segmentLength : 0;
      slice.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
      });
      return slice;
    }

    walked += segmentLength;
    slice.push(end);
  }

  return slice;
}

export function resolveHanziPolylineTip(
  points: readonly HanziPoint[],
  progress: number,
): HanziTracingTip | null {
  if (points.length === 0) {
    return null;
  }

  if (points.length === 1) {
    return { point: points[0]!, angleRad: 0 };
  }

  const epsilon = 0.02;
  const fromProgress = Math.max(0, progress - epsilon);
  const slice = sliceHanziPolylineByProgress(points, progress);
  const tail = slice.at(-1);
  if (!tail) {
    return null;
  }

  const lookback = sliceHanziPolylineByProgress(points, fromProgress).at(-1) ?? points[0]!;
  const dx = tail.x - lookback.x;
  const dy = tail.y - lookback.y;
  const angleRad = Math.abs(dx) + Math.abs(dy) > 0.001 ? Math.atan2(dy, dx) : 0;

  return { point: tail, angleRad };
}

export function tracingRevealProgress(frame: HanziTracingFrame, strokeIndex: number): number {
  if (strokeIndex < frame.completedStrokeCount) {
    return 1;
  }

  if (strokeIndex === frame.activeStrokeIndex) {
    return frame.activeProgress;
  }

  return 0;
}

function strokeWindowStart(
  strokeIndex: number,
  strokeDurationMs: number,
  delayBetweenStrokesMs: number,
): number {
  return strokeIndex * strokeDurationMs + strokeIndex * delayBetweenStrokesMs;
}

function emptyHanziTracingFrame(): HanziTracingFrame {
  return {
    completedStrokeCount: 0,
    activeStrokeIndex: 0,
    activeProgress: 0,
    isLoopPause: false,
    tip: null,
  };
}

function densifyHanziPolyline(points: readonly HanziPoint[], spacing: number): HanziPoint[] {
  if (points.length === 0) {
    return [];
  }

  if (points.length === 1) {
    return [{ ...points[0]! }];
  }

  const samples: HanziPoint[] = [{ ...points[0]! }];
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]!;
    const end = points[index]!;
    const segmentLength = distance(start, end);
    const steps = Math.max(1, Math.ceil(segmentLength / spacing));
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      samples.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
      });
    }
  }

  return samples;
}

function polylineLength(points: readonly HanziPoint[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distance(points[index - 1]!, points[index]!);
  }

  return total;
}

function distance(left: HanziPoint, right: HanziPoint): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}
