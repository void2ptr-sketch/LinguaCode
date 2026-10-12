import { describe, it, expect } from 'vitest';

import {
  hanziAverage,
  hanziDistance,
  hanziSubtract,
  hanziLength,
  hanziPointsEqual,
  hanziCosineSimilarity,
  hanziRotate,
  hanziNormalizeCurve,
  hanziFrechetDistance,
  hanziStripDuplicatePoints,
  hanziEdgeVectors,
} from './hanzi-geometry.utils';

describe('hanzi-geometry.utils', () => {
  describe('hanziAverage', () => {
    it('should return 0 for empty array', () => {
      expect(hanziAverage([])).toBe(0);
    });

    it('should return the single value for one-element array', () => {
      expect(hanziAverage([42])).toBe(42);
    });

    it('should calculate arithmetic mean correctly', () => {
      expect(hanziAverage([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should handle negative values', () => {
      expect(hanziAverage([-1, 0, 1])).toBe(0);
    });

    it('should handle floating point values', () => {
      expect(hanziAverage([1.5, 2.5])).toBe(2);
    });

    it('should handle readonly arrays', () => {
      const values: readonly number[] = [10, 20, 30];
      expect(hanziAverage(values)).toBe(20);
    });
  });

  describe('hanziDistance', () => {
    it('should calculate zero distance for identical points', () => {
      expect(hanziDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    });

    it('should calculate Euclidean distance correctly', () => {
      expect(hanziDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it('should handle negative coordinates', () => {
      expect(hanziDistance({ x: -1, y: -1 }, { x: 1, y: 1 })).toBe(Math.sqrt(8));
    });

    it('should be symmetric', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 4, y: 6 };
      expect(hanziDistance(a, b)).toBe(hanziDistance(b, a));
    });
  });

  describe('hanziSubtract', () => {
    it('should subtract points correctly', () => {
      const result = hanziSubtract({ x: 5, y: 10 }, { x: 2, y: 3 });
      expect(result).toEqual({ x: 3, y: 7 });
    });

    it('should handle zero coordinates', () => {
      expect(hanziSubtract({ x: 0, y: 0 }, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    });

    it('should handle negative results', () => {
      expect(hanziSubtract({ x: 1, y: 2 }, { x: 5, y: 10 })).toEqual({ x: -4, y: -8 });
    });
  });

  describe('hanziLength', () => {
    it('should return 0 for empty array', () => {
      expect(hanziLength([])).toBe(0);
    });

    it('should return 0 for single point', () => {
      expect(hanziLength([{ x: 0, y: 0 }])).toBe(0);
    });

    it('should return 0 for two identical points', () => {
      expect(hanziLength([{ x: 0, y: 0 }, { x: 0, y: 0 }])).toBe(0);
    });

    it('should calculate total polyline length', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 3, y: 4 },
      ];
      // 3 + 4 = 7
      expect(hanziLength(points)).toBe(7);
    });

    it('should handle readonly arrays', () => {
      const points: readonly { x: number; y: number }[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ];
      expect(hanziLength(points)).toBe(Math.sqrt(2));
    });
  });

  describe('hanziPointsEqual', () => {
    it('should return true for identical points', () => {
      expect(hanziPointsEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true);
    });

    it('should return false when x differs', () => {
      expect(hanziPointsEqual({ x: 1, y: 2 }, { x: 2, y: 2 })).toBe(false);
    });

    it('should return false when y differs', () => {
      expect(hanziPointsEqual({ x: 1, y: 2 }, { x: 1, y: 3 })).toBe(false);
    });

    it('should return false when both differ', () => {
      expect(hanziPointsEqual({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(false);
    });
  });

  describe('hanziCosineSimilarity', () => {
    it('should return 0 when either vector has zero length', () => {
      expect(hanziCosineSimilarity({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(0);
      expect(hanziCosineSimilarity({ x: 1, y: 1 }, { x: 0, y: 0 })).toBe(0);
    });

    it('should return 1 for identical direction vectors', () => {
      expect(hanziCosineSimilarity({ x: 1, y: 0 }, { x: 2, y: 0 })).toBe(1);
    });

    it('should return -1 for opposite direction vectors', () => {
      expect(hanziCosineSimilarity({ x: 1, y: 0 }, { x: -1, y: 0 })).toBe(-1);
    });

    it('should return 0 for perpendicular vectors', () => {
      expect(hanziCosineSimilarity({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(0);
    });

    it('should return value between -1 and 1 for arbitrary vectors', () => {
      const result = hanziCosineSimilarity({ x: 1, y: 1 }, { x: 2, y: 1 });
      expect(result).toBeGreaterThan(-1);
      expect(result).toBeLessThan(1);
    });
  });

  describe('hanziRotate', () => {
    it('should not rotate when theta is 0', () => {
      const point = { x: 5, y: 3 };
      expect(hanziRotate(point, 0)).toEqual(point);
    });

    it('should rotate point by 90 degrees (PI/2) around origin', () => {
      const result = hanziRotate({ x: 1, y: 0 }, Math.PI / 2);
      // cos(PI/2) ≈ 0, sin(PI/2) = 1
      // x' = 1*0 - 0*1 = 0, y' = 1*1 + 0*0 = 1
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(1);
    });

    it('should rotate point by 180 degrees (PI) around origin', () => {
      const result = hanziRotate({ x: 1, y: 0 }, Math.PI);
      // cos(PI) = -1, sin(PI) = 0
      // x' = 1*(-1) - 0*0 = -1, y' = 1*0 + 0*(-1) = 0
      expect(result.x).toBeCloseTo(-1);
      expect(result.y).toBeCloseTo(0);
    });

    it('should handle negative coordinates', () => {
      const result = hanziRotate({ x: -1, y: -1 }, 0);
      expect(result).toEqual({ x: -1, y: -1 });
    });
  });

  describe('hanziNormalizeCurve', () => {
    it('should return empty array for empty input', () => {
      expect(hanziNormalizeCurve([])).toEqual([]);
    });

    it('should normalize a single point to [0, 0]', () => {
      const result = hanziNormalizeCurve([{ x: 5, y: 10 }]);
      expect(result).toEqual([{ x: 0, y: 0 }]);
    });

    it('should normalize points to 0-1 range', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 200 },
      ];
      const result = hanziNormalizeCurve(points);
      expect(result[0]).toEqual({ x: 0, y: 0 });
      expect(result[1].x).toBeCloseTo(0.5);
      expect(result[1].y).toBeCloseTo(1);
    });

    it('should handle points with negative coordinates', () => {
      const points = [
        { x: -50, y: -50 },
        { x: 50, y: 50 },
      ];
      const result = hanziNormalizeCurve(points);
      expect(result[0]).toEqual({ x: 0, y: 0 });
      expect(result[1].x).toBeCloseTo(1);
      expect(result[1].y).toBeCloseTo(1);
    });

    it('should not mutate the original array', () => {
      const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
      const result = hanziNormalizeCurve(points);
      expect(result).not.toBe(points);
      expect(points[0]).toEqual({ x: 1, y: 2 });
    });
  });

  describe('hanziFrechetDistance', () => {
    it('should return Infinity for empty left array', () => {
      expect(hanziFrechetDistance([], [{ x: 0, y: 0 }])).toBe(Number.POSITIVE_INFINITY);
    });

    it('should return Infinity for empty right array', () => {
      expect(hanziFrechetDistance([{ x: 0, y: 0 }], [])).toBe(Number.POSITIVE_INFINITY);
    });

    it('should return 0 for identical single points', () => {
      expect(hanziFrechetDistance([{ x: 0, y: 0 }], [{ x: 0, y: 0 }])).toBe(0);
    });

    it('should return distance for different single points', () => {
      expect(hanziFrechetDistance([{ x: 0, y: 0 }], [{ x: 3, y: 4 }])).toBe(5);
    });

    it('should return 0 for identical polylines', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ];
      expect(hanziFrechetDistance(points, points)).toBe(0);
    });

    it('should handle polylines of different lengths', () => {
      const left = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
      const right = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }];
      const result = hanziFrechetDistance(left, right);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('hanziStripDuplicatePoints', () => {
    it('should return copy for empty array', () => {
      expect(hanziStripDuplicatePoints([])).toEqual([]);
    });

    it('should return copy for single point', () => {
      const point = { x: 1, y: 2 };
      expect(hanziStripDuplicatePoints([point])).toEqual([point]);
    });

    it('should remove consecutive duplicate points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ];
      const result = hanziStripDuplicatePoints(points);
      expect(result).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ]);
    });

    it('should not remove non-consecutive duplicates', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 0 },
      ];
      const result = hanziStripDuplicatePoints(points);
      expect(result).toEqual(points);
    });

    it('should not mutate the original array', () => {
      const points = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
      const result = hanziStripDuplicatePoints(points);
      expect(result).not.toBe(points);
    });
  });

  describe('hanziEdgeVectors', () => {
    it('should return empty array for empty input', () => {
      expect(hanziEdgeVectors([])).toEqual([]);
    });

    it('should return empty array for single point', () => {
      expect(hanziEdgeVectors([{ x: 0, y: 0 }])).toEqual([]);
    });

    it('should calculate vectors between consecutive points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 3, y: 4 },
      ];
      const result = hanziEdgeVectors(points);
      expect(result).toEqual([
        { x: 3, y: 0 },
        { x: 0, y: 4 },
      ]);
    });

    it('should handle negative coordinates', () => {
      const points = [
        { x: 0, y: 0 },
        { x: -1, y: -1 },
      ];
      const result = hanziEdgeVectors(points);
      expect(result).toEqual([{ x: -1, y: -1 }]);
    });
  });
});
