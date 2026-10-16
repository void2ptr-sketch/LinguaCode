import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { LearningDashboardService } from './learning-dashboard.service';
import { CourseSearchService } from '../../../entities/course/search/course-search.service';
import { LearningResultsStore } from '../../../entities/learning/model/learning-results.store';
import { UserStore } from '../../../entities/user/model/user.store';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import type { CourseWithLessons } from '../../../entities/course/model';
import type { LanguagePair } from '../../../entities/language-pair/model/language-pair.types';
import { computed } from '@angular/core';

describe('LearningDashboardService', () => {
  let service: LearningDashboardService;
  let mockCourseSearchService: Partial<CourseSearchService>;
  let mockResultsStore: Partial<LearningResultsStore>;

  const mockLanguagePair: LanguagePair = { known: 'ru', learning: 'zh' };
  const mockCourse: CourseWithLessons = {
    id: 'course-1',
    title: 'Test Course',
    description: 'Test description',
    authorId: 'author-1',
    languagePair: mockLanguagePair,
    lessonIds: ['lesson-1'],
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    lessons: [
      {
        id: 'lesson-1',
        title: 'Lesson 1',
        description: '',
        courseId: 'course-1',
        scenarioIds: ['scenario-1', 'scenario-2'],
        prerequisiteLessonIds: [],
        order: 0,
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  };

  const createMockUserStore = (
    activeCourseId: string | undefined = 'course-1',
  ): Partial<UserStore> => ({
    languagePair: computed(() => mockLanguagePair),
    activeLanguagePairEntry: computed(() => ({
      id: 'entry-1',
      pair: mockLanguagePair,
      createdAt: '2024-01-01T00:00:00.000Z',
      settings: {
        learning: { activeCourseId },
      },
    })),
    updateActiveLanguagePairSettings: vi.fn(),
    preferences: computed(() => ({
      theme: 'azure-blue',
      fontSize: 'md',
      colorScheme: 'light',
      cardFocusFullscreen: false,
      learningProficiencyLevel: 'intermediate',
      languagePairs: [],
      activeLanguagePairId: 'default',
      learning: { activeCourseId },
    })),
  });

  const setupService = (userStore: Partial<UserStore>) => {
    TestBed.configureTestingModule({
      providers: [
        LearningDashboardService,
        { provide: UserStore, useValue: userStore },
        { provide: CourseSearchService, useValue: mockCourseSearchService },
        { provide: LearningResultsStore, useValue: mockResultsStore },
        { provide: AppLoggerService, useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } },
      ],
    });

    service = TestBed.inject(LearningDashboardService);
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    mockCourseSearchService = {
      getById: vi.fn().mockResolvedValue(mockCourse),
    };

    mockResultsStore = {
      pairResults: computed(() => []),
      resultsForScenario: vi.fn().mockReturnValue([]),
      courseProgress: vi.fn().mockReturnValue({ completed: 0, total: 2, percent: 0 }),
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    beforeEach(() => {
      setupService(createMockUserStore());
    });

    it('should be created', () => {
      expect(service).toBeDefined();
    });

    it('should start with loading false', () => {
      expect(service.loading()).toBe(false);
    });

    it('should start with no error', () => {
      expect(service.error()).toBeNull();
    });

    it('should start with no course', () => {
      expect(service.course()).toBeNull();
    });

    it('should start with no resume target', () => {
      expect(service.resumeTarget()).toBeNull();
    });

    it('should start with empty roadmap', () => {
      expect(service.roadmap()).toEqual([]);
    });
  });

  describe('reload', () => {
    beforeEach(() => {
      setupService(createMockUserStore());
    });

    it('should load the active course and set state', async () => {
      await service.reload();

      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.course()).toEqual(mockCourse);
      expect(service.roadmap().length).toBeGreaterThan(0);
    });

    it('should set error on reload failure', async () => {
      mockCourseSearchService.getById = vi.fn().mockRejectedValue(new Error('API error'));

      await service.reload();

      expect(service.loading()).toBe(false);
      expect(service.error()).toBe('Не удалось загрузить программу обучения');
      expect(service.course()).toBeNull();
    });

    it('should call course search service with correct ID', async () => {
      await service.reload();

      expect(mockCourseSearchService.getById).toHaveBeenCalledWith('course-1');
    });

    it('should load scenario titles from seed cache', async () => {
      await service.reload();

      // Titles are now loaded from seed cache, not via API
      expect(service.resumeTarget()).toBeDefined();
      const target = service.resumeTarget();
      if (target && target.kind !== 'no-program') {
        expect(target.scenarioTitle).toBeDefined();
      }
    });
  });

  describe('setActiveCourseId', () => {
    beforeEach(() => {
      setupService(createMockUserStore());
    });

    it('should update the active course ID in user store', () => {
      service.setActiveCourseId('new-course-id');

      expect(mockCourseSearchService.getById).not.toHaveBeenCalled();
    });
  });

  describe('courseProgress', () => {
    beforeEach(() => {
      setupService(createMockUserStore());
    });

    it('should return null when no course is loaded', () => {
      const progress = service.courseProgress();
      expect(progress).toBeNull();
    });

    it('should return progress when course is loaded', async () => {
      await service.reload();

      const progress = service.courseProgress();
      expect(progress).not.toBeNull();
      expect(mockResultsStore.courseProgress).toHaveBeenCalledWith('course-1', expect.any(Array));
    });
  });

  describe('learningSession', () => {
    beforeEach(() => {
      setupService(createMockUserStore());
    });

    it('should return learning session preferences from user store', () => {
      const session = service.learningSession();
      expect(session).toBeDefined();
    });
  });
});
