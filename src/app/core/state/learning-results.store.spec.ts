import { LearningResultsStore } from './learning-results.store';

describe('LearningResultsStore', () => {
  let store: LearningResultsStore;

  beforeEach(() => {
    store = new LearningResultsStore();
  });

  it('should start with empty results', () => {
    expect(store.totalCount()).toBe(0);
    expect(store.correctCount()).toBe(0);
  });

  it('should add and filter results', () => {
    store.addResult({
      id: '1',
      userId: 'u1',
      cardId: 'c1',
      scenarioId: 's1',
      correct: true,
      answeredAt: '2026-06-13T12:00:00.000Z',
    });
    store.addResult({
      id: '2',
      userId: 'u1',
      cardId: 'c2',
      scenarioId: 's2',
      correct: false,
      answeredAt: '2026-06-13T12:01:00.000Z',
    });

    expect(store.totalCount()).toBe(2);
    expect(store.correctCount()).toBe(1);
    expect(store.resultsForScenario('s1').length).toBe(1);
  });

  it('should clear results', () => {
    store.addResult({
      id: '1',
      userId: 'u1',
      cardId: 'c1',
      scenarioId: 's1',
      correct: true,
      answeredAt: '2026-06-13T12:00:00.000Z',
    });

    store.clear();
    expect(store.totalCount()).toBe(0);
  });
});
