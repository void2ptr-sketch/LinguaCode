import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CardCatalogHierarchyService } from './card-catalog-hierarchy.service';
import { CourseSearchService } from '../../../../core/data/courses/course-search.service';

describe('CardCatalogHierarchyService', () => {
  let service: CardCatalogHierarchyService;
  let courseSearchServiceMock: Partial<CourseSearchService>;

  const mockCourseIndexEntry = {
    id: 'course-1',
    title: 'Test Course',
    authorId: 'author-1',
    lessonCount: 2,
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    languagePairSummary: 'Русский → English',
  };

  const mockCourseWithLessons = {
    id: 'course-1',
    title: 'Test Course',
    authorId: 'author-1',
    lessonCount: 2,
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    languagePairSummary: 'Русский → English',
    lessons: [
      {
        id: 'lesson-1',
        title: 'Lesson 1',
        description: '',
        courseId: 'course-1',
        scenarioIds: ['scenario-1'],
        prerequisiteLessonIds: [],
        order: 0,
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'lesson-2',
        title: 'Lesson 2',
        description: '',
        courseId: 'course-1',
        scenarioIds: ['scenario-2', 'scenario-3'],
        prerequisiteLessonIds: ['lesson-1'],
        order: 1,
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  };

  const mockPaginatedCourses = {
    items: [mockCourseIndexEntry],
    totalItems: 1,
  };

  beforeEach(() => {
    localStorage.clear();

    courseSearchServiceMock = {
      search: vi.fn().mockResolvedValue(mockPaginatedCourses),
      getById: vi.fn().mockResolvedValue(mockCourseWithLessons),
    };

    TestBed.configureTestingModule({
      providers: [
        CardCatalogHierarchyService,
        { provide: CourseSearchService, useValue: courseSearchServiceMock },
      ],
    });

    service = TestBed.inject(CardCatalogHierarchyService);
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeDefined();
    });

    it('should start with coursesLoading false', () => {
      expect(service.coursesLoading()).toBe(false);
    });

    it('should start with lessonsLoading false', () => {
      expect(service.lessonsLoading()).toBe(false);
    });
  });

  describe('loadCourses', () => {
    it('should load courses from search service', async () => {
      const courses = await service.loadCourses('ru', 'en', 'ru-en');

      expect(courses).toHaveLength(1);
      expect(courses[0]).toEqual({ id: 'course-1', title: 'Test Course' });
      expect(courseSearchServiceMock.search).toHaveBeenCalledWith({
        knownLanguage: 'ru',
        learningLanguage: 'en',
        scope: 'published',
        page: { page: 0, pageSize: 100 },
      });
    });

    it('should cache courses by language pair key', async () => {
      const courses1 = await service.loadCourses('ru', 'en', 'ru-en');
      const courses2 = await service.loadCourses('ru', 'en', 'ru-en');

      expect(courses1).toBe(courses2);
      expect(courseSearchServiceMock.search).toHaveBeenCalledTimes(1);
    });

    it('should not share cache between different language pairs', async () => {
      await service.loadCourses('ru', 'en', 'ru-en');
      await service.loadCourses('en', 'zh', 'en-zh');

      expect(courseSearchServiceMock.search).toHaveBeenCalledTimes(2);
    });
  });

  describe('loadLessons', () => {
    it('should load lessons from course', async () => {
      const lessons = await service.loadLessons('course-1');

      expect(lessons).toHaveLength(2);
      expect(lessons[0]).toEqual({ id: 'lesson-1', title: 'Lesson 1' });
      expect(lessons[1]).toEqual({ id: 'lesson-2', title: 'Lesson 2' });
    });

    it('should cache lessons by course ID', async () => {
      await service.loadLessons('course-1');
      await service.loadLessons('course-1');

      expect(courseSearchServiceMock.getById).toHaveBeenCalledTimes(1);
    });
  });

  describe('getScenariosForLesson', () => {
    it('should return scenario options for a lesson', async () => {
      await service.loadLessons('course-1');

      const scenarios = service.getScenariosForLesson('course-1', 'lesson-1');

      expect(scenarios).toHaveLength(1);
      expect(scenarios[0]).toEqual({ id: 'scenario-1', title: 'scenario-1' });
    });

    it('should return empty array for unknown course', () => {
      const scenarios = service.getScenariosForLesson('unknown-course', 'lesson-1');
      expect(scenarios).toEqual([]);
    });

    it('should return empty array for unknown lesson', async () => {
      await service.loadLessons('course-1');

      const scenarios = service.getScenariosForLesson('course-1', 'unknown-lesson');
      expect(scenarios).toEqual([]);
    });

    it('should return multiple scenarios for a lesson', async () => {
      await service.loadLessons('course-1');

      const scenarios = service.getScenariosForLesson('course-1', 'lesson-2');
      expect(scenarios).toHaveLength(2);
      expect(scenarios[0].id).toBe('scenario-2');
      expect(scenarios[1].id).toBe('scenario-3');
    });
  });

  describe('invalidateCache', () => {
    it('should clear all caches when called without arguments', async () => {
      await service.loadCourses('ru', 'en', 'ru-en');
      await service.loadLessons('course-1');

      service.invalidateCache();

      // After invalidation, loading should trigger new API calls
      await service.loadCourses('ru', 'en', 'ru-en');
      expect(courseSearchServiceMock.search).toHaveBeenCalledTimes(2);
    });

    it('should clear only specific language pair cache', async () => {
      await service.loadCourses('ru', 'en', 'ru-en');
      await service.loadCourses('en', 'zh', 'en-zh');

      service.invalidateCache('ru-en');

      // Loading ru-en should trigger new API call
      await service.loadCourses('ru', 'en', 'ru-en');
      expect(courseSearchServiceMock.search).toHaveBeenCalledTimes(3);

      // Loading en-zh should use cache
      await service.loadCourses('en', 'zh', 'en-zh');
      expect(courseSearchServiceMock.search).toHaveBeenCalledTimes(3);
    });
  });
});
