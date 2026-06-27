export type ViewBoxPoint = {
  x: number;
  y: number;
};

const DEFAULT_GUIDE_SAMPLE_SPACING = 0.35;

/** Равномерная выборка точек вдоль SVG-пути (viewBox 0–100). */
export function sampleGuidePath(path: string, spacing = DEFAULT_GUIDE_SAMPLE_SPACING): ViewBoxPoint[] {
  const tokens = path.trim().split(/\s+/);
  const samples: ViewBoxPoint[] = [];
  let current: ViewBoxPoint | null = null;
  let index = 0;

  while (index < tokens.length) {
    const command = tokens[index];
    if (command === 'M' || command === 'L') {
      const x = Number(tokens[index + 1]);
      const y = Number(tokens[index + 2]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        index += 3;
        continue;
      }

      const next = { x, y };
      if (command === 'L' && current) {
        samples.push(...densifySegment(current, next, spacing).slice(1));
      } else if (samples.length === 0) {
        samples.push(next);
      }
      current = next;
      index += 3;
      continue;
    }

    if (command === 'Q' && current) {
      const cx = Number(tokens[index + 1]);
      const cy = Number(tokens[index + 2]);
      const x = Number(tokens[index + 3]);
      const y = Number(tokens[index + 4]);
      if (Number.isFinite(cx) && Number.isFinite(cy) && Number.isFinite(x) && Number.isFinite(y)) {
        samples.push(
          ...sampleQuadraticBezier(current, { x: cx, y: cy }, { x, y }, spacing).slice(1),
        );
        current = { x, y };
      }
      index += 5;
      continue;
    }

    index += 1;
  }

  return samples;
}

export type StrokeAnimationFrame = {
  completedStrokeCount: number;
  activeStrokeIndex: number;
  activeProgress: number;
  tip: ViewBoxPoint | null;
};

const DEFAULT_STROKE_DURATION_MS = 900;
const DEFAULT_LOOP_PAUSE_MS = 600;

export function resolveStrokeAnimationFrame(
  elapsedMs: number,
  strokeCount: number,
  samples: readonly (readonly ViewBoxPoint[])[],
  options?: { strokeDurationMs?: number; loopPauseMs?: number },
): StrokeAnimationFrame {
  if (strokeCount <= 0 || samples.length === 0) {
    return {
      completedStrokeCount: 0,
      activeStrokeIndex: 0,
      activeProgress: 0,
      tip: null,
    };
  }

  const strokeDurationMs = options?.strokeDurationMs ?? DEFAULT_STROKE_DURATION_MS;
  const loopPauseMs = options?.loopPauseMs ?? DEFAULT_LOOP_PAUSE_MS;
  const activeDuration = strokeCount * strokeDurationMs;
  const cycleDuration = activeDuration + loopPauseMs;
  const loopTime = elapsedMs % cycleDuration;

  if (loopTime >= activeDuration) {
    const lastStroke = samples[strokeCount - 1] ?? [];
    return {
      completedStrokeCount: strokeCount,
      activeStrokeIndex: strokeCount - 1,
      activeProgress: 1,
      tip: lastStroke.at(-1) ?? null,
    };
  }

  const activeStrokeIndex = Math.min(Math.floor(loopTime / strokeDurationMs), strokeCount - 1);
  const strokeElapsed = loopTime - activeStrokeIndex * strokeDurationMs;
  const activeProgress = Math.min(1, strokeElapsed / strokeDurationMs);
  const activeSamples = samples[activeStrokeIndex] ?? [];
  const tipIndex = Math.max(
    0,
    Math.min(activeSamples.length - 1, Math.floor(activeProgress * Math.max(activeSamples.length - 1, 0))),
  );

  return {
    completedStrokeCount: activeStrokeIndex,
    activeStrokeIndex,
    activeProgress,
    tip: activeSamples[tipIndex] ?? null,
  };
}

export function slicePolylineAtProgress(
  points: readonly ViewBoxPoint[],
  progress: number,
): readonly ViewBoxPoint[] {
  if (points.length === 0) {
    return [];
  }

  if (progress >= 1) {
    return points;
  }

  if (points.length === 1) {
    return progress > 0 ? [points[0]] : [];
  }

  const targetIndex = progress * (points.length - 1);
  const lowerIndex = Math.floor(targetIndex);
  const upperIndex = Math.min(points.length - 1, lowerIndex + 1);
  const fraction = targetIndex - lowerIndex;
  const slice = points.slice(0, lowerIndex + 1);

  if (fraction > 0 && upperIndex > lowerIndex) {
    const start = points[lowerIndex];
    const end = points[upperIndex];
    slice.push({
      x: start.x + (end.x - start.x) * fraction,
      y: start.y + (end.y - start.y) * fraction,
    });
  }

  return slice;
}

function sampleQuadraticBezier(
  start: ViewBoxPoint,
  control: ViewBoxPoint,
  end: ViewBoxPoint,
  spacing: number,
): ViewBoxPoint[] {
  const approximateLength =
    distance(start, control) + distance(control, end);
  const steps = Math.max(2, Math.ceil(approximateLength / spacing));
  const samples: ViewBoxPoint[] = [];

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const inverse = 1 - t;
    samples.push({
      x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
      y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
    });
  }

  return samples;
}

function densifySegment(start: ViewBoxPoint, end: ViewBoxPoint, spacing: number): ViewBoxPoint[] {
  const distanceValue = distance(start, end);
  const steps = Math.max(1, Math.ceil(distanceValue / spacing));
  const samples: ViewBoxPoint[] = [];

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    samples.push({
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    });
  }

  return samples;
}

function distance(left: ViewBoxPoint, right: ViewBoxPoint): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}
