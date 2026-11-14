import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { CourseIndexEntry, CourseWithPrograms } from '../model';
import type { PageResponse } from '../../../shared/utils/pagination';
import { CourseSearchService } from './course-search.service';
import { CoursesApiService } from '../api/courses-api.service';
import { coursesApiMockInterceptor } from '../api/mock/courses-api.mock.interceptor';
import { ProgramsApiService } from '../../program/api/programs-api.service';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';

describe('CourseSearchService', () => {
  let service: CourseSearchService;
  let apiService: CoursesApiService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        CourseSearchService,
        CoursesApiService,
        {
          provide: AppLoggerService,
          useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
        },
        provideHttpClient(withFetch(), withInterceptors([coursesApiMockInterceptor])),
        provideHttpClientTesting(),
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
      vi.spyOn(apiService, 'search').mockReturnValue(
        searchPromise as unknown as Promise<PageResponse<CourseIndexEntry>>,
      );

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
    it('delegates to CoursesApiService.getJourney with numeric ID', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Test',
        slug: 'test',
        description: '',
        authorId: 'user-1',
        languagePair: { known: 'en', learning: 'zh' },
        programIds: [],
        published: true,
        updatedAt: new Date().toISOString(),
        programs: [
          {
            id: 'prog-1',
            courseId: '1',
            title: 'P',
            description: '',
            order: 0,
            updatedAt: '',
            lessons: [],
          },
        ],
      };
      const spy = vi
        .spyOn(apiService, 'getJourney')
        .mockResolvedValue(mockCourse as CourseWithPrograms);

      await service.getById('1');

      expect(spy).toHaveBeenCalledWith('1');
    });

    it('resolves string ID and delegates to CoursesApiService.getJourney', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Test',
        slug: 'test',
        description: '',
        authorId: 'user-1',
        languagePair: { known: 'en', learning: 'zh' },
        programIds: [],
        published: true,
        updatedAt: new Date().toISOString(),
        programs: [
          {
            id: 'prog-1',
            courseId: '42',
            title: 'P',
            description: '',
            order: 0,
            updatedAt: '',
            lessons: [],
          },
        ],
      };
      const getJourneySpy = vi
        .spyOn(apiService, 'getJourney')
        .mockResolvedValue(mockCourse as CourseWithPrograms);

      // Mock resolveCourseId to return a numeric ID
      const resolveSpy = vi.spyOn(service, 'resolveCourseId').mockResolvedValue('42');

      await service.getById('course-1');

      expect(resolveSpy).toHaveBeenCalledWith('course-1');
      expect(getJourneySpy).toHaveBeenCalledWith('42');
    });

    it('throws when string ID cannot be resolved', async () => {
      // Mock resolveCourseId to return null
      vi.spyOn(service, 'resolveCourseId').mockResolvedValue(null);

      await expect(service.getById('unknown-course')).rejects.toThrow(
        'Course not found: unknown-course',
      );
    });

    it('returns an empty-program journey response without falling back', async () => {
      const journeyCourse = {
        id: '12',
        title: 'Test',
        slug: '',
        description: '',
        authorId: '1',
        languagePair: { known: 'ru', learning: 'en' },
        programIds: [],
        published: true,
        updatedAt: '',
        programs: [],
      };
      vi.spyOn(apiService, 'getJourney').mockResolvedValue(journeyCourse as CourseWithPrograms);
      const getByIdSpy = vi.spyOn(apiService, 'getById');
      const programsApi = TestBed.inject(ProgramsApiService);
      const getByCourseSpy = vi.spyOn(programsApi, 'getByCourse');

      const result = await service.getById('12');

      expect(result).toEqual(journeyCourse);
      expect(getByIdSpy).not.toHaveBeenCalled();
      expect(getByCourseSpy).not.toHaveBeenCalled();
    });

    it('merges languagePair from CoursesApiService.getById when journey omits it', async () => {
      const journeyCourse = {
        id: '12',
        title: 'Test',
        slug: '',
        description: '',
        authorId: '1',
        programIds: [],
        published: true,
        updatedAt: '',
        programs: [],
      } as unknown as CourseWithPrograms;
      vi.spyOn(apiService, 'getJourney').mockResolvedValue(journeyCourse);

      const getByIdSpy = vi.spyOn(apiService, 'getById').mockResolvedValue({
        ...journeyCourse,
        languagePair: { known: 'ru', learning: 'en' },
        languagePairId: 7,
      } as unknown as CourseWithPrograms);

      const result = await service.getById('12');

      expect(getByIdSpy).toHaveBeenCalledWith('12');
      expect(result.languagePair).toEqual({ known: 'ru', learning: 'en' });
      expect((result as unknown as { languagePairId?: number }).languagePairId).toBe(7);
    });

    it('does not fetch the full course when the journey already has languagePair', async () => {
      const journeyCourse = {
        id: '12',
        title: 'Test',
        slug: '',
        description: '',
        authorId: '1',
        languagePair: { known: 'ru', learning: 'en' },
        programIds: [],
        published: true,
        updatedAt: '',
        programs: [],
      } as unknown as CourseWithPrograms;
      vi.spyOn(apiService, 'getJourney').mockResolvedValue(journeyCourse);
      const getByIdSpy = vi.spyOn(apiService, 'getById');

      await service.getById('12');

      expect(getByIdSpy).not.toHaveBeenCalled();
    });

    it('keeps the journey response when language pair enrichment fails', async () => {
      const journeyCourse = {
        id: '12',
        title: 'Test',
        slug: '',
        description: '',
        authorId: '1',
        programIds: [],
        published: true,
        updatedAt: '',
        programs: [],
      } as unknown as CourseWithPrograms;
      vi.spyOn(apiService, 'getJourney').mockResolvedValue(journeyCourse);
      vi.spyOn(apiService, 'getById').mockRejectedValue(new Error('course fetch failed'));

      const result = await service.getById('12');

      expect(result.programs).toEqual([]);
      expect(result.languagePair).toBeUndefined();
    });

    it('falls back to CoursesApiService.getById and keeps normalised metadata when journey fails', async () => {
      const journeyCourse = {
        id: '12',
        title: 'Test',
        slug: '',
        description: '',
        authorId: '1',
        languagePair: { known: 'ru', learning: 'en' },
        programIds: [],
        published: true,
        updatedAt: '',
        programs: [],
      };
      vi.spyOn(apiService, 'getJourney').mockRejectedValue(new Error('journey failed'));

      const baseCourse = {
        ...journeyCourse,
        description: 'Backend description',
        authoring: { idea: 'Idea', status: 'failed' },
        practiceSettings: { mode: 'open' },
      };
      const getByIdSpy = vi
        .spyOn(apiService, 'getById')
        .mockResolvedValue(baseCourse as CourseWithPrograms);

      const programsApi = TestBed.inject(ProgramsApiService);
      vi.spyOn(programsApi, 'getByCourse').mockResolvedValue([]);

      const result = await service.getById('12');

      expect(getByIdSpy).toHaveBeenCalledWith('12');
      expect(result.description).toBe('Backend description');
      expect(result.authoring).toEqual({ idea: 'Idea', status: 'failed' });
      expect(result.programs).toEqual([]);
    });
  });

  describe('resolveCourseId', () => {
    const setMockMode = (enabled: boolean) => {
      (service as unknown as { coursesMockEnabled: boolean }).coursesMockEnabled = enabled;
    };

    it('passes numeric IDs through regardless of mock mode', async () => {
      setMockMode(false);

      await expect(service.resolveCourseId('42')).resolves.toBe('42');
    });

    it('passes seed string IDs through in mock mode', async () => {
      setMockMode(true);

      await expect(service.resolveCourseId('course-cpp-complete')).resolves.toBe(
        'course-cpp-complete',
      );
    });

    it('does not load the ID resolution map in mock mode', async () => {
      setMockMode(true);

      await service.resolveCourseId('course-cpp-complete');

      const internal = service as unknown as {
        idResolutionCache: Map<string, string> | null;
      };
      expect(internal.idResolutionCache).toBeNull();
    });
  });

  describe('getByIdOrNull', () => {
    it('fetches a course by seed slug in mock mode', async () => {
      (service as unknown as { coursesMockEnabled: boolean }).coursesMockEnabled = true;
      const mockCourse = {
        id: 'course-cpp-complete',
        title: 'C++',
        slug: 'cpp-complete',
        description: '',
        authorId: 'user-1',
        languagePair: { known: 'en', learning: 'ru' },
        programIds: [],
        published: true,
        updatedAt: new Date().toISOString(),
        programs: [],
      };
      const spy = vi
        .spyOn(apiService, 'getById')
        .mockResolvedValue(mockCourse as CourseWithPrograms);

      await expect(service.getByIdOrNull('course-cpp-complete')).resolves.toEqual(mockCourse);
      expect(spy).toHaveBeenCalledWith('course-cpp-complete');
    });
  });

  describe('create', () => {
    it('delegates to CoursesApiService.create', async () => {
      const mockCourse = {
        id: 'new-course',
        title: 'New',
        slug: 'new',
        description: '',
        authorId: 'user-1',
        languagePair: { known: 'en', learning: 'zh' },
        programIds: [],
        published: false,
        updatedAt: new Date().toISOString(),
        programs: [],
      };
      const spy = vi
        .spyOn(apiService, 'create')
        .mockResolvedValue(mockCourse as CourseWithPrograms);

      await service.create({
        title: 'New Course',
        description: '',
        published: false,
        programs: [],
      });

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const payload = {
      title: 'Updated',
      description: '',
      published: true,
      programs: [],
    };

    const mockCourse = {
      id: '42',
      title: 'Updated',
      slug: 'updated',
      description: '',
      authorId: 'user-1',
      languagePair: { known: 'en', learning: 'zh' },
      programIds: [],
      published: true,
      updatedAt: new Date().toISOString(),
      programs: [],
    };

    it('passes numeric IDs through to CoursesApiService.update', async () => {
      const spy = vi
        .spyOn(apiService, 'update')
        .mockResolvedValue(mockCourse as CourseWithPrograms);

      await service.update('42', payload);

      expect(spy).toHaveBeenCalledWith('42', payload);
    });

    it('resolves slug IDs to numeric IDs against the real backend', async () => {
      // Emulate the real backend (mock mode disabled)
      (service as unknown as { coursesMockEnabled: boolean }).coursesMockEnabled = false;
      vi.spyOn(service, 'resolveCourseId').mockResolvedValue('42');
      const spy = vi
        .spyOn(apiService, 'update')
        .mockResolvedValue(mockCourse as CourseWithPrograms);

      await service.update('course-zh-radicals-214', payload);

      expect(spy).toHaveBeenCalledWith('42', payload);
    });

    it('passes slugs through when the mock backend serves courses', async () => {
      (service as unknown as { coursesMockEnabled: boolean }).coursesMockEnabled = true;
      const spy = vi
        .spyOn(apiService, 'update')
        .mockResolvedValue(mockCourse as CourseWithPrograms);

      await service.update('course-1', payload);

      expect(spy).toHaveBeenCalledWith('course-1', payload);
    });

    it('throws when a slug cannot be resolved against the real backend', async () => {
      (service as unknown as { coursesMockEnabled: boolean }).coursesMockEnabled = false;
      vi.spyOn(service, 'resolveCourseId').mockResolvedValue(null);
      const spy = vi
        .spyOn(apiService, 'update')
        .mockResolvedValue(mockCourse as CourseWithPrograms);

      await expect(service.update('unknown-course', payload)).rejects.toThrow(
        'Course not found: unknown-course',
      );
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('passes numeric IDs through to CoursesApiService.delete', async () => {
      const spy = vi.spyOn(apiService, 'delete').mockResolvedValue(undefined);

      await service.delete('42');

      expect(spy).toHaveBeenCalledWith('42');
    });

    it('resolves slug IDs to numeric IDs against the real backend', async () => {
      (service as unknown as { coursesMockEnabled: boolean }).coursesMockEnabled = false;
      vi.spyOn(service, 'resolveCourseId').mockResolvedValue('42');
      const spy = vi.spyOn(apiService, 'delete').mockResolvedValue(undefined);

      await service.delete('course-zh-radicals-214');

      expect(spy).toHaveBeenCalledWith('42');
    });
  });

  describe('findUsingScenario', () => {
    it('delegates to CoursesApiService.findUsingScenario', async () => {
      const mockEntries: CourseIndexEntry[] = [
        {
          id: 'c1',
          title: 'Test',
          slug: 'test',
          authorId: 'u1',
          programCount: 0,
          published: true,
          updatedAt: '',
          languagePairSummary: '',
          knownLanguage: 'ru',
          learningLanguage: 'en',
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
