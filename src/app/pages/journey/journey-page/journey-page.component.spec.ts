import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { JourneyPageComponent } from './journey-page.component';
import { LearningDashboardService } from '../../../entities/learning/services';
import { JourneyAnalyticsService } from '../../../features/journey/services/journey-analytics.service';
import { LearningResultsStore } from '../../../entities/learning/model/learning-results.store';
import { CourseSearchService } from '../../../entities/course';
import { ScenariosApiService } from '../../../entities/scenario/api/scenarios-api.service';
import { CardsApiService } from '../../../entities/card/api/cards-api.service';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { CPP_COMPLETE_COURSE_ID } from '../../../entities/course/model';
import type { CourseWithPrograms, Lesson } from '../../../entities/course/model';
import type { Scenario } from '../../../entities/scenario/model';
import type { JourneyLocationNode } from '../../../entities/learning/model';
import type { CardBase } from '../../../entities/card/model';
function makeLesson(
  id: string,
  title: string,
  scenarioIds: string[],
  prerequisiteLessonIds: string[] = [],
  order = 0,
): Lesson {
  return {
    id,
    title,
    description: '',
    programId: 'program-1',
    scenarioIds,
    prerequisiteLessonIds,
    order,
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

function makeCourse(
  id: string,
  title: string,
  programs: import('../../../entities/program/model/program.types').ProgramWithLessons[],
): CourseWithPrograms {
  return {
    id,
    title,
    description: '',
    authorId: 'author-1',
    languagePair: { known: 'ru', learning: 'zh' },
    programIds: programs.map((p) => p.id),
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    programs,
  };
}

function makeScenario(id: string, title: string, cardIds: string[]): Scenario {
  return {
    id,
    title,
    description: '',
    cardSource: { mode: 'fixed', cardIds },
    authorId: 'author-1',
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

describe('JourneyPageComponent', () => {
  let component: JourneyPageComponent;
  let fixture: ComponentFixture<JourneyPageComponent>;

  const mockProgram = {
    id: 'program-1',
    courseId: 'course-1',
    title: 'Program 1',
    description: '',
    lessonIds: ['lesson-1', 'lesson-2'],
    order: 0,
    updatedAt: '2024-01-01T00:00:00.000Z',
    lessons: [
      makeLesson('lesson-1', 'Lesson 1', ['scenario-1', 'scenario-2'], [], 0),
      makeLesson('lesson-2', 'Lesson 2', ['scenario-3'], ['lesson-1'], 1),
    ],
  };

  const mockCourse = makeCourse('course-1', 'Test Course', [mockProgram]);

  const mockScenarios: Scenario[] = [
    makeScenario('scenario-1', 'Scenario 1', ['card-1', 'card-2']),
    makeScenario('scenario-2', 'Scenario 2', ['card-3']),
    makeScenario('scenario-3', 'Scenario 3', ['card-4', 'card-5']),
  ];

  const mockCards: CardBase[] = [
    { id: 'card-1', kind: 'select' } as CardBase,
    { id: 'card-2', kind: 'reading' } as CardBase,
    { id: 'card-3', kind: 'memory' } as CardBase,
    { id: 'card-4', kind: 'keyboard' } as CardBase,
    { id: 'card-5', kind: 'sound' } as CardBase,
  ];

  let mockDashboardService: Partial<LearningDashboardService>;
  let mockAnalyticsService: Partial<JourneyAnalyticsService>;
  let mockResultsStore: Partial<LearningResultsStore>;
  let mockScenariosApi: Partial<ScenariosApiService>;
  let mockCardsApi: Partial<CardsApiService>;
  let mockCourseSearchService: { getById: ReturnType<typeof vi.fn> };
  let mockActivatedRoute: Partial<ActivatedRoute>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDashboardService = {
      course: signal(mockCourse),
      reload: vi.fn(),
    };

    const visitCounts = computed(() => ({
      'scenario-1': 5,
      'scenario-2': 0,
      'scenario-3': 0,
    }));
    mockAnalyticsService = {
      visitCountForScenario: computed(() => {
        const counts = visitCounts();
        return (scenarioId: string) => counts[scenarioId as keyof typeof counts] ?? 0;
      }),
      explorerLevel: computed(() => ({
        level: 'novice' as const,
        totalVisits: 0,
        totalCompleted: 0,
        nextMilestone: { visitsNeeded: 5, completedNeeded: 2 },
      })),
      trackEvent: vi.fn(),
      toggleFavorite: vi.fn(),
      isFavorite: vi.fn().mockReturnValue(false),
      stuckPoints: computed(() => []),
      courseVisitStats: computed(() => () => ({
        totalVisits: 0,
        totalDurationMs: 0,
        avgCompletionPercent: 0,
      })),
      visits: signal([]),
      clear: vi.fn(),
    };

    mockResultsStore = {
      resultsForScenario: vi.fn().mockReturnValue([]),
    };

    mockScenariosApi = {
      getById: vi.fn().mockImplementation((scenarioId: string) => {
        const scenario = mockScenarios.find((s) => s.id === scenarioId);
        return Promise.resolve(scenario || makeScenario(scenarioId, `Scenario ${scenarioId}`, []));
      }),
    };

    mockCardsApi = {
      getByIds: vi.fn().mockResolvedValue(mockCards),
    };

    const mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    mockCourseSearchService = {
      getById: vi.fn().mockImplementation((courseId: string) => {
        const mockProgram = {
          id: 'program-1',
          courseId,
          title: 'Program 1',
          description: '',
          lessonIds: ['lesson-1', 'lesson-2'],
          order: 0,
          updatedAt: '2024-01-01T00:00:00.000Z',
          lessons: [
            makeLesson('lesson-1', 'Lesson 1', ['scenario-1', 'scenario-2'], [], 0),
            makeLesson('lesson-2', 'Lesson 2', ['scenario-3'], ['lesson-1'], 1),
          ],
        };
        return Promise.resolve(makeCourse(courseId, `Course ${courseId}`, [mockProgram]));
      }),
    };

    mockActivatedRoute = {
      queryParams: new BehaviorSubject({ courseId: 'course-1' }),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [JourneyPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LearningDashboardService, useValue: mockDashboardService },
        { provide: JourneyAnalyticsService, useValue: mockAnalyticsService },
        { provide: LearningResultsStore, useValue: mockResultsStore },
        { provide: ScenariosApiService, useValue: mockScenariosApi },
        { provide: CardsApiService, useValue: mockCardsApi },
        { provide: CourseSearchService, useValue: mockCourseSearchService },
        { provide: AppLoggerService, useValue: mockLogger },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JourneyPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', async () => {
    expect(component).toBeTruthy();
  });

  it('should initialize signals correctly', () => {
    expect(component.nodes).toBeDefined();
    expect(component.loading).toBeDefined();
    expect(component.error).toBeDefined();
    expect(component.courseId).toBeDefined();
  });

  it('should call dashboard reload on init', () => {
    expect(mockDashboardService.reload).toHaveBeenCalled();
  });

  it('should set courseId from query params', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.courseId()).toBe('course-1');
  });

  it('should call scenarios API and cards API to build nodes', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockScenariosApi.getById).toHaveBeenCalled();
    expect(mockCardsApi.getByIds).toHaveBeenCalled();
  });

  it('should build nodes from course data', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const nodes = component.nodes();
    expect(Array.isArray(nodes)).toBe(true);

    if (nodes.length > 0) {
      const firstNode = nodes[0] as JourneyLocationNode;
      expect(firstNode.id).toContain('node-');
      expect(typeof firstNode.title).toBe('string');
      expect(['locked', 'available', 'in-progress', 'visited', 'completed']).toContain(
        firstNode.status,
      );
      expect(Array.isArray(firstNode.contentTypes)).toBe(true);
      expect(typeof firstNode.cardCount).toBe('number');
      expect(typeof firstNode.completionPercent).toBe('number');
    }
  });

  it('should navigate to cards/select on location select', () => {
    const firstNode = component.nodes()[0];
    expect(firstNode).toBeDefined();

    component.onLocationSelect(firstNode.id!);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/cards/select'], {
      queryParams: {
        courseId: firstNode.courseId,
        lessonId: firstNode.lessonId,
        scenarioId: firstNode.scenarioId,
      },
    });
  });

  it('should ignore unknown node id in onLocationSelect', () => {
    expect(() => component.onLocationSelect('node-unknown')).not.toThrow();
  });

  it('should set loading to false after initialization', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.loading()).toBe(false);
  });

  it('should default to the C++ Complete Course without a query param', async () => {
    // Без query-параметра карта по умолчанию открывает C++ Complete Course.
    (mockActivatedRoute.queryParams as BehaviorSubject<Record<string, string>>).next({});
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.courseId()).toBe(CPP_COMPLETE_COURSE_ID);
    expect(mockCourseSearchService.getById).toHaveBeenCalledWith(CPP_COMPLETE_COURSE_ID);
    expect(component.nodes().length).toBeGreaterThan(0);
    expect(component.nodes()[0]?.courseId).toBe(CPP_COMPLETE_COURSE_ID);
  });

  it('should load the course from query params when it differs from the dashboard course', async () => {
    (mockActivatedRoute.queryParams as BehaviorSubject<Record<string, string>>).next({
      courseId: 'course-2',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockCourseSearchService.getById).toHaveBeenCalledWith('course-2');
    expect(component.courseId()).toBe('course-2');
    expect(component.nodes().length).toBeGreaterThan(0);
    expect(component.nodes()[0]?.courseId).toBe('course-2');
  });
});
