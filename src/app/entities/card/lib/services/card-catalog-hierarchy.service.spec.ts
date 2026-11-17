import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CardCatalogHierarchyService } from './card-catalog-hierarchy.service';
import { CourseSearchService } from '../../../course/search/course-search.service';
import { LessonsApiService } from '../../../lesson/api/lessons-api.service';
import { ProgramsApiService } from '../../../program/api/programs-api.service';
import { ScenarioSearchService } from '../../../scenario/search/scenario-search.service';
import type { Scenario } from '../../../scenario/model';

describe('CardCatalogHierarchyService', () => {
  let service: CardCatalogHierarchyService;
  let courseSearchServiceMock: Partial<CourseSearchService>;
  let programsApiMock: Partial<ProgramsApiService>;
  let lessonsApiMock: Partial<LessonsApiService>;
  let scenarioSearchServiceMock: Partial<ScenarioSearchService>;

  const mockCourseIndexEntry = {
    id: 'course-1',
    title: 'Test Course',
    authorId: 'author-1',
    programCount: 2,
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    languagePairSummary: 'Русский → English',
  };

  const mockLessons = [
    {
      id: 'lesson-1',
      title: 'Lesson 1',
      description: '',
      programId: 'program-1',
      scenarioIds: ['scenario-1'],
      prerequisiteLessonIds: [],
      order: 0,
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'lesson-2',
      title: 'Lesson 2',
      description: '',
      programId: 'program-1',
      scenarioIds: ['scenario-2', 'scenario-3'],
      prerequisiteLessonIds: ['lesson-1'],
      order: 1,
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockProgram = {
    id: 'program-1',
    courseId: 'course-1',
    title: 'Program 1',
    description: '',
    lessonIds: ['lesson-1', 'lesson-2'],
    order: 0,
    updatedAt: '2024-01-01T00:00:00.000Z',
    lessons: mockLessons,
  };

  const mockScenarios = [
    {
      id: 'scenario-1',
      title: 'Greeting',
      description: '',
      authorId: 'author-1',
      cardSource: { mode: 'fixed', cardIds: [] as readonly string[] },
      published: true,
      updatedAt: '2024-01-01T00:00:00.000Z',
      lessonId: 'lesson-1',
    },
    {
      id: 'scenario-2',
      title: 'Numbers',
      description: '',
      authorId: 'author-1',
      cardSource: { mode: 'fixed', cardIds: [] as readonly string[] },
      published: true,
      updatedAt: '2024-01-01T00:00:00.000Z',
      lessonId: 'lesson-2',
    },
    {
      id: 'scenario-3',
      title: 'Colors',
      description: '',
      authorId: 'author-1',
      cardSource: { mode: 'fixed', cardIds: [] as readonly string[] },
      published: true,
      updatedAt: '2024-01-01T00:00:00.000Z',
      lessonId: 'lesson-2',
    },
  ];

  const mockPaginatedCourses = {
    items: [mockCourseIndexEntry],
    totalItems: 1,
  };

  beforeEach(() => {
    localStorage.clear();

    courseSearchServiceMock = {
      search: vi.fn().mockResolvedValue(mockPaginatedCourses),
      getById: vi.fn().mockResolvedValue({
        ...mockCourseIndexEntry,
        programIds: ['program-1'],
        programs: [mockProgram],
      }),
    };

    programsApiMock = {
      getByCourse: vi.fn().mockResolvedValue([mockProgram]),
      getById: vi.fn().mockResolvedValue(mockProgram),
    };

    lessonsApiMock = {
      getByProgramId: vi.fn().mockResolvedValue(mockLessons),
    };

    scenarioSearchServiceMock = {
      getByLessonId: vi.fn(
        async (lessonId: string): Promise<readonly Scenario[]> =>
          mockScenarios.filter((scenario) => scenario.lessonId === lessonId) as readonly Scenario[],
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        CardCatalogHierarchyService,
        { provide: CourseSearchService, useValue: courseSearchServiceMock },
        { provide: ProgramsApiService, useValue: programsApiMock },
        { provide: LessonsApiService, useValue: lessonsApiMock },
        { provide: ScenarioSearchService, useValue: scenarioSearchServiceMock },
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

    it('should start with programOptionsLoading false', () => {
      expect(service.programOptionsLoading()).toBe(false);
    });

    it('should start with scenariosLoading false', () => {
      expect(service.scenariosLoading()).toBe(false);
    });
  });

  describe('loadCourses', () => {
    it('should load courses filtered by the language pair', async () => {
      const courses = await service.loadCourses('ru', 'en', 'ru-en');

      expect(courses).toHaveLength(1);
      expect(courses[0]).toEqual({ id: 'course-1', title: 'Test Course' });
      expect(courseSearchServiceMock.search).toHaveBeenCalledWith({
        scope: 'published',
        knownLanguage: 'ru',
        learningLanguage: 'en',
        page: { page: 0, pageSize: 100 },
      });
    });

    it('should pass each pair own languages to the search', async () => {
      await service.loadCourses('ru', 'en', 'ru-en');
      await service.loadCourses('en', 'zh', 'en-zh');

      expect(courseSearchServiceMock.search).toHaveBeenNthCalledWith(1, {
        scope: 'published',
        knownLanguage: 'ru',
        learningLanguage: 'en',
        page: { page: 0, pageSize: 100 },
      });
      expect(courseSearchServiceMock.search).toHaveBeenNthCalledWith(2, {
        scope: 'published',
        knownLanguage: 'en',
        learningLanguage: 'zh',
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

  describe('loadAllCourses', () => {
    it('should load all courses without language-pair filters', async () => {
      const courses = await service.loadAllCourses();

      expect(courses).toEqual([{ id: 'course-1', title: 'Test Course' }]);
      expect(courseSearchServiceMock.search).toHaveBeenCalledWith({
        scope: 'all',
        page: { page: 0, pageSize: 100 },
      });
    });

    it('should cache the pair-agnostic course list', async () => {
      const courses1 = await service.loadAllCourses();
      const courses2 = await service.loadAllCourses();

      expect(courses1).toBe(courses2);
      expect(courseSearchServiceMock.search).toHaveBeenCalledTimes(1);
    });

    it('should reload the pair-agnostic list after full cache invalidation', async () => {
      await service.loadAllCourses();
      service.invalidateCache();
      await service.loadAllCourses();

      expect(courseSearchServiceMock.search).toHaveBeenCalledTimes(2);
    });

    it('should keep the pair-agnostic list when invalidating a single pair', async () => {
      await service.loadAllCourses();
      await service.loadCourses('ru', 'en', 'ru-en');

      service.invalidateCache('ru-en');
      await service.loadAllCourses();

      // Only the pair-scoped cache was invalidated.
      expect(courseSearchServiceMock.search).toHaveBeenCalledTimes(2);
    });
  });

  describe('loadLessons', () => {
    it('should load lessons from the dedicated program lessons endpoint', async () => {
      const lessons = await service.loadLessons('program-1');

      expect(lessons).toHaveLength(2);
      expect(lessons[0]).toEqual({ id: 'lesson-1', title: 'Lesson 1' });
      expect(lessons[1]).toEqual({ id: 'lesson-2', title: 'Lesson 2' });
      expect(lessonsApiMock.getByProgramId).toHaveBeenCalledWith('program-1');
      // Lessons must not be read from the program response.
      expect(programsApiMock.getById).not.toHaveBeenCalled();
    });

    it('should cache lessons by program ID', async () => {
      await service.loadLessons('program-1');
      await service.loadLessons('program-1');

      expect(lessonsApiMock.getByProgramId).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadScenarios', () => {
    it('should load scenarios with real titles for a lesson', async () => {
      const scenarios = await service.loadScenarios('lesson-1');

      expect(scenarios).toEqual([{ id: 'scenario-1', title: 'Greeting' }]);
      expect(scenarioSearchServiceMock.getByLessonId).toHaveBeenCalledWith('lesson-1');
    });

    it('should return multiple scenarios for a lesson', async () => {
      const scenarios = await service.loadScenarios('lesson-2');

      expect(scenarios).toEqual([
        { id: 'scenario-2', title: 'Numbers' },
        { id: 'scenario-3', title: 'Colors' },
      ]);
    });

    it('should cache scenarios by lesson ID', async () => {
      await service.loadScenarios('lesson-1');
      await service.loadScenarios('lesson-1');

      expect(scenarioSearchServiceMock.getByLessonId).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when the lesson has no scenarios', async () => {
      const scenarios = await service.loadScenarios('unknown-lesson');

      expect(scenarios).toEqual([]);
    });
  });

  describe('loadProgramOptions', () => {
    it('should load program options for a course', async () => {
      const options = await service.loadProgramOptions('course-1');

      expect(options).toHaveLength(1);
      expect(options[0]).toEqual({ id: 'program-1', title: 'Program 1' });
      expect(programsApiMock.getByCourse).toHaveBeenCalledWith('course-1');
    });

    it('should cache program options by course ID', async () => {
      await service.loadProgramOptions('course-1');
      await service.loadProgramOptions('course-1');

      expect(programsApiMock.getByCourse).toHaveBeenCalledTimes(1);
    });

    it('should reuse programs cache from loadPrograms', async () => {
      await service.loadPrograms('course-1');
      const options = await service.loadProgramOptions('course-1');

      expect(options).toHaveLength(1);
      expect(programsApiMock.getByCourse).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateCache', () => {
    it('should clear all caches when called without arguments', async () => {
      await service.loadCourses('ru', 'en', 'ru-en');
      await service.loadLessons('program-1');

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

    it('should clear the lesson and scenario caches on full invalidation', async () => {
      await service.loadLessons('program-1');
      await service.loadScenarios('lesson-1');

      service.invalidateCache();

      await service.loadLessons('program-1');
      await service.loadScenarios('lesson-1');

      expect(lessonsApiMock.getByProgramId).toHaveBeenCalledTimes(2);
      expect(scenarioSearchServiceMock.getByLessonId).toHaveBeenCalledTimes(2);
    });
  });
});
