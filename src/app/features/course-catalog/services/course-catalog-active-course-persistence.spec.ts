import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  readActiveCourseIds,
  writeActiveCourseIds,
  readSelectedTabIndex,
  writeSelectedTabIndex,
} from './course-catalog-active-course-persistence';
import {
  COURSE_CATALOG_ACTIVE_IDS_STORAGE_KEY,
  COURSE_CATALOG_TAB_INDEX_STORAGE_KEY,
} from './course-catalog-active-course-persistence.types';

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
      localStorage.setItem(
        `${COURSE_CATALOG_ACTIVE_IDS_STORAGE_KEY}.other-pair`,
        JSON.stringify(['other-courses']),
      );

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

  describe('readSelectedTabIndex', () => {
    it('should return 0 when key does not exist', () => {
      expect(readSelectedTabIndex()).toBe(0);
    });

    it('should return 0 when value is empty string', () => {
      localStorage.setItem(COURSE_CATALOG_TAB_INDEX_STORAGE_KEY, '');
      expect(readSelectedTabIndex()).toBe(0);
    });

    it('should return 0 when value is not a number', () => {
      localStorage.setItem(COURSE_CATALOG_TAB_INDEX_STORAGE_KEY, 'not-a-number');
      expect(readSelectedTabIndex()).toBe(0);
    });

    it('should return 0 when value is NaN', () => {
      localStorage.setItem(COURSE_CATALOG_TAB_INDEX_STORAGE_KEY, 'NaN');
      expect(readSelectedTabIndex()).toBe(0);
    });

    it('should return 0 when value is negative', () => {
      localStorage.setItem(COURSE_CATALOG_TAB_INDEX_STORAGE_KEY, '-1');
      expect(readSelectedTabIndex()).toBe(0);
    });

    it('should return the parsed number when value is valid', () => {
      localStorage.setItem(COURSE_CATALOG_TAB_INDEX_STORAGE_KEY, '2');
      expect(readSelectedTabIndex()).toBe(2);
    });

    it('should return 0 for the default tab', () => {
      localStorage.setItem(COURSE_CATALOG_TAB_INDEX_STORAGE_KEY, '0');
      expect(readSelectedTabIndex()).toBe(0);
    });

    it('should handle large tab indices', () => {
      localStorage.setItem(COURSE_CATALOG_TAB_INDEX_STORAGE_KEY, '999');
      expect(readSelectedTabIndex()).toBe(999);
    });
  });

  describe('writeSelectedTabIndex', () => {
    it('should write the index to localStorage', () => {
      writeSelectedTabIndex(2);
      expect(localStorage.getItem(COURSE_CATALOG_TAB_INDEX_STORAGE_KEY)).toBe('2');
    });

    it('should write 0 for the default tab', () => {
      writeSelectedTabIndex(0);
      expect(localStorage.getItem(COURSE_CATALOG_TAB_INDEX_STORAGE_KEY)).toBe('0');
    });

    it('should overwrite previous values', () => {
      writeSelectedTabIndex(1);
      writeSelectedTabIndex(3);
      expect(localStorage.getItem(COURSE_CATALOG_TAB_INDEX_STORAGE_KEY)).toBe('3');
    });

    it('should be readable back via readSelectedTabIndex', () => {
      writeSelectedTabIndex(5);
      expect(readSelectedTabIndex()).toBe(5);
    });
  });
});
