import type { HanziCharacterJson, HanziPoint } from './hanzi-character.types';
import { parseHanziMedianPoints } from './hanzi-positioner';
import {
  hanziAverage,
  hanziCosineSimilarity,
  hanziDistance,
  hanziEdgeVectors,
  hanziLength,
} from './hanzi-geometry.utils';

export type HanziStrokeModel = {
  strokeNum: number;
  path: string;
  points: readonly HanziPoint[];
  isRadical: boolean;
};

export type HanziCharacterModel = {
  character: string;
  strokes: readonly HanziStrokeModel[];
};

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

export function hanziStrokeStartingPoint(stroke: HanziStrokeModel): HanziPoint {
  return stroke.points[0] ?? { x: 0, y: 0 };
}

export function hanziStrokeEndingPoint(stroke: HanziStrokeModel): HanziPoint {
  return stroke.points.at(-1) ?? { x: 0, y: 0 };
}

export function hanziStrokeVectors(stroke: HanziStrokeModel): HanziPoint[] {
  return hanziEdgeVectors(stroke.points);
}

export function hanziStrokeLength(stroke: HanziStrokeModel): number {
  return hanziLength(stroke.points);
}

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

function hanziMinDistanceToPolyline(
  point: HanziPoint,
  polyline: readonly HanziPoint[],
): number {
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
