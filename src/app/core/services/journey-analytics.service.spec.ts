import { TestBed } from '@angular/core/testing';
import { UserStore } from '../state/user.store';
import { JourneyAnalyticsService } from './journey-analytics.service';
import type { JourneyLocationNode } from '../models/journey.types';

describe('JourneyAnalyticsService', () => {
  let service: JourneyAnalyticsService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [JourneyAnalyticsService, UserStore],
    });

    service = TestBed.inject(JourneyAnalyticsService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty visits', () => {
    expect(service.visits().length).toBe(0);
  });

  it('should track visit event', () => {
    service.trackEvent({
      kind: 'visit',
      scenarioId: 's1',
      lessonId: 'l1',
      courseId: 'c1',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    expect(service.visits().length).toBe(1);
    expect(service.visits()[0].scenarioId).toBe('s1');
  });

  it('should update duration event', () => {
    service.trackEvent({
      kind: 'visit',
      scenarioId: 's1',
      lessonId: 'l1',
      courseId: 'c1',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    service.trackEvent({
      kind: 'duration',
      scenarioId: 's1',
      lessonId: 'l1',
      courseId: 'c1',
      durationMs: 30000,
      timestamp: '2026-01-01T00:00:30.000Z',
    });

    expect(service.visits()[0].durationMs).toBe(30000);
  });

  it('should update completion event', () => {
    service.trackEvent({
      kind: 'visit',
      scenarioId: 's1',
      lessonId: 'l1',
      courseId: 'c1',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    service.trackEvent({
      kind: 'complete',
      scenarioId: 's1',
      lessonId: 'l1',
      courseId: 'c1',
      completionPercent: 100,
      timestamp: '2026-01-01T00:01:00.000Z',
    });

    expect(service.visits()[0].completionPercent).toBe(100);
  });

  it('should persist visits to localStorage', () => {
    service.trackEvent({
      kind: 'visit',
      scenarioId: 's1',
      lessonId: 'l1',
      courseId: 'c1',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    const stored = localStorage.getItem('journey_visits');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toHaveLength(1);
  });

  it('should compute explorer level correctly', () => {
    // Новичок по умолчанию
    expect(service.explorerLevel().level).toBe('novice');

    // Добавляем посещения для перехода к experienced
    for (let i = 0; i < 5; i++) {
      service.trackEvent({
        kind: 'visit',
        scenarioId: `s${i}`,
        lessonId: 'l1',
        courseId: 'c1',
        timestamp: `2026-01-01T00:0${i}:00.000Z`,
      });
    }
    for (let i = 0; i < 2; i++) {
      service.trackEvent({
        kind: 'complete',
        scenarioId: `s${i}`,
        lessonId: 'l1',
        courseId: 'c1',
        completionPercent: 100,
        timestamp: `2026-01-01T01:0${i}:00.000Z`,
      });
    }

    expect(service.explorerLevel().level).toBe('experienced');
  });

  it('should toggle favorites', () => {
    expect(service.isFavorite('n1')).toBe(false);

    service.toggleFavorite('n1', true);
    expect(service.isFavorite('n1')).toBe(true);

    service.toggleFavorite('n1', false);
    expect(service.isFavorite('n1')).toBe(false);
  });

  it('should clear all analytics data', () => {
    service.trackEvent({
      kind: 'visit',
      scenarioId: 's1',
      lessonId: 'l1',
      courseId: 'c1',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    service.clear();

    expect(service.visits().length).toBe(0);
    expect(service.isFavorite('n1')).toBe(false);
  });

  it('should update location progress', () => {
    // Сначала фиксируем посещение
    service.trackEvent({
      kind: 'visit',
      scenarioId: 's1',
      lessonId: 'l1',
      courseId: 'c1',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    const node: JourneyLocationNode = {
      id: 'n1',
      title: 'Тест',
      description: 'Описание',
      cardCount: 2,
      order: 1,
      status: 'available',
      contentTypes: ['test'],
      lessonId: 'l1',
      lessonTitle: 'Урок 1',
      courseId: 'c1',
      courseTitle: 'Курс 1',
      completionPercent: 0,
      visited: false,
      favorite: false,
      blockReason: null,
      scenarioId: 's1',
    };

    const updated = service.updateLocationProgress(node, 1, 2);
    expect(updated.status).toBe('in-progress');
    expect(updated.completionPercent).toBe(50);
  });
});
