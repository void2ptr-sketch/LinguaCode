import { LearningResultsPersistence, LEARNING_RESULTS_STORAGE_KEY } from './learning-results.persistence';
import { DEFAULT_LANGUAGE_PAIR } from '../models';
import type { LearningResult } from '../models';

describe('LearningResultsPersistence', () => {
  let persistence: LearningResultsPersistence;

  const makeResult = (overrides?: Partial<LearningResult>): LearningResult => ({
    id: 'r1',
    userId: 'local-user',
    cardId: 'card-1',
    scenarioId: 'scenario-1',
    correct: true,
    answeredAt: new Date(0).toISOString(),
    languagePair: { known: 'ru', learning: 'zh' },
    direction: 'known-to-learning',
    ...overrides,
  });

  beforeEach(() => {
    localStorage.clear();
    persistence = new LearningResultsPersistence();
  });

  describe('load', () => {
    it('should return empty array when nothing is stored', () => {
      expect(persistence.load()).toEqual([]);
    });

    it('should return stored results', () => {
      const results = [makeResult(), makeResult({ id: 'r2', correct: false })];
      localStorage.setItem(LEARNING_RESULTS_STORAGE_KEY, JSON.stringify(results));

      expect(persistence.load()).toEqual(results);
    });

    it('should return empty array when stored value is not an array', () => {
      localStorage.setItem(LEARNING_RESULTS_STORAGE_KEY, JSON.stringify({ id: 'r1' }));

      expect(persistence.load()).toEqual([]);
    });

    it('should return empty array when stored value is invalid JSON', () => {
      localStorage.setItem(LEARNING_RESULTS_STORAGE_KEY, 'not-json');

      expect(persistence.load()).toEqual([]);
    });

    it('should apply fallbacks for missing fields', () => {
      localStorage.setItem(
        LEARNING_RESULTS_STORAGE_KEY,
        JSON.stringify([{ correct: true }]),
      );

      const results = persistence.load();

      expect(results).toHaveLength(1);
      const result = results[0]!;
      expect(result.id).toBeTruthy();
      expect(result.userId).toBe('local-user');
      expect(result.cardId).toBe('');
      expect(result.scenarioId).toBe('');
      expect(result.correct).toBe(true);
      expect(result.answeredAt).toBeTruthy();
      expect(result.languagePair).toEqual(DEFAULT_LANGUAGE_PAIR);
    });

    it('should drop non-string lessonId and courseId', () => {
      localStorage.setItem(
        LEARNING_RESULTS_STORAGE_KEY,
        JSON.stringify([
          { id: 'r1', cardId: 'c', scenarioId: 's', lessonId: 42, courseId: null, correct: true },
        ]),
      );

      const results = persistence.load();

      expect(results[0]?.lessonId).toBeUndefined();
      expect(results[0]?.courseId).toBeUndefined();
    });

    it('should keep string lessonId and courseId', () => {
      localStorage.setItem(
        LEARNING_RESULTS_STORAGE_KEY,
        JSON.stringify([
          { id: 'r1', cardId: 'c', scenarioId: 's', lessonId: 'l1', courseId: 'course-1', correct: true },
        ]),
      );

      const results = persistence.load();

      expect(results[0]?.lessonId).toBe('l1');
      expect(results[0]?.courseId).toBe('course-1');
    });
  });

  describe('save', () => {
    it('should persist results to localStorage', () => {
      const results = [makeResult()];

      persistence.save(results);

      const raw = localStorage.getItem(LEARNING_RESULTS_STORAGE_KEY);
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw!)).toEqual(results);
    });

    it('should overwrite previously stored results', () => {
      persistence.save([makeResult()]);
      persistence.save([makeResult({ id: 'r2' })]);

      const stored = JSON.parse(localStorage.getItem(LEARNING_RESULTS_STORAGE_KEY)!);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('r2');
    });
  });
});
