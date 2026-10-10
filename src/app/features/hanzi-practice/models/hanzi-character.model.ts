import type { HanziCharacterJson, HanziPoint } from './hanzi-character.types';
import { parseHanziMedianPoints } from '../utils/positioning/hanzi-positioner';
import {
  hanziAverage,
  hanziCosineSimilarity,
  hanziDistance,
  hanziEdgeVectors,
  hanziLength,
} from '../utils/rendering/hanzi-geometry.utils';

/**
 * A single stroke model for a Hanzi character.
 *
 * @remarks
 * Contains the SVG path, sample points, and radical flag for a single stroke.
 */
export type HanziStrokeModel = {
  /** Zero-based stroke index. */
  strokeNum: number;
  /** SVG path string for the stroke. */
  path: string;
  /** Sample points along the stroke path. */
  points: readonly HanziPoint[];
  /** Whether this stroke is a radical stroke. */
  isRadical: boolean;
};

/**
 * A fully parsed Hanzi character model with stroke data.
 *
 * @remarks
 * Built from raw JSON by `buildHanziCharacterModel`. Used for draw-card answer evaluation.
 */
export type HanziCharacterModel = {
  /** The Chinese character string. */
  character: string;
  /** Ordered array of stroke models. */
  strokes: readonly HanziStrokeModel[];
};

/**
 * Builds a `HanziCharacterModel` from raw JSON data.
 *
 * @param character - The Chinese character string.
 * @param json - Raw Hanzi character JSON from assets.
 * @returns The parsed character model with stroke data.
 */
export function buildHanziCharacterModel(
  character: string,
  json: HanziCharacterJson,
): HanziCharacterModel {
  const medianPoints = parseHanziMedianPoints(json.medians);
  const radicalSet = new Set(json.radStrokes ?? []);

  const strokes = json.strokes.map((path, strokeNum) => ({
    strokeNum,
    path,
    points: medianPoints[strokeNum] ?? [],
    isRadical: radicalSet.has(strokeNum),
  }));

  return {
    character,
    strokes,
  };
}

/**
 * Returns the starting point of a stroke.
 *
 * @param stroke - The stroke model.
 * @returns The first point, or `{x: 0, y: 0}` if empty.
 */
export function hanziStrokeStartingPoint(stroke: HanziStrokeModel): HanziPoint {
  return stroke.points[0] ?? { x: 0, y: 0 };
}

/**
 * Returns the ending point of a stroke.
 *
 * @param stroke - The stroke model.
 * @returns The last point, or `{x: 0, y: 0}` if empty.
 */
export function hanziStrokeEndingPoint(stroke: HanziStrokeModel): HanziPoint {
  return stroke.points.at(-1) ?? { x: 0, y: 0 };
}

/**
 * Computes edge vectors (direction vectors between consecutive points) for a stroke.
 *
 * @param stroke - The stroke model.
 * @returns Array of direction vectors.
 */
export function hanziStrokeVectors(stroke: HanziStrokeModel): HanziPoint[] {
  return hanziEdgeVectors(stroke.points);
}

/**
 * Returns the total length of a stroke's path.
 *
 * @param stroke - The stroke model.
 * @returns The cumulative distance between consecutive points.
 */
export function hanziStrokeLength(stroke: HanziStrokeModel): number {
  return hanziLength(stroke.points);
}

/**
 * Computes the average distance from user-drawn points to the target stroke.
 *
 * @param stroke - The target stroke model.
 * @param points - User-drawn points to evaluate.
 * @returns The average distance; returns `Infinity` for empty inputs.
 */
export function hanziStrokeAverageDistance(
  stroke: HanziStrokeModel,
  points: readonly HanziPoint[],
): number {
  if (points.length === 0 || stroke.points.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  let total = 0;
  for (const point of points) {
    total += hanziMinDistanceToPolyline(point, stroke.points);
  }

  return total / points.length;
}

function hanziMinDistanceToPolyline(point: HanziPoint, polyline: readonly HanziPoint[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (let index = 1; index < polyline.length; index += 1) {
    const distance = hanziDistancePointToSegment(point, polyline[index - 1]!, polyline[index]!);
    if (distance < min) {
      min = distance;
    }
  }

  return min;
}

function hanziDistancePointToSegment(
  point: HanziPoint,
  start: HanziPoint,
  end: HanziPoint,
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return hanziDistance(point, start);
  }

  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared),
  );

  return hanziDistance(point, {
    x: start.x + t * dx,
    y: start.y + t * dy,
  });
}

/**
 * Computes direction similarity between user-drawn points and a target stroke.
 *
 * @remarks
 * Uses cosine similarity of edge vectors. Returns 0 for empty inputs.
 * Used for draw-card answer evaluation.
 *
 * @param userPoints - Points drawn by the user.
 * @param stroke - The target stroke model.
 * @returns Similarity score in the range [0, 1].
 */
export function hanziStrokeDirectionSimilarity(
  userPoints: readonly HanziPoint[],
  stroke: HanziStrokeModel,
): number {
  const userVectors = hanziEdgeVectors(userPoints);
  const strokeVectors = hanziStrokeVectors(stroke);
  if (userVectors.length === 0 || strokeVectors.length === 0) {
    return 0;
  }

  const similarities = userVectors.map((edgeVector) => {
    const strokeSimilarities = strokeVectors.map((strokeVector) =>
      hanziCosineSimilarity(edgeVector, strokeVector),
    );
    return Math.max(...strokeSimilarities);
  });

  return hanziAverage(similarities);
}
