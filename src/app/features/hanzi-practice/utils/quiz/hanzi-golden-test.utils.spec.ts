import { describe, it, expect, vi } from 'vitest';

import {
  GOLDEN_HANZI_CHARACTERS,
  GOLDEN_CANVAS_SIZE,
  GOLDEN_CANVAS_PADDING,
  buildGoldenHanziModel,
  offsetDrawStrokes,
  cornerScribbleStroke,
  fetchGoldenHanziJson,
  type GoldenHanziCharacter,
} from './hanzi-golden-test.utils';
import type { HanziCharacterJson } from '../../models';
import { buildHanziCharacterModel } from '../../models/hanzi-character.model';

describe('hanzi-golden-test.utils', () => {
  describe('constants', () => {
    it('should export GOLDEN_HANZI_CHARACTERS array', () => {
      expect(GOLDEN_HANZI_CHARACTERS).toEqual(['人', '大', '好', '你', '水']);
    });

    it('should export GOLDEN_CANVAS_SIZE with correct dimensions', () => {
      expect(GOLDEN_CANVAS_SIZE).toEqual({ width: 280, height: 280 });
    });

    it('should export GOLDEN_CANVAS_PADDING with correct value', () => {
      expect(GOLDEN_CANVAS_PADDING).toBe(20);
    });
  });

  describe('buildGoldenHanziModel', () => {
    it('should build a HanziCharacterModel from character and JSON', () => {
      const json: HanziCharacterJson = {
        strokes: ['M0,0 L10,10'],
        medians: [[{ x: 0, y: 0 }, { x: 10, y: 10 }]],
      };

      const model = buildGoldenHanziModel('人', json);

      expect(model.character).toBe('人');
      expect(model.strokes).toHaveLength(1);
      expect(model.strokes[0]!.strokeNum).toBe(0);
    });

    it('should work with all golden characters', () => {
      const json: HanziCharacterJson = {
        strokes: ['M0,0'],
        medians: [[{ x: 0, y: 0 }]],
      };

      for (const char of GOLDEN_HANZI_CHARACTERS) {
        const model = buildGoldenHanziModel(char as GoldenHanziCharacter, json);
        expect(model.character).toBe(char);
      }
    });

    it('should delegate to buildHanziCharacterModel', () => {
      const json: HanziCharacterJson = {
        strokes: ['M0,0 L10,10'],
        medians: [[{ x: 0, y: 0 }, { x: 10, y: 10 }]],
      };

      const model = buildGoldenHanziModel('人', json);
      const expectedModel = buildHanziCharacterModel('人', json);

      expect(model.character).toBe(expectedModel.character);
      expect(model.strokes.length).toBe(expectedModel.strokes.length);
    });
  });

  describe('offsetDrawStrokes', () => {
    it('should shift all points by dx and dy', () => {
      const strokes = [
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
      ] as never[];

      const result = offsetDrawStrokes(strokes as never, 5, 10);

      expect(result[0]![0]).toEqual({ x: 5, y: 10 });
      expect(result[0]![1]).toEqual({ x: 15, y: 20 });
    });

    it('should not mutate the original strokes', () => {
      const original = [
        [{ x: 0, y: 0 }, { x: 5, y: 5 }],
      ] as never[];
      const strokes = JSON.parse(JSON.stringify(original)) as never[];

      offsetDrawStrokes(strokes as never, 1, 1);

      expect(strokes[0]![0]).toEqual({ x: 0, y: 0 });
    });

    it('should handle negative offsets', () => {
      const strokes = [[{ x: 10, y: 10 }]] as never[];
      const result = offsetDrawStrokes(strokes as never, -5, -3);

      expect(result[0]![0]).toEqual({ x: 5, y: 7 });
    });

    it('should handle empty strokes array', () => {
      expect(offsetDrawStrokes([], 1, 1)).toEqual([]);
    });

    it('should handle multiple strokes', () => {
      const strokes = [
        [{ x: 0, y: 0 }, { x: 5, y: 5 }],
        [{ x: 10, y: 10 }, { x: 15, y: 15 }],
      ] as never[];

      const result = offsetDrawStrokes(strokes as never, 2, 3);

      expect(result).toHaveLength(2);
      expect(result[0]![0]).toEqual({ x: 2, y: 3 });
      expect(result[1]![0]).toEqual({ x: 12, y: 13 });
    });
  });

  describe('cornerScribbleStroke', () => {
    it('should return a three-point stroke path', () => {
      const stroke = cornerScribbleStroke();
      expect(stroke).toHaveLength(3);
    });

    it('should return points near top-left corner', () => {
      const stroke = cornerScribbleStroke();

      expect(stroke[0]).toEqual({ x: 8, y: 8 });
      expect(stroke[1]).toEqual({ x: 42, y: 38 });
      expect(stroke[2]).toEqual({ x: 18, y: 52 });
    });

    it('should return a new array each time', () => {
      const stroke1 = cornerScribbleStroke();
      const stroke2 = cornerScribbleStroke();

      expect(stroke1).not.toBe(stroke2);
    });
  });

  describe('fetchGoldenHanziJson', () => {
    it('should fetch JSON from the correct URL', async () => {
      const mockJson: HanziCharacterJson = {
        strokes: ['M0,0 L10,10'],
        medians: [[{ x: 0, y: 0 }, { x: 10, y: 10 }]],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockJson),
      });

      const result = await fetchGoldenHanziJson('人');

      expect(global.fetch).toHaveBeenCalledWith('/assets/hanzi/%E4%BA%BA.json');
      expect(result).toEqual(mockJson);
    });

    it('should throw error when fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(fetchGoldenHanziJson('人')).rejects.toThrow(
        'Failed to load golden hanzi JSON for 人: 404',
      );
    });

    it('should URL-encode the character in the path', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ strokes: [], medians: [] }),
      });

      await fetchGoldenHanziJson('人');

      expect(global.fetch).toHaveBeenCalledWith('/assets/hanzi/%E4%BA%BA.json');
    });

    it('should handle all golden characters', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ strokes: [], medians: [] }),
      });

      for (const char of GOLDEN_HANZI_CHARACTERS) {
        await fetchGoldenHanziJson(char as GoldenHanziCharacter);
        const expectedPath = `/assets/hanzi/${encodeURIComponent(char)}.json`;
        expect(global.fetch).toHaveBeenCalledWith(expectedPath);
      }
    });
  });
});
