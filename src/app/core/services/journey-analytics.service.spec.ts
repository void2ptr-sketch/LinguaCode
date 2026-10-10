import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { JourneyAnalyticsService } from './journey-analytics.service';
import { UserStore } from '../state/user.store';
import type { JourneyAnalyticsEvent, JourneyLocationNode } from '../models/journey.types';
import type { UserPreferences } from '../models/user.types';

describe('JourneyAnalyticsService', () => {
  let service: JourneyAnalyticsService;

  const createMockPreferences = (): UserPreferences => ({
    theme: 'azure-blue',
    fontSize: 'md',
    colorScheme: 'light',
    cardFocusFullscreen: false,
    learningProficiencyLevel: 'intermediate',
    languagePairs: [],
    activeLanguagePairId: 'default',
  });

  const mockUserStore: Partial<UserStore> = {
    preferences: computed(() => createMockPreferences()),
  };

  const createVisitEvent = (
    kind: JourneyAnalyticsEvent['kind'],
    extra: Record<string, string | number> = {},
  ): JourneyAnalyticsEvent => {
    const base = {
      scenarioId: 'scenario-1',
      lessonId: 'lesson-1',
      courseId: 'course-1',
    };

    switch (kind) {
      case 'visit':
        return { ...base, kind: 'visit', timestamp: '2024-01-01T00:00:00.000Z', ...extra } as JourneyAnalyticsEvent;
      case 'duration':
        return { ...base, kind: 'duration', durationMs: 120000, ...extra } as JourneyAnalyticsEvent;
      case 'complete':
        return { ...base, kind: 'complete', completionPercent: 100, ...extra } as JourneyAnalyticsEvent;
    }
  };

  const createLocationNode = (overrides: Partial<JourneyLocationNode> = {}): JourneyLocationNode => ({
    id: 'node-1',
    title: 'Test Scenario',
    description: 'Test description',
    cardCount: 10,
    order: 1,
    status: 'available',
    lessonId: 'lesson-1',
    lessonTitle: 'Lesson 1',
    courseId: 'course-1',
    courseTitle: 'Course 1',
    completionPercent: 0,
    visited: false,
    favorite: false,
    blockReason: null,
    scenarioId: 'scenario-1',
    contentTypes: ['theory'],
    ...overrides,
  });

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        JourneyAnalyticsService,
        { provide: UserStore, useValue: mockUserStore },
      ],
    });

    service = TestBed.inject(JourneyAnalyticsService);
  });

  afterEach(() => {
    service.clear();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeDefined();
    });

    it('should return empty visits initially', () => {
      expect(service.visits()).toEqual([]);
    });

    it('should return zero visit count for any scenario', () => {
      expect(service.visitCountForScenario()('scenario-1')).toBe(0);
    });

    it('should return zero course stats initially', () => {
      const stats = service.courseVisitStats()('course-1');
      expect(stats).toEqual({ totalVisits: 0, totalDurationMs: 0, avgCompletionPercent: 0 });
    });

    it('should return empty stuck points initially', () => {
      expect(service.stuckPoints()).toEqual([]);
    });

    it('should return novice level initially', () => {
      const level = service.explorerLevel();
      expect(level.level).toBe('novice');
      expect(level.totalVisits).toBe(0);
      expect(level.totalCompleted).toBe(0);
    });
  });

  describe('trackEvent - visit', () => {
    it('should add a new visit record', () => {
      const event = createVisitEvent('visit');
      service.trackEvent(event);

      const visits = service.visits();
      expect(visits).toHaveLength(1);
      expect(visits[0].scenarioId).toBe('scenario-1');
      expect(visits[0].lessonId).toBe('lesson-1');
      expect(visits[0].courseId).toBe('course-1');
      expect(visits[0].durationMs).toBe(0);
      expect(visits[0].completionPercent).toBe(0);
    });

    it('should update existing visit timestamp', () => {
      const event1 = createVisitEvent('visit');
      const event2 = { ...event1, timestamp: '2024-01-02T00:00:00.000Z' } as JourneyAnalyticsEvent;

      service.trackEvent(event1);
      service.trackEvent(event2);

      expect(service.visits()).toHaveLength(1);
    });

    it('should track visits for different scenarios separately', () => {
      const event1 = createVisitEvent('visit');
      const event2 = { ...event1, scenarioId: 'scenario-2' } as JourneyAnalyticsEvent;

      service.trackEvent(event1);
      service.trackEvent(event2);

      expect(service.visits()).toHaveLength(2);
      expect(service.visitCountForScenario()('scenario-1')).toBe(1);
      expect(service.visitCountForScenario()('scenario-2')).toBe(1);
    });
  });

  describe('trackEvent - duration', () => {
    it('should add duration to existing visit', () => {
      service.trackEvent(createVisitEvent('visit'));
      service.trackEvent(createVisitEvent('duration'));

      const visits = service.visits();
      expect(visits[0].durationMs).toBe(120000);
    });

    it('should accumulate duration across multiple events', () => {
      service.trackEvent(createVisitEvent('visit'));
      service.trackEvent(createVisitEvent('duration'));
      service.trackEvent(createVisitEvent('duration'));

      const visits = service.visits();
      expect(visits[0].durationMs).toBe(240000);
    });

    it('should not affect visits for different scenarios', () => {
      service.trackEvent(createVisitEvent('visit'));
      const differentEvent = { ...createVisitEvent('visit'), scenarioId: 'scenario-2' } as JourneyAnalyticsEvent;
      service.trackEvent(differentEvent as JourneyAnalyticsEvent);
      service.trackEvent(createVisitEvent('duration'));

      const visits = service.visits();
      expect(visits[0].durationMs).toBe(120000);
      expect(visits[1].durationMs).toBe(0);
    });
  });

  describe('trackEvent - complete', () => {
    it('should update completion percentage', () => {
      service.trackEvent(createVisitEvent('visit'));
      service.trackEvent(createVisitEvent('complete'));

      const visits = service.visits();
      expect(visits[0].completionPercent).toBe(100);
    });

    it('should update completion for partial completion', () => {
      const partialEvent = { ...createVisitEvent('visit'), kind: 'complete', completionPercent: 75 } as JourneyAnalyticsEvent;
      service.trackEvent(createVisitEvent('visit'));
      service.trackEvent(partialEvent);

      const visits = service.visits();
      expect(visits[0].completionPercent).toBe(75);
    });
  });

  describe('visitCountForScenario', () => {
    it('should count visits correctly', () => {
      const event1 = createVisitEvent('visit');
      const event2 = { ...event1, scenarioId: 'scenario-1', courseId: 'course-2' } as JourneyAnalyticsEvent;
      const event3 = { ...event1, scenarioId: 'scenario-1', courseId: 'course-3' } as JourneyAnalyticsEvent;

      service.trackEvent(event1);
      service.trackEvent(event2);
      service.trackEvent(event3);

      expect(service.visitCountForScenario()('scenario-1')).toBe(3);
      expect(service.visitCountForScenario()('unknown')).toBe(0);
    });
  });

  describe('courseVisitStats', () => {
    it('should compute correct stats for a course', () => {
      service.trackEvent(createVisitEvent('visit'));
      service.trackEvent(createVisitEvent('duration'));
      service.trackEvent(createVisitEvent('complete'));

      const stats = service.courseVisitStats()('course-1');
      expect(stats.totalVisits).toBe(1);
      expect(stats.totalDurationMs).toBe(120000);
      expect(stats.avgCompletionPercent).toBe(100);
    });

    it('should aggregate stats across multiple visits', () => {
      service.trackEvent(createVisitEvent('visit'));
      service.trackEvent(createVisitEvent('duration'));

      const secondEvent = { ...createVisitEvent('visit'), scenarioId: 'scenario-2' } as JourneyAnalyticsEvent;
      service.trackEvent(secondEvent);
      service.trackEvent(createVisitEvent('duration'));

      const stats = service.courseVisitStats()('course-1');
      expect(stats.totalVisits).toBe(2);
      expect(stats.totalDurationMs).toBe(240000);
      expect(stats.avgCompletionPercent).toBe(0);
    });
  });

  describe('stuckPoints', () => {
    it('should identify stuck points with low completion', () => {
      service.trackEvent(createVisitEvent('visit'));
      const partialEvent = { ...createVisitEvent('visit'), kind: 'complete', completionPercent: 30 } as JourneyAnalyticsEvent;
      service.trackEvent(partialEvent);

      const stuck = service.stuckPoints();
      expect(stuck.length).toBeGreaterThan(0);
      expect(stuck[0].scenarioId).toBe('scenario-1');
    });

    it('should identify stuck points with high duration', () => {
      service.trackEvent(createVisitEvent('visit'));
      const longDurationEvent = { scenarioId: 'scenario-1', lessonId: 'lesson-1', courseId: 'course-1', kind: 'duration', durationMs: 400000 } as JourneyAnalyticsEvent;
      service.trackEvent(longDurationEvent);

      const stuck = service.stuckPoints();
      expect(stuck.length).toBeGreaterThan(0);
      expect(stuck[0].totalDuration).toBeGreaterThan(5 * 60 * 1000);
    });

    it('should not flag normal visits', () => {
      service.trackEvent(createVisitEvent('visit'));
      service.trackEvent(createVisitEvent('duration'));
      const completeEvent = { ...createVisitEvent('visit'), kind: 'complete', completionPercent: 100 } as JourneyAnalyticsEvent;
      service.trackEvent(completeEvent);

      const stuck = service.stuckPoints();
      expect(stuck).toEqual([]);
    });
  });

  describe('explorerLevel', () => {
    it('should stay novice with few visits', () => {
      service.trackEvent(createVisitEvent('visit'));
      expect(service.explorerLevel().level).toBe('novice');
    });

    it('should advance to experienced with sufficient visits and completions', () => {
      for (let i = 0; i < 5; i++) {
        const visitEvent = { ...createVisitEvent('visit'), scenarioId: `scenario-${i}` } as JourneyAnalyticsEvent;
        service.trackEvent(visitEvent);
        const completeEvent = { ...visitEvent, kind: 'complete', completionPercent: 100 } as JourneyAnalyticsEvent;
        service.trackEvent(completeEvent);
      }

      expect(service.explorerLevel().level).toBe('experienced');
    });

    it('should advance to expert with high activity', () => {
      for (let i = 0; i < 20; i++) {
        const visitEvent = { ...createVisitEvent('visit'), scenarioId: `scenario-${i}` } as JourneyAnalyticsEvent;
        service.trackEvent(visitEvent);
        const completeEvent = { ...visitEvent, kind: 'complete', completionPercent: 100 } as JourneyAnalyticsEvent;
        service.trackEvent(completeEvent);
      }

      expect(service.explorerLevel().level).toBe('expert');
      expect(service.explorerLevel().nextMilestone.visitsNeeded).toBe(0);
      expect(service.explorerLevel().nextMilestone.completedNeeded).toBe(0);
    });

    it('should show correct milestone', () => {
      service.trackEvent(createVisitEvent('visit'));

      const level = service.explorerLevel();
      expect(level.level).toBe('novice');
      expect(level.nextMilestone.visitsNeeded).toBe(4);
      expect(level.nextMilestone.completedNeeded).toBe(2);
    });
  });

  describe('updateLocationProgress', () => {
    it('should mark as completed when all cards done', () => {
      const node = createLocationNode();
      const updated = service.updateLocationProgress(node, 10, 10);

      expect(updated.status).toBe('completed');
      expect(updated.completionPercent).toBe(100);
    });

    it('should mark as in-progress when visited but not completed', () => {
      const node = createLocationNode();
      service.trackEvent(createVisitEvent('visit'));

      const updated = service.updateLocationProgress(node, 5, 10);
      expect(updated.status).toBe('in-progress');
      expect(updated.completionPercent).toBe(50);
    });

    it('should keep locked status when not visited and not completed', () => {
      const node = createLocationNode({ status: 'locked' });
      const updated = service.updateLocationProgress(node, 0, 10);

      expect(updated.status).toBe('locked');
      expect(updated.completionPercent).toBe(0);
    });

    it('should set visited flag correctly', () => {
      const node = createLocationNode();
      const updatedWithoutVisit = service.updateLocationProgress(node, 0, 10);
      expect(updatedWithoutVisit.visited).toBe(false);

      service.trackEvent(createVisitEvent('visit'));
      const updatedWithVisit = service.updateLocationProgress(node, 5, 10);
      expect(updatedWithVisit.visited).toBe(true);
    });

    it('should handle zero total cards', () => {
      const node = createLocationNode();
      const updated = service.updateLocationProgress(node, 0, 0);

      expect(updated.completionPercent).toBe(0);
    });
  });

  describe('toggleFavorite', () => {
    it('should add node to favorites', () => {
      service.toggleFavorite('node-1', true);
      expect(service.isFavorite('node-1')).toBe(true);
    });

    it('should remove node from favorites', () => {
      service.toggleFavorite('node-1', true);
      service.toggleFavorite('node-1', false);
      expect(service.isFavorite('node-1')).toBe(false);
    });

    it('should return false for unvisited node', () => {
      expect(service.isFavorite('node-1')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all visits', () => {
      service.trackEvent(createVisitEvent('visit'));
      service.clear();
      expect(service.visits()).toEqual([]);
    });

    it('should clear favorites', () => {
      service.toggleFavorite('node-1', true);
      service.clear();
      expect(service.isFavorite('node-1')).toBe(false);
    });
  });
});
