import type { HanziPoint } from '../models/hanzi-character.types';

/**
 * Configuration options for the tracing animation.
 */
export type HanziTracingAnimationOptions = {
  /** Duration (ms) to animate each stroke. Defaults to `1000`. */
  strokeDurationMs?: number;
  /** Pause (ms) between consecutive strokes. Defaults to `450`. */
  delayBetweenStrokesMs?: number;
  /** Pause (ms) after all strokes complete before looping. Defaults to `800`. */
  loopPauseMs?: number;
  /** Spacing (in px) for densifying polylines. Defaults to `8`. */
  sampleSpacing?: number;
};

/**
 * Position and angle of the tracing tip at a given point along a stroke.
 */
export type HanziTracingTip = {
  /** Current tip position. */
  point: HanziPoint;
  /** Tip angle in radians (direction of travel). */
  angleRad: number;
};

/**
 * A single frame of the stroke tracing animation.
 */
export type HanziTracingFrame = {
  /** Number of strokes already completed. */
  completedStrokeCount: number;
  /** Index of the currently active (being drawn) stroke. */
  activeStrokeIndex: number;
  /** Progress (`0`–`1`) within the active stroke. */
  activeProgress: number;
  /** Whether the animation is currently in the loop-pause phase. */
  isLoopPause: boolean;
  /** Current tip position and angle, or `null` when no tip is available. */
  tip: HanziTracingTip | null;
};

/**
 * A preprocessed sample of a single stroke, containing both the original and a densified version.
 */
export type HanziTracingStrokeSample = {
  /** The original median points from the MMH data. */
  original: readonly HanziPoint[];
  /** Densified points at a fixed spacing for smooth animation. */
  densified: readonly HanziPoint[];
};

/**
 * Default options for tracing animations.
 */
export const DEFAULT_HANZI_TRACING_OPTIONS: Required<HanziTracingAnimationOptions> = {
  strokeDurationMs: 1000,
  delayBetweenStrokesMs: 450,
  loopPauseMs: 800,
  sampleSpacing: 8,
};

/**
 * Preprocesses median arrays into densified samples ready for animation.
 *
 * @param medians - The stroke median point arrays from MMH data.
 * @param sampleSpacing - Spacing in pixels for densifying polylines. Defaults to `8`.
 * @returns An array of stroke samples with original and densified point arrays.
 */
export function prepareHanziTracingSamples(
  medians: readonly (readonly HanziPoint[])[],
  sampleSpacing = DEFAULT_HANZI_TRACING_OPTIONS.sampleSpacing,
): readonly HanziTracingStrokeSample[] {
  return medians.map((original) => ({
    original,
    densified: densifyHanziPolyline(original, sampleSpacing),
  }));
}

/**
 * Resolves the current animation frame based on elapsed time and stroke samples.
 *
 * @param elapsedMs - Elapsed time in milliseconds since animation start.
 * @param samples - Preprocessed stroke samples.
 * @param options - Animation options (stroke duration, delays, etc.).
 * @returns The current tracing frame with tip position and progress.
 */
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

/**
 * Slices a polyline to the given progress fraction (`0`–`1`), interpolating at the cut point.
 *
 * @param points - The polyline points.
 * @param progress - The progress fraction between `0` and `1`.
 * @returns A new array of points representing the sliced polyline.
 */
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

/**
 * Resolves the tracing tip (position and angle) at a given progress along a polyline.
 *
 * @param points - The polyline points.
 * @param progress - The progress fraction between `0` and `1`.
 * @returns The tip position and angle, or `null` for empty polylines.
 */
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

/**
 * Returns the reveal progress (`0`–`1`) for a specific stroke based on the current animation frame.
 *
 * @param frame - The current tracing animation frame.
 * @param strokeIndex - The index of the stroke to query.
 * @returns `1` if completed, `activeProgress` if active, `0` if not yet reached.
 */
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
