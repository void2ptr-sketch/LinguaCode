import type { DrawStrokeGuide } from '../models/draw-practice.types';
import type { LearningProficiencyLevel } from '../models/learning-proficiency.types';
import type { DrawCanvasPoint } from '../../shared/components/draw-canvas/draw-canvas.types';

export type DrawStrokeValidationThresholds = {
  /** Допустимое отклонение числа черт от эталона. */
  strokeCountTolerance: number;
  /** Среднее отклонение от эталонных путей (viewBox 0–100). */
  maxMeanDeviation: number;
};

export type DrawStrokeValidationInput = {
  strokes: readonly (readonly DrawCanvasPoint[])[];
  guides: readonly DrawStrokeGuide[];
  canvasSize: { width: number; height: number };
  thresholds: DrawStrokeValidationThresholds;
};

export type DrawStrokeValidationResult = {
  passed: boolean;
  expectedStrokeCount: number;
  actualStrokeCount: number;
  meanDeviation: number | null;
};

const THRESHOLDS_BY_LEVEL: Record<LearningProficiencyLevel, DrawStrokeValidationThresholds> = {
  'new-to-language': { strokeCountTolerance: 2, maxMeanDeviation: 20 },
  beginner: { strokeCountTolerance: 1, maxMeanDeviation: 15 },
  elementary: { strokeCountTolerance: 1, maxMeanDeviation: 12 },
  intermediate: { strokeCountTolerance: 0, maxMeanDeviation: 10 },
  'upper-intermediate': { strokeCountTolerance: 0, maxMeanDeviation: 8 },
  advanced: { strokeCountTolerance: 0, maxMeanDeviation: 6 },
  professional: { strokeCountTolerance: 0, maxMeanDeviation: 4 },
};

export function resolveDrawStrokeValidationThresholds(
  level: LearningProficiencyLevel,
): DrawStrokeValidationThresholds {
  return THRESHOLDS_BY_LEVEL[level];
}

export function validateDrawStrokesAgainstGuides(
  input: DrawStrokeValidationInput,
): DrawStrokeValidationResult {
  const expectedStrokeCount = input.guides.length;
  const actualStrokeCount = input.strokes.length;
  const strokeCountDelta = Math.abs(actualStrokeCount - expectedStrokeCount);

  if (strokeCountDelta > input.thresholds.strokeCountTolerance) {
    return {
      passed: false,
      expectedStrokeCount,
      actualStrokeCount,
      meanDeviation: null,
    };
  }

  const pairedCount = Math.min(input.strokes.length, input.guides.length);
  if (pairedCount === 0) {
    return {
      passed: actualStrokeCount > 0,
      expectedStrokeCount,
      actualStrokeCount,
      meanDeviation: null,
    };
  }

  let deviationSum = 0;
  for (let index = 0; index < pairedCount; index += 1) {
    const guidePolyline = densifyGuidePath(input.guides[index].path);
    const userPolyline = densifyStrokePath(input.strokes[index], input.canvasSize);
    deviationSum += meanDistanceToPolyline(userPolyline, guidePolyline);
  }

  const meanDeviation = deviationSum / pairedCount;
  return {
    passed: meanDeviation <= input.thresholds.maxMeanDeviation,
    expectedStrokeCount,
    actualStrokeCount,
    meanDeviation,
  };
}

function normalizePoint(
  point: DrawCanvasPoint,
  canvasSize: { width: number; height: number },
): DrawCanvasPoint {
  const width = Math.max(canvasSize.width, 1);
  const height = Math.max(canvasSize.height, 1);
  return {
    x: (point.x / width) * 100,
    y: (point.y / height) * 100,
  };
}

function densifyStrokePath(
  stroke: readonly DrawCanvasPoint[],
  canvasSize: { width: number; height: number },
  spacing = 2,
): DrawCanvasPoint[] {
  if (stroke.length === 0) {
    return [];
  }

  if (stroke.length === 1) {
    return [normalizePoint(stroke[0], canvasSize)];
  }

  const normalized = stroke.map((point) => normalizePoint(point, canvasSize));
  return densifyPolyline(normalized, spacing);
}

function densifyGuidePath(path: string, spacing = 2): DrawCanvasPoint[] {
  return densifyPolyline(parseGuidePath(path), spacing);
}

function parseGuidePath(path: string): DrawCanvasPoint[] {
  const tokens = path.trim().split(/\s+/);
  const points: DrawCanvasPoint[] = [];
  let index = 0;

  while (index < tokens.length) {
    const command = tokens[index];
    if (command === 'M' || command === 'L') {
      const x = Number(tokens[index + 1]);
      const y = Number(tokens[index + 2]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        points.push({ x, y });
      }
      index += 3;
      continue;
    }

    if (command === 'Q') {
      const x = Number(tokens[index + 3]);
      const y = Number(tokens[index + 4]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        points.push({ x, y });
      }
      index += 5;
      continue;
    }

    index += 1;
  }

  return points;
}

function densifyPolyline(points: readonly DrawCanvasPoint[], spacing: number): DrawCanvasPoint[] {
  if (points.length === 0) {
    return [];
  }

  if (points.length === 1) {
    return [{ ...points[0] }];
  }

  const samples: DrawCanvasPoint[] = [{ ...points[0] }];
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const distance = pointDistance(start, end);
    const steps = Math.max(1, Math.ceil(distance / spacing));
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

function meanDistanceToPolyline(
  samples: readonly DrawCanvasPoint[],
  polyline: readonly DrawCanvasPoint[],
): number {
  if (samples.length === 0 || polyline.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  let total = 0;
  for (const sample of samples) {
    total += minDistanceToPolyline(sample, polyline);
  }

  return total / samples.length;
}

function minDistanceToPolyline(point: DrawCanvasPoint, polyline: readonly DrawCanvasPoint[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (let index = 1; index < polyline.length; index += 1) {
    const distance = distancePointToSegment(point, polyline[index - 1], polyline[index]);
    if (distance < min) {
      min = distance;
    }
  }

  return min;
}

function distancePointToSegment(
  point: DrawCanvasPoint,
  start: DrawCanvasPoint,
  end: DrawCanvasPoint,
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return pointDistance(point, start);
  }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };
  return pointDistance(point, projection);
}

function pointDistance(left: DrawCanvasPoint, right: DrawCanvasPoint): number {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  return Math.hypot(dx, dy);
}
