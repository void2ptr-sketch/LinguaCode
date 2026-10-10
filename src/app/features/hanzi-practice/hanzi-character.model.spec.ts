import type { HanziCharacterJson, HanziPoint } from './hanzi-character.types';
import {
  buildHanziCharacterModel,
  hanziStrokeAverageDistance,
  hanziStrokeDirectionSimilarity,
  hanziStrokeEndingPoint,
  hanziStrokeLength,
  hanziStrokeStartingPoint,
  hanziStrokeVectors,
  type HanziStrokeModel,
} from './hanzi-character.model';

function makeJson(overrides?: Partial<HanziCharacterJson>): HanziCharacterJson {
  return {
    strokes: ['M0 0 L100 0', 'M50 0 L50 100'],
    medians: [
      [
        [0, 0],
        [100, 0],
      ],
      [
        [50, 0],
        [50, 100],
      ],
    ],
    radStrokes: [1],
    ...overrides,
  } as HanziCharacterJson;
}

function makeStroke(points: readonly HanziPoint[], isRadical = false): HanziStrokeModel {
  return {
    strokeNum: 0,
    path: 'M0 0',
    points,
    isRadical,
  };
}

describe('hanzi-character.model', () => {
  describe('buildHanziCharacterModel', () => {
    it('should build stroke models with indices, paths and points', () => {
      const model = buildHanziCharacterModel('一', makeJson());

      expect(model.character).toBe('一');
      expect(model.strokes).toHaveLength(2);
      expect(model.strokes.map((stroke) => stroke.path)).toEqual([
        'M0 0 L100 0',
        'M50 0 L50 100',
      ]);
      expect(model.strokes[0]?.strokeNum).toBe(0);
      expect(model.strokes[1]?.strokeNum).toBe(1);
      expect(model.strokes[0]?.points).toEqual([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ]);
    });

    it('should mark radical strokes', () => {
      const model = buildHanziCharacterModel('一', makeJson());

      expect(model.strokes[0]?.isRadical).toBe(false);
      expect(model.strokes[1]?.isRadical).toBe(true);
    });

    it('should treat all strokes as non-radical when radStrokes is absent', () => {
      const model = buildHanziCharacterModel('一', makeJson({ radStrokes: undefined }));

      expect(model.strokes.every((stroke) => !stroke.isRadical)).toBe(true);
    });

    it('should use empty points when medians are missing for a stroke', () => {
      const model = buildHanziCharacterModel(
        '一',
        makeJson({ strokes: ['M0 0', 'M1 1', 'M2 2'], medians: [[[0, 0]]] }),
      );

      expect(model.strokes[0]?.points).toEqual([{ x: 0, y: 0 }]);
      expect(model.strokes[1]?.points).toEqual([]);
      expect(model.strokes[2]?.points).toEqual([]);
    });
  });

  describe('hanziStrokeStartingPoint / hanziStrokeEndingPoint', () => {
    it('should return the first and last points', () => {
      const stroke = makeStroke([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ]);

      expect(hanziStrokeStartingPoint(stroke)).toEqual({ x: 1, y: 2 });
      expect(hanziStrokeEndingPoint(stroke)).toEqual({ x: 5, y: 6 });
    });

    it('should fall back to origin for an empty stroke', () => {
      const stroke = makeStroke([]);

      expect(hanziStrokeStartingPoint(stroke)).toEqual({ x: 0, y: 0 });
      expect(hanziStrokeEndingPoint(stroke)).toEqual({ x: 0, y: 0 });
    });
  });

  describe('hanziStrokeVectors', () => {
    it('should compute direction vectors between consecutive points', () => {
      const vectors = hanziStrokeVectors(
        makeStroke([
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 2 },
        ]),
      );

      expect(vectors).toEqual([
        { x: 1, y: 0 },
        { x: 0, y: 2 },
      ]);
    });

    it('should return an empty array for fewer than two points', () => {
      expect(hanziStrokeVectors(makeStroke([{ x: 0, y: 0 }]))).toEqual([]);
    });
  });

  describe('hanziStrokeLength', () => {
    it('should sum segment lengths', () => {
      const length = hanziStrokeLength(
        makeStroke([
          { x: 0, y: 0 },
          { x: 3, y: 0 },
          { x: 3, y: 4 },
        ]),
      );

      expect(length).toBeCloseTo(7, 10);
    });

    it('should return 0 for a single-point stroke', () => {
      expect(hanziStrokeLength(makeStroke([{ x: 5, y: 5 }]))).toBe(0);
    });
  });

  describe('hanziStrokeAverageDistance', () => {
    it('should return Infinity when there are no user points', () => {
      const stroke = makeStroke([{ x: 0, y: 0 }]);

      expect(hanziStrokeAverageDistance(stroke, [])).toBe(Number.POSITIVE_INFINITY);
    });

    it('should return Infinity when the stroke has no points', () => {
      expect(hanziStrokeAverageDistance(makeStroke([]), [{ x: 0, y: 0 }])).toBe(
        Number.POSITIVE_INFINITY,
      );
    });

    it('should return 0 for points lying exactly on the stroke polyline', () => {
      const stroke = makeStroke([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ]);

      expect(hanziStrokeAverageDistance(stroke, [{ x: 5, y: 0 }])).toBe(0);
    });

    it('should measure the distance to the closest segment', () => {
      const stroke = makeStroke([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ]);

      expect(hanziStrokeAverageDistance(stroke, [{ x: 5, y: 3 }])).toBeCloseTo(3, 10);
    });

    it('should average distances across multiple points', () => {
      const stroke = makeStroke([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ]);

      const average = hanziStrokeAverageDistance(stroke, [
        { x: 5, y: 1 },
        { x: 5, y: 3 },
      ]);

      expect(average).toBeCloseTo(2, 10);
    });

    it('should measure distance to the segment start for degenerate segments', () => {
      const stroke = makeStroke([
        { x: 5, y: 0 },
        { x: 5, y: 0 },
      ]);

      expect(hanziStrokeAverageDistance(stroke, [{ x: 5, y: 4 }])).toBeCloseTo(4, 10);
    });
  });

  describe('hanziStrokeDirectionSimilarity', () => {
    it('should return 1 for identical directions', () => {
      const stroke = makeStroke([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ]);

      const similarity = hanziStrokeDirectionSimilarity(
        [
          { x: 0, y: 5 },
          { x: 7, y: 5 },
        ],
        stroke,
      );

      expect(similarity).toBeCloseTo(1, 10);
    });

    it('should return 0 when the user drew a single point', () => {
      const stroke = makeStroke([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ]);

      expect(hanziStrokeDirectionSimilarity([{ x: 1, y: 1 }], stroke)).toBe(0);
    });

    it('should return 0 when the stroke has no vectors', () => {
      expect(hanziStrokeDirectionSimilarity([{ x: 0, y: 0 }, { x: 1, y: 0 }], makeStroke([]))).toBe(
        0,
      );
    });

    it('should return a value within [0, 1] for mixed directions', () => {
      const stroke = makeStroke([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ]);

      const similarity = hanziStrokeDirectionSimilarity(
        [
          { x: 0, y: 0 },
          { x: 5, y: 5 },
          { x: 10, y: 0 },
        ],
        stroke,
      );

      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });
});
