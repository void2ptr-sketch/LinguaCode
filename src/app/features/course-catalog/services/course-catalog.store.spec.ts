import { TestBed } from '@angular/core/testing';
import { CourseCatalogStore } from './course-catalog.store';
import type { CourseIndexEntry } from '../../../entities/course/model';
import type { PageEvent } from '@angular/material/paginator';

describe('CourseCatalogStore', () => {
  let store: CourseCatalogStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CourseCatalogStore);
  });

  describe('initial state', () => {
    it('should have default items', () => {
      expect(store.items()).toEqual([]);
    });

    it('should have default totalItems', () => {
      expect(store.totalItems()).toBe(0);
    });

    it('should have default pageIndex', () => {
      expect(store.pageIndex()).toBe(0);
    });

    it('should have default pageSize', () => {
      expect(store.pageSize()).toBe(10);
    });

    it('should have default loading state', () => {
      expect(store.loading()).toBe(false);
    });

    it('should have default error state', () => {
      expect(store.error()).toBeNull();
    });

    it('should have default progressByCourseId', () => {
      expect(store.progressByCourseId()).toEqual({});
    });

    it('should have default completedCourseIds', () => {
      expect(store.completedCourseIds()).toBeInstanceOf(Set);
      expect(store.completedCourseIds().size).toBe(0);
    });

    it('should have default selectedTabIndex', () => {
      expect(store.selectedTabIndex()).toBe(0);
    });
  });

  describe('course catalog mutations', () => {
    it('should set items', () => {
      const items: CourseIndexEntry[] = [
        {
          id: 'c1',
          title: 'Course 1',
          authorId: 'user1',
          programCount: 5,
          published: true,
          updatedAt: '2024-01-01T00:00:00.000Z',
          languagePairSummary: 'Русский → English',
        },
      ];
      store.setItems(items);
      expect(store.items()).toEqual(items);
    });

    it('should set totalItems', () => {
      store.setTotalItems(42);
      expect(store.totalItems()).toBe(42);
    });

    it('should set pageIndex', () => {
      store.setPageIndex(3);
      expect(store.pageIndex()).toBe(3);
    });

    it('should set pageSize', () => {
      store.setPageSize(25);
      expect(store.pageSize()).toBe(25);
    });

    it('should set loading', () => {
      store.setLoading(true);
      expect(store.loading()).toBe(true);

      store.setLoading(false);
      expect(store.loading()).toBe(false);
    });

    it('should set error', () => {
      store.setError('Some error');
      expect(store.error()).toBe('Some error');

      store.setError(null);
      expect(store.error()).toBeNull();
    });

    it('should set progressByCourseId', () => {
      store.setProgressByCourseId({ c1: 50, c2: 100 });
      expect(store.progressByCourseId()).toEqual({ c1: 50, c2: 100 });
    });

    it('should set completedCourseIds', () => {
      const completed = new Set(['c1', 'c2']);
      store.setCompletedCourseIds(completed);
      expect(store.completedCourseIds()).toEqual(completed);
    });
  });

  describe('tab control mutations', () => {
    it('should set selectedTabIndex', () => {
      store.setSelectedTabIndex(2);
      expect(store.selectedTabIndex()).toBe(2);
    });
  });

  describe('page events', () => {
    it('should update pageIndex and pageSize from PageEvent', () => {
      const event: PageEvent = {
        pageIndex: 5,
        pageSize: 20,
        previousPageIndex: 0,
        length: 100,
      };

      store.onPageChange(event);
      expect(store.pageIndex()).toBe(5);
      expect(store.pageSize()).toBe(20);
    });

    it('should reset pageIndex to 0 on page size change', () => {
      store.setPageIndex(3);
      store.setPageSize(10);

      const event: PageEvent = {
        pageIndex: 0,
        pageSize: 50,
        previousPageIndex: 3,
        length: 200,
      };

      store.onPageChange(event);
      expect(store.pageIndex()).toBe(0);
      expect(store.pageSize()).toBe(50);
    });
  });

  describe('state isolation', () => {
    it('should maintain state consistency after multiple updates', () => {
      store.setTotalItems(100);
      store.setPageIndex(2);
      store.setPageSize(15);
      store.setLoading(true);
      store.setError(null);

      expect(store.totalItems()).toBe(100);
      expect(store.pageIndex()).toBe(2);
      expect(store.pageSize()).toBe(15);
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
    });
  });
});
