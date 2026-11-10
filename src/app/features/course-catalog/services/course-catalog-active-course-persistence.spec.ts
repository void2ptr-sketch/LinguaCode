import { describe, it, expect, beforeEach, vi } from 'vitest';

import { readActiveCourseIds, writeActiveCourseIds } from './course-catalog-active-course-persistence';
import { COURSE_CATALOG_ACTIVE_IDS_STORAGE_KEY } from './course-catalog-active-course-persistence.types';

describe('course-catalog-active-course-persistence', () => {
  const testPairId = 'test-pair-1';
  const fullKey = `${COURSE_CATALOG_ACTIVE_IDS_STORAGE_KEY}.${testPairId}`;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('readActiveCourseIds', () => {
    it('should return empty array when key does not exist', () => {
      expect(readActiveCourseIds(testPairId)).toEqual([]);
    });

    it('should return empty array when value is invalid JSON', () => {
      localStorage.setItem(fullKey, 'not-json');
      expect(readActiveCourseIds(testPairId)).toEqual([]);
    });

    it('should return empty array when value is not an array', () => {
      localStorage.setItem(fullKey, '"string-value"');
      expect(readActiveCourseIds(testPairId)).toEqual([]);
    });

    it('should return empty array when value is an empty array', () => {
      localStorage.setItem(fullKey, '[]');
      expect(readActiveCourseIds(testPairId)).toEqual([]);
    });

    it('should filter out non-string items from the array', () => {
      localStorage.setItem(fullKey, JSON.stringify(['course-1', 42, 'course-2', null, 'course-3']));
      expect(readActiveCourseIds(testPairId)).toEqual(['course-1', 'course-2', 'course-3']);
    });

    it('should return valid string IDs from the array', () => {
      localStorage.setItem(fullKey, JSON.stringify(['course-a', 'course-b']));
      expect(readActiveCourseIds(testPairId)).toEqual(['course-a', 'course-b']);
    });

    it('should return different arrays for different pair IDs', () => {
      localStorage.setItem(fullKey, JSON.stringify(['pair-1-courses']));
      localStorage.setItem(`${COURSE_CATALOG_ACTIVE_IDS_STORAGE_KEY}.other-pair`, JSON.stringify(['other-courses']));

      expect(readActiveCourseIds(testPairId)).toEqual(['pair-1-courses']);
      expect(readActiveCourseIds('other-pair')).toEqual(['other-courses']);
    });
  });

  describe('writeActiveCourseIds', () => {
    it('should write IDs to localStorage', () => {
      writeActiveCourseIds(testPairId, ['course-1', 'course-2']);
      const raw = localStorage.getItem(fullKey);
      expect(raw).toBe(JSON.stringify(['course-1', 'course-2']));
    });

    it('should write empty array when no IDs provided', () => {
      writeActiveCourseIds(testPairId, []);
      const raw = localStorage.getItem(fullKey);
      expect(raw).toBe('[]');
    });

    it('should overwrite existing values for the same pair ID', () => {
      writeActiveCourseIds(testPairId, ['course-1']);
      writeActiveCourseIds(testPairId, ['course-2', 'course-3']);
      const raw = localStorage.getItem(fullKey);
      expect(raw).toBe(JSON.stringify(['course-2', 'course-3']));
    });

    it('should not affect other pair IDs', () => {
      writeActiveCourseIds(testPairId, ['course-1']);
      writeActiveCourseIds('other-pair', ['other-course']);

      expect(localStorage.getItem(fullKey)).toBe(JSON.stringify(['course-1']));
      expect(localStorage.getItem(`${COURSE_CATALOG_ACTIVE_IDS_STORAGE_KEY}.other-pair`)).toBe(
        JSON.stringify(['other-course']),
      );
    });

    it('should be readable back via readActiveCourseIds', () => {
      const ids = ['alpha', 'beta', 'gamma'];
      writeActiveCourseIds(testPairId, ids);
      expect(readActiveCourseIds(testPairId)).toEqual(ids);
    });
  });
});
