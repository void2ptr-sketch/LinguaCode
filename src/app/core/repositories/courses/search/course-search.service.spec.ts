import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { CourseIndexEntry, CourseWithLessons } from '../../../models';
import type { PageResponse } from '../../../../shared/utils/pagination';
import { CourseSearchService } from './course-search.service';
import { CoursesApiService } from '../api/courses-api.service';
import { coursesApiMockInterceptor } from '../../../api/courses/courses-api.mock.interceptor';

describe('CourseSearchService', () => {
  let service: CourseSearchService;
  let apiService: CoursesApiService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        CourseSearchService,
        CoursesApiService,
        provideHttpClient(withFetch(), withInterceptors([coursesApiMockInterceptor])),
      ],
    });

    service = TestBed.inject(CourseSearchService);
    apiService = TestBed.inject(CoursesApiService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('search', () => {
    it('delegates to CoursesApiService.search', async () => {
      const searchSpy = vi.spyOn(apiService, 'search').mockResolvedValue({
        items: [],
        totalItems: 0,
        page: 0,
        pageSize: 10,
        totalPages: 0,
      } as PageResponse<CourseIndexEntry>);

      await service.search({ page: { page: 0, pageSize: 10 } });

      expect(searchSpy).toHaveBeenCalledWith({ page: { page: 0, pageSize: 10 } });
    });

    it('sets loading state during search', async () => {
      let resolveAction: () => void;
      const searchPromise = new Promise<void>((r) => (resolveAction = r));
      vi.spyOn(apiService, 'search').mockReturnValue(searchPromise as unknown as Promise<PageResponse<CourseIndexEntry>>);

      void service.search({ page: { page: 0, pageSize: 10 } });

      expect(service.loading()).toBe(true);
      expect(service.error()).toBeNull();

      resolveAction!();
      await searchPromise;
      expect(service.loading()).toBe(false);
    });

    it('sets error message when API call fails', async () => {
      vi.spyOn(apiService, 'search').mockRejectedValue(new Error('API error'));

      await expect(service.search({ page: { page: 0, pageSize: 10 } })).rejects.toThrow();

      expect(service.error()).toBe('Не удалось выполнить операцию с курсами');
      expect(service.loading()).toBe(false);
    });
  });

  describe('getById', () => {
    it('delegates to CoursesApiService.getById', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Test',
        description: '',
        authorId: 'user-1',
        languagePair: { known: 'en', learning: 'zh' },
        lessonIds: [],
        published: true,
        updatedAt: new Date().toISOString(),
        lessons: [],
      };
      const spy = vi.spyOn(apiService, 'getById').mockResolvedValue(mockCourse as CourseWithLessons);

      await service.getById('course-1');

      expect(spy).toHaveBeenCalledWith('course-1');
    });
  });

  describe('create', () => {
    it('delegates to CoursesApiService.create', async () => {
      const mockCourse = {
        id: 'new-course',
        title: 'New',
        description: '',
        authorId: 'user-1',
        languagePair: { known: 'en', learning: 'zh' },
        lessonIds: [],
        published: false,
        updatedAt: new Date().toISOString(),
        lessons: [],
      };
      const spy = vi.spyOn(apiService, 'create').mockResolvedValue(mockCourse as CourseWithLessons);

      await service.create({
        title: 'New Course',
        description: '',
        published: false,
        lessons: [],
      });

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('delegates to CoursesApiService.update', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Updated',
        description: '',
        authorId: 'user-1',
        languagePair: { known: 'en', learning: 'zh' },
        lessonIds: [],
        published: true,
        updatedAt: new Date().toISOString(),
        lessons: [],
      };
      const payload = {
        title: 'Updated',
        description: '',
        published: true,
        lessons: [],
      };
      const spy = vi.spyOn(apiService, 'update').mockResolvedValue(mockCourse as CourseWithLessons);

      await service.update('course-1', payload);

      expect(spy).toHaveBeenCalledWith('course-1', payload);
    });
  });

  describe('delete', () => {
    it('delegates to CoursesApiService.delete', async () => {
      const spy = vi.spyOn(apiService, 'delete').mockResolvedValue(undefined);

      await service.delete('course-1');

      expect(spy).toHaveBeenCalledWith('course-1');
    });
  });

  describe('findUsingScenario', () => {
    it('delegates to CoursesApiService.findUsingScenario', async () => {
      const mockEntries = [
        {
          id: 'c1',
          title: 'Test',
          authorId: 'u1',
          lessonCount: 0,
          published: true,
          updatedAt: '',
          languagePairSummary: '',
        },
      ];
      const spy = vi.spyOn(apiService, 'findUsingScenario').mockResolvedValue(mockEntries);

      await service.findUsingScenario('scenario-1');

      expect(spy).toHaveBeenCalledWith('scenario-1');
    });
  });

  describe('error handling', () => {
    it('resets error on successful call after previous failure', async () => {
      vi.spyOn(apiService, 'search').mockRejectedValue(new Error('fail'));
      await service.search({ page: { page: 0, pageSize: 10 } }).catch(() => undefined);
      expect(service.error()).toBe('Не удалось выполнить операцию с курсами');

      vi.spyOn(apiService, 'search').mockResolvedValue({
        items: [],
        totalItems: 0,
        page: 0,
        pageSize: 10,
        totalPages: 0,
      } as PageResponse<CourseIndexEntry>);
      await service.search({ page: { page: 0, pageSize: 10 } });

      expect(service.error()).toBeNull();
    });
  });
});
