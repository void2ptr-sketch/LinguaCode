import type { HanziPoint } from './hanzi-character.types';

/** Calculates the arithmetic mean of the given numeric values. Returns `0` for empty arrays. */
export function hanziAverage(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Euclidean distance between two points. */
export function hanziDistance(left: HanziPoint, right: HanziPoint): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

/** Vector subtraction: `left - right`. */
export function hanziSubtract(left: HanziPoint, right: HanziPoint): HanziPoint {
  return {
    x: left.x - right.x,
    y: left.y - right.y,
  };
}

/** Total polyline length: sum of distances between consecutive points. Returns `0` for fewer than 2 points. */
export function hanziLength(points: readonly HanziPoint[]): number {
  if (points.length < 2) {
    return 0;
  }

  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += hanziDistance(points[index - 1], points[index]);
  }

  return total;
}

/** Checks whether two points have identical `x` and `y` coordinates. */
export function hanziPointsEqual(left: HanziPoint, right: HanziPoint): boolean {
  return left.x === right.x && left.y === right.y;
}

/** Cosine similarity between two vectors (as angles from the origin). Returns `0` when either vector has zero length. */
export function hanziCosineSimilarity(left: HanziPoint, right: HanziPoint): number {
  const leftLength = Math.hypot(left.x, left.y);
  const rightLength = Math.hypot(right.x, right.y);
  if (leftLength === 0 || rightLength === 0) {
    return 0;
  }

  return (left.x * right.x + left.y * right.y) / (leftLength * rightLength);
}

/** Rotates a point around the origin by the given angle `theta` (in radians). */
export function hanziRotate(point: HanziPoint, theta: number): HanziPoint {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

export function hanziNormalizeCurve(points: readonly HanziPoint[]): HanziPoint[] {
  if (points.length === 0) {
    return [];
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);
  const scale = 1 / Math.max(width, height);

  return points.map((point) => ({
    x: (point.x - minX) * scale,
    y: (point.y - minY) * scale,
  }));
}

/** Discrete Fréchet distance between two polylines. */
export function hanziFrechetDistance(
  left: readonly HanziPoint[],
  right: readonly HanziPoint[],
): number {
  if (left.length === 0 || right.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const matrix = Array.from({ length: left.length }, () =>
    Array.from({ length: right.length }, () => Number.POSITIVE_INFINITY),
  );

  matrix[0]![0] = hanziDistance(left[0]!, right[0]!);

  for (let index = 1; index < left.length; index += 1) {
    matrix[index]![0] = Math.max(matrix[index - 1]![0]!, hanziDistance(left[index]!, right[0]!));
  }

  for (let index = 1; index < right.length; index += 1) {
    matrix[0]![index] = Math.max(matrix[0]![index - 1]!, hanziDistance(left[0]!, right[index]!));
  }

  for (let leftIndex = 1; leftIndex < left.length; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex < right.length; rightIndex += 1) {
      const cost = hanziDistance(left[leftIndex]!, right[rightIndex]!);
      matrix[leftIndex]![rightIndex] = Math.max(
        cost,
        Math.min(
          matrix[leftIndex - 1]![rightIndex]!,
          matrix[leftIndex]![rightIndex - 1]!,
          matrix[leftIndex - 1]![rightIndex - 1]!,
        ),
      );
    }
  }

  return matrix[left.length - 1]![right.length - 1]!;
}

export function hanziStripDuplicatePoints(points: readonly HanziPoint[]): HanziPoint[] {
  if (points.length < 2) {
    return [...points];
  }

  const deduped: HanziPoint[] = [points[0]!];
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]!;
    const last = deduped.at(-1)!;
    if (!hanziPointsEqual(point, last)) {
      deduped.push(point);
    }
  }

  return deduped;
}

export function hanziEdgeVectors(points: readonly HanziPoint[]): HanziPoint[] {
  const vectors: HanziPoint[] = [];
  let lastPoint = points[0];
  for (const point of points.slice(1)) {
    vectors.push(hanziSubtract(point, lastPoint!));
    lastPoint = point;
  }

  return vectors;
}
