import type { HanziPoint, HanziQuizOptions } from './hanzi-character.types';
import {
  type HanziCharacterModel,
  type HanziStrokeModel,
  hanziStrokeAverageDistance,
  hanziStrokeDirectionSimilarity,
  hanziStrokeEndingPoint,
  hanziStrokeLength,
  hanziStrokeStartingPoint,
} from './hanzi-character.model';
import {
  hanziFrechetDistance,
  hanziLength,
  hanziNormalizeCurve,
  hanziRotate,
  hanziStripDuplicatePoints,
  hanziDistance,
} from './hanzi-geometry.utils';

const COSINE_SIMILARITY_THRESHOLD = 0;
const START_AND_END_DIST_THRESHOLD = 250;
const FRECHET_THRESHOLD = 0.4;
const MIN_LEN_THRESHOLD = 0.35;
const SHAPE_FIT_ROTATIONS = [
  Math.PI / 16,
  Math.PI / 32,
  0,
  (-1 * Math.PI) / 32,
  (-1 * Math.PI) / 16,
];

export type HanziStrokeMatchMeta = {
  isStrokeBackwards: boolean;
};

export type HanziStrokeMatchResult = {
  isMatch: boolean;
  avgDist: number;
  meta: HanziStrokeMatchMeta;
};

export function matchHanziUserStroke(
  userPoints: readonly HanziPoint[],
  character: HanziCharacterModel,
  strokeNum: number,
  options: HanziQuizOptions = {},
): HanziStrokeMatchResult {
  const points = hanziStripDuplicatePoints(userPoints);
  if (points.length < 2) {
    return { isMatch: false, avgDist: Number.POSITIVE_INFINITY, meta: { isStrokeBackwards: false } };
  }

  const targetStroke = character.strokes[strokeNum];
  if (!targetStroke) {
    return { isMatch: false, avgDist: Number.POSITIVE_INFINITY, meta: { isStrokeBackwards: false } };
  }

  const { isMatch, meta, avgDist } = getHanziStrokeMatchData(points, targetStroke, options);
  if (!isMatch) {
    return { isMatch, avgDist, meta };
  }

  const laterStrokes = character.strokes.slice(strokeNum + 1);
  let closestMatchDist = avgDist;

  for (const laterStroke of laterStrokes) {
    const laterMatch = getHanziStrokeMatchData(points, laterStroke, {
      ...options,
      checkBackwards: false,
    });
    if (laterMatch.isMatch && laterMatch.avgDist < closestMatchDist) {
      closestMatchDist = laterMatch.avgDist;
    }
  }

  if (closestMatchDist < avgDist) {
    const leniencyAdjustment = (0.6 * (closestMatchDist + avgDist)) / (2 * avgDist);
    return getHanziStrokeMatchData(points, targetStroke, {
      ...options,
      leniency: (options.leniency ?? 1) * leniencyAdjustment,
    });
  }

  return { isMatch, avgDist, meta };
}

function getHanziStrokeMatchData(
  points: readonly HanziPoint[],
  stroke: HanziStrokeModel,
  options: HanziQuizOptions & { checkBackwards?: boolean },
): HanziStrokeMatchResult {
  const {
    leniency = 1,
    isOutlineVisible = false,
    checkBackwards = true,
    averageDistanceThreshold = 350,
    acceptBackwardsStrokes = false,
  } = options;

  const avgDist = hanziStrokeAverageDistance(stroke, points);
  const distMod = isOutlineVisible || stroke.strokeNum > 0 ? 0.5 : 1;
  const withinDistThresh = avgDist <= averageDistanceThreshold * distMod * leniency;

  if (!withinDistThresh) {
    return { isMatch: false, avgDist, meta: { isStrokeBackwards: false } };
  }

  const startAndEndMatch = startAndEndMatches(points, stroke, leniency);
  const directionMatch = hanziStrokeDirectionSimilarity(points, stroke) > COSINE_SIMILARITY_THRESHOLD;
  const shapeMatch = shapeFit(points, stroke.points, leniency);
  const lengthMatch = lengthMatches(points, stroke, leniency);
  const isMatch = withinDistThresh && startAndEndMatch && directionMatch && shapeMatch && lengthMatch;

  if (checkBackwards && !isMatch) {
    const backwards = getHanziStrokeMatchData([...points].reverse(), stroke, {
      ...options,
      checkBackwards: false,
    });

    if (backwards.isMatch) {
      return {
        isMatch: acceptBackwardsStrokes,
        avgDist,
        meta: { isStrokeBackwards: true },
      };
    }
  }

  return { isMatch, avgDist, meta: { isStrokeBackwards: false } };
}

function startAndEndMatches(
  points: readonly HanziPoint[],
  stroke: HanziStrokeModel,
  leniency: number,
): boolean {
  const startingDist = hanziDistance(hanziStrokeStartingPoint(stroke), points[0]!);
  const endingDist = hanziDistance(hanziStrokeEndingPoint(stroke), points.at(-1)!);
  return (
    startingDist <= START_AND_END_DIST_THRESHOLD * leniency &&
    endingDist <= START_AND_END_DIST_THRESHOLD * leniency
  );
}

function lengthMatches(
  points: readonly HanziPoint[],
  stroke: HanziStrokeModel,
  leniency: number,
): boolean {
  return (leniency * (hanziLength(points) + 25)) / (hanziStrokeLength(stroke) + 25) >= MIN_LEN_THRESHOLD;
}

function shapeFit(userCurve: readonly HanziPoint[], strokeCurve: readonly HanziPoint[], leniency: number): boolean {
  const normUser = hanziNormalizeCurve(userCurve);
  const normStroke = hanziNormalizeCurve(strokeCurve);
  let minDist = Number.POSITIVE_INFINITY;

  for (const theta of SHAPE_FIT_ROTATIONS) {
    const rotated = normStroke.map((point) => hanziRotate(point, theta));
    const dist = hanziFrechetDistance(normUser, rotated);
    if (dist < minDist) {
      minDist = dist;
    }
  }

  return minDist <= FRECHET_THRESHOLD * leniency;
}
