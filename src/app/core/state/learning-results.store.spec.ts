import { TestBed } from '@angular/core/testing';
import { LEARNING_RESULTS_STORAGE_KEY, LearningResultsPersistence } from './learning-results.persistence';
import { LearningResultsStore } from './learning-results.store';
import { UserStore } from './user.store';

describe('LearningResultsStore', () => {
  let store: LearningResultsStore;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [LearningResultsStore, LearningResultsPersistence, UserStore],
    });

    store = TestBed.inject(LearningResultsStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should start with empty results', () => {
    expect(store.totalCount()).toBe(0);
    expect(store.correctCount()).toBe(0);
    expect(store.accuracyPercent()).toBe(0);
  });

  it('should add, persist, and filter results for current user', () => {
    store.addResult({
      id: '1',
      userId: 'local-user',
      cardId: 'c1',
      scenarioId: 's1',
      correct: true,
      answeredAt: '2026-06-13T12:00:00.000Z',
      languagePair: { known: 'ru', learning: 'en' },
    });
    store.addResult({
      id: '2',
      userId: 'other-user',
      cardId: 'c2',
      scenarioId: 's2',
      correct: false,
      answeredAt: '2026-06-13T12:01:00.000Z',
      languagePair: { known: 'ru', learning: 'en' },
    });

    expect(store.totalCount()).toBe(1);
    expect(store.correctCount()).toBe(1);
    expect(store.accuracyPercent()).toBe(100);
    expect(localStorage.getItem(LEARNING_RESULTS_STORAGE_KEY)).toContain('local-user');
    expect(store.resultsForScenario('s1').length).toBe(1);
  });

  it('should expose recent and scenario progress summaries', () => {
    store.addResult({
      id: '1',
      userId: 'local-user',
      cardId: 'c1',
      scenarioId: 's1',
      correct: true,
      answeredAt: '2026-06-13T12:00:00.000Z',
      languagePair: { known: 'ru', learning: 'en' },
    });
    store.addResult({
      id: '2',
      userId: 'local-user',
      cardId: 'c2',
      scenarioId: 's1',
      correct: false,
      answeredAt: '2026-06-13T12:02:00.000Z',
      languagePair: { known: 'ru', learning: 'en' },
    });

    expect(store.recentResults().length).toBe(2);
    expect(store.scenarioProgress()).toEqual([{ scenarioId: 's1', total: 2, correct: 1 }]);
  });

  it('should compute scenario set progress for lessons and courses', () => {
    store.addResult({
      id: '1',
      userId: 'local-user',
      cardId: 'c1',
      scenarioId: 's1',
      correct: true,
      answeredAt: '2026-06-13T12:00:00.000Z',
      languagePair: { known: 'ru', learning: 'en' },
      lessonId: 'l1',
      courseId: 'crs1',
    });

    const progress = store.scenarioSetProgress(['s1', 's2']);
    expect(progress).toEqual({ completed: 1, total: 2, percent: 50 });
  });

  it('should detect completed course from scenario progress', () => {
    store.addResult({
      id: '1',
      userId: 'local-user',
      cardId: 'c1',
      scenarioId: 's1',
      correct: true,
      answeredAt: '2026-06-13T12:00:00.000Z',
      languagePair: { known: 'ru', learning: 'en' },
      courseId: 'crs1',
    });

    expect(
      store.isCourseCompleted([{ scenarioIds: ['s1'] }, { scenarioIds: ['s2'] }]),
    ).toBe(false);
    expect(store.isCourseCompleted([{ scenarioIds: ['s1'] }])).toBe(true);
  });

  it('should clear only current user results', () => {
    store.addResult({
      id: '1',
      userId: 'local-user',
      cardId: 'c1',
      scenarioId: 's1',
      correct: true,
      answeredAt: '2026-06-13T12:00:00.000Z',
      languagePair: { known: 'ru', learning: 'en' },
    });
    store.addResult({
      id: '2',
      userId: 'other-user',
      cardId: 'c2',
      scenarioId: 's2',
      correct: false,
      answeredAt: '2026-06-13T12:01:00.000Z',
      languagePair: { known: 'ru', learning: 'en' },
    });

    store.clear();

    expect(store.totalCount()).toBe(0);
    expect(store.results().length).toBe(1);
  });
});
