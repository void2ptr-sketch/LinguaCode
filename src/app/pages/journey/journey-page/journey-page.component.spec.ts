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
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import type { CourseWithPrograms, Lesson } from '../../../entities/course/model';
import type { JourneyLocationNode } from '../../../entities/learning/model';
import type { Scenario } from '../../../entities/scenario/model';
import { UserPreferencesSyncService } from '../../../entities/user/services/user-preferences-sync.service';
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
    slug: id,
    description: '',
    authorId: 'author-1',
    languagePair: { known: 'ru', learning: 'zh' },
    programIds: programs.map((p) => p.id),
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    programs,
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

  let mockDashboardService: Partial<LearningDashboardService>;
  let mockAnalyticsService: Partial<JourneyAnalyticsService>;
  let mockResultsStore: Partial<LearningResultsStore>;
  let mockScenariosApi: Partial<ScenariosApiService>;
  let mockCourseSearchService: { getById: ReturnType<typeof vi.fn> };
  let mockActivatedRoute: Partial<ActivatedRoute>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockPrefsSync: UserPreferencesSyncService;

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
        const mockScenario: Scenario = {
          id: scenarioId,
          title: `Scenario ${scenarioId}`,
          description: '',
          cardSource: { mode: 'fixed', cardIds: ['card-1', 'card-2', 'card-3'] },
          authorId: 'author-1',
          published: true,
          updatedAt: '2024-01-01T00:00:00.000Z',
        };
        return Promise.resolve(mockScenario);
      }),
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

    mockPrefsSync = {
      selectedCourseId: signal<string | null>(null),
    } as unknown as UserPreferencesSyncService;

    await TestBed.configureTestingModule({
      imports: [JourneyPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LearningDashboardService, useValue: mockDashboardService },
        { provide: JourneyAnalyticsService, useValue: mockAnalyticsService },
        { provide: LearningResultsStore, useValue: mockResultsStore },
        { provide: ScenariosApiService, useValue: mockScenariosApi },
        { provide: CourseSearchService, useValue: mockCourseSearchService },
        { provide: AppLoggerService, useValue: mockLogger },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: UserPreferencesSyncService, useValue: mockPrefsSync },
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

  it('should build nodes without loading scenarios or cards from API', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const nodes = component.nodes();
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThan(0);

    // Nodes are built from course data only (lesson.scenarioIds)
    // without fetching scenarios or cards from the API.
    expect(nodes[0].scenarioId).toBeDefined();
    expect(typeof nodes[0].title).toBe('string');
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

  it('should navigate to cards/select on location select', async () => {
    const firstNode = component.nodes()[0];
    expect(firstNode).toBeDefined();

    await component.onLocationSelect(firstNode.id!);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/cards/select'], {
      queryParams: {
        courseId: firstNode.courseId,
        lessonId: firstNode.lessonId,
        scenarioId: firstNode.scenarioId,
      },
    });
  });

  it('should lazy-load scenario and update cardCount on location select', async () => {
    const firstNode = component.nodes()[0];
    expect(firstNode.cardCount).toBe(0); // initially 0

    await component.onLocationSelect(firstNode.id!);

    expect(mockScenariosApi.getById).toHaveBeenCalledWith(firstNode.scenarioId);

    // Node should be updated with cardCount from scenario
    const updatedNodes = component.nodes();
    const updatedNode = updatedNodes.find((n) => n.id === firstNode.id);
    expect(updatedNode).toBeDefined();
    expect(updatedNode!.cardCount).toBe(3); // mock scenario has 3 cardIds
  });

  it('should ignore unknown node id in onLocationSelect', () => {
    expect(() => component.onLocationSelect('node-unknown')).not.toThrow();
  });

  it('should set loading to false after initialization', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.loading()).toBe(false);
  });

  it('should default to the dashboard course without a query param', async () => {
    // Без query-параметра и без выбранного курса из профиля компонент
    // берёт курс из dashboard (mockDashboardService.course = signal(mockCourse)).
    (mockActivatedRoute.queryParams as BehaviorSubject<Record<string, string>>).next({});
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.courseId()).toBe('course-1');
    expect(mockCourseSearchService.getById).toHaveBeenCalledWith('course-1');
    expect(component.nodes().length).toBeGreaterThan(0);
    expect(component.nodes()[0]?.courseId).toBe('course-1');
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
