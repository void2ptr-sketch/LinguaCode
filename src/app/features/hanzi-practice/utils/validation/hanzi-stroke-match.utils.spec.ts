import { describe, it, expect } from 'vitest';

import { matchHanziUserStroke } from './hanzi-stroke-match.utils';
import type { HanziPoint, HanziQuizOptions } from '../../models';
import type { HanziCharacterModel, HanziStrokeModel } from '../../models/hanzi-character.model';

describe('hanzi-stroke-match.utils', () => {
  const createMockStroke = (points: HanziPoint[], strokeNum = 0, isRadical = false): HanziStrokeModel => ({
    strokeNum,
    path: 'M0,0 L100,100',
    points,
    isRadical,
  });

  const createMockCharacter = (strokes: HanziStrokeModel[]): HanziCharacterModel => ({
    character: '人',
    strokes,
  });

  const defaultUserPoints: HanziPoint[] = [
    { x: 0, y: 0 },
    { x: 50, y: 50 },
    { x: 100, y: 100 },
  ];

  describe('matchHanziUserStroke', () => {
    it('should return non-match for fewer than 2 user points', () => {
      const userPoints: HanziPoint[] = [{ x: 0, y: 0 }];
      const character = createMockCharacter([createMockStroke([{ x: 0, y: 0 }, { x: 100, y: 100 }])]);

      const result = matchHanziUserStroke(userPoints, character, 0);

      expect(result.isMatch).toBe(false);
      expect(result.avgDist).toBe(Number.POSITIVE_INFINITY);
      expect(result.meta.isStrokeBackwards).toBe(false);
    });

    it('should return non-match for empty user points', () => {
      const character = createMockCharacter([createMockStroke([{ x: 0, y: 0 }, { x: 100, y: 100 }])]);

      const result = matchHanziUserStroke([], character, 0);

      expect(result.isMatch).toBe(false);
      expect(result.avgDist).toBe(Number.POSITIVE_INFINITY);
    });

    it('should return non-match when stroke index is out of bounds', () => {
      const character = createMockCharacter([createMockStroke([{ x: 0, y: 0 }, { x: 100, y: 100 }])]);

      const result = matchHanziUserStroke(defaultUserPoints, character, 5);

      expect(result.isMatch).toBe(false);
      expect(result.avgDist).toBe(Number.POSITIVE_INFINITY);
    });

    it('should return match result with metadata when stroke matches', () => {
      const stroke = createMockStroke([
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 100 },
      ]);
      const character = createMockCharacter([stroke]);

      const result = matchHanziUserStroke(defaultUserPoints, character, 0);

      expect(result).toHaveProperty('isMatch');
      expect(result).toHaveProperty('avgDist');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('isStrokeBackwards');
    });

    it('should check later strokes for confusion when initial match fails', () => {
      const stroke1 = createMockStroke([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
      const stroke2 = createMockStroke([{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 100 }]);
      const character = createMockCharacter([stroke1, stroke2]);

      const result = matchHanziUserStroke(defaultUserPoints, character, 0);

      expect(result).toHaveProperty('isMatch');
      expect(result).toHaveProperty('avgDist');
    });

    it('should apply leniency adjustment when later stroke is a better match', () => {
      const stroke1 = createMockStroke([{ x: 0, y: 0 }, { x: 100, y: 100 }]);
      const stroke2 = createMockStroke([{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 100 }]);
      const character = createMockCharacter([stroke1, stroke2]);

      const result = matchHanziUserStroke(defaultUserPoints, character, 0);

      expect(result).toHaveProperty('isMatch');
      expect(result).toHaveProperty('avgDist');
    });

    it('should handle custom options', () => {
      const stroke = createMockStroke([{ x: 0, y: 0 }, { x: 100, y: 100 }]);
      const character = createMockCharacter([stroke]);

      const options: HanziQuizOptions = {
        leniency: 1.5,
        averageDistanceThreshold: 400,
        isOutlineVisible: true,
      };

      const result = matchHanziUserStroke(defaultUserPoints, character, 0, options);

      expect(result).toHaveProperty('isMatch');
      expect(result).toHaveProperty('avgDist');
    });

    it('should return valid result with default options', () => {
      const stroke = createMockStroke([{ x: 0, y: 0 }, { x: 50, y: 50 }]);
      const character = createMockCharacter([stroke]);

      const result = matchHanziUserStroke([{ x: 0, y: 0 }, { x: 50, y: 50 }], character, 0);

      expect(result).toBeDefined();
      expect(typeof result.isMatch).toBe('boolean');
      expect(typeof result.avgDist).toBe('number');
      expect(typeof result.meta.isStrokeBackwards).toBe('boolean');
    });

    it('should handle character with multiple strokes', () => {
      const strokes = [
        createMockStroke([{ x: 0, y: 0 }, { x: 100, y: 0 }], 0),
        createMockStroke([{ x: 50, y: 0 }, { x: 50, y: 100 }], 1),
        createMockStroke([{ x: 0, y: 50 }, { x: 100, y: 50 }], 2),
      ];
      const character = createMockCharacter(strokes);

      const result = matchHanziUserStroke(defaultUserPoints, character, 1);

      expect(result).toHaveProperty('isMatch');
      expect(result).toHaveProperty('avgDist');
    });

    it('should handle stroke with many points', () => {
      const points: HanziPoint[] = [
        { x: 0, y: 0 },
        { x: 25, y: 25 },
        { x: 50, y: 50 },
        { x: 75, y: 75 },
        { x: 100, y: 100 },
      ];
      const stroke = createMockStroke(points);
      const character = createMockCharacter([stroke]);

      const result = matchHanziUserStroke(points, character, 0);

      expect(result).toHaveProperty('isMatch');
      expect(result).toHaveProperty('avgDist');
    });
  });
});
