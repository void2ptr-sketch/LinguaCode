import { describe, expect, it } from 'vitest';
import { tagLabel } from './catalog-labels';

describe('catalog-labels', () => {
  describe('tagLabel', () => {
    it('should return tag id as-is for difficulty tags', () => {
      expect(tagLabel('beginner')).toBe('beginner');
      expect(tagLabel('intermediate')).toBe('intermediate');
      expect(tagLabel('advanced')).toBe('advanced');
    });

    it('should return tag id as fallback for unknown tags', () => {
      expect(tagLabel('unknown-tag')).toBe('unknown-tag');
    });
  });
});
