import { describe, it, expect } from 'vitest';
import { initialState } from './course-catalog-store';
import type { CourseCatalogState } from './course-catalog-store';

describe('course-catalog-store model', () => {
  describe('initialState', () => {
    it('should have empty items array', () => {
      expect(initialState.items).toEqual([]);
    });

    it('should have zero totalItems', () => {
      expect(initialState.totalItems).toBe(0);
    });

    it('should have zero pageIndex', () => {
      expect(initialState.pageIndex).toBe(0);
    });

    it('should have default pageSize of 10', () => {
      expect(initialState.pageSize).toBe(10);
    });

    it('should have loading set to false', () => {
      expect(initialState.loading).toBe(false);
    });

    it('should have null error', () => {
      expect(initialState.error).toBeNull();
    });

    it('should have empty progressByCourseId', () => {
      expect(initialState.progressByCourseId).toEqual({});
    });

    it('should have empty completedCourseIds Set', () => {
      expect(initialState.completedCourseIds).toBeInstanceOf(Set);
      expect(initialState.completedCourseIds.size).toBe(0);
    });

    it('should have zero selectedTabIndex', () => {
      expect(initialState.selectedTabIndex).toBe(0);
    });
  });

  describe('type safety', () => {
    it('should be assignable to CourseCatalogState type', () => {
      const state: CourseCatalogState = initialState;
      expect(state).toBeDefined();
    });

    it('should be immutable - modifying copy should not affect original', () => {
      const copy = { ...initialState };
      copy.totalItems = 5;
      expect(initialState.totalItems).toBe(0);
    });
  });
});
