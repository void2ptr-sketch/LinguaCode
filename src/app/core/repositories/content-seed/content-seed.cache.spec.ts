import {
  getScenarioSeedCache,
  getCourseSeedCache,
  getCardSeedCache,
  setScenarioSeedCache,
  setCourseSeedCache,
  setCardSeedCache,
  resetContentSeedCache,
  isContentSeedCacheReady,
} from './content-seed.cache';
import type { Scenario, Card, Course, Lesson } from '../../models';

function makeScenario(overrides?: Partial<Scenario>): Scenario {
  return {
    id: 's1',
    title: 'Scenario 1',
    description: 'Test scenario',
    authorId: 'local-user',
    cardSource: { mode: 'cards' },
    published: false,
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  } as Scenario;
}

function makeCard(overrides?: Partial<Card>): Card {
  return {
    id: 'card1',
    kind: 'select',
    title: 'Card 1',
    appearance: { theme: 'default', fontSize: 'md' },
    promptKnown: 'Hello',
    optionsLearning: [],
    ...overrides,
  } as unknown as Card;
}

function makeCourse(overrides?: Partial<Course>): Course {
  return {
    id: 'c1',
    title: 'Course 1',
    description: 'Test course',
    authorId: 'local-user',
    languagePair: { known: 'ru', learning: 'zh' },
    lessonIds: [],
    published: false,
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  } as Course;
}

function makeLesson(overrides?: Partial<Lesson>): Lesson {
  return {
    id: 'l1',
    courseId: 'c1',
    title: 'Lesson 1',
    description: 'Test lesson',
    scenarioIds: [],
    prerequisiteLessonIds: [],
    order: 0,
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  } as Lesson;
}

describe('content-seed.cache', () => {
  beforeEach(() => {
    resetContentSeedCache();
  });

  describe('getScenarioSeedCache', () => {
    it('should return empty array initially', () => {
      expect(getScenarioSeedCache()).toEqual([]);
    });

    it('should return stored scenarios after setting', () => {
      const scenarios = [makeScenario(), makeScenario({ id: 's2' })];
      setScenarioSeedCache(scenarios);
      expect(getScenarioSeedCache()).toEqual(scenarios);
    });

    it('should clone the array (not same reference)', () => {
      const scenarios = [makeScenario()];
      setScenarioSeedCache(scenarios);
      expect(getScenarioSeedCache()).not.toBe(scenarios);
    });
  });

  describe('getCourseSeedCache', () => {
    it('should return empty course catalog initially', () => {
      const catalog = getCourseSeedCache();
      expect(catalog.courses).toEqual([]);
      expect(catalog.lessons).toEqual([]);
    });

    it('should return stored catalog after setting', () => {
      const catalog = {
        courses: [makeCourse()],
        lessons: [makeLesson()],
      };
      setCourseSeedCache(catalog);
      const result = getCourseSeedCache();
      expect(result.courses).toEqual(catalog.courses);
      expect(result.lessons).toEqual(catalog.lessons);
    });

    it('should clone courses and lessons arrays (not same reference)', () => {
      const catalog = {
        courses: [makeCourse()],
        lessons: [makeLesson()],
      };
      setCourseSeedCache(catalog);
      const cached = getCourseSeedCache();
      expect(cached).not.toBe(catalog);
      expect(cached.courses).not.toBe(catalog.courses);
      expect(cached.lessons).not.toBe(catalog.lessons);
    });
  });

  describe('getCardSeedCache', () => {
    it('should return empty array initially', () => {
      expect(getCardSeedCache()).toEqual([]);
    });

    it('should return stored cards after setting', () => {
      const cards = [makeCard()];
      setCardSeedCache(cards);
      expect(getCardSeedCache()).toEqual(cards);
    });
  });

  describe('setScenarioSeedCache', () => {
    it('should replace cache with a shallow copy', () => {
      const scenarios = [makeScenario()];
      setScenarioSeedCache(scenarios);
      scenarios.push(makeScenario({ id: 's2' }));
      expect(getScenarioSeedCache()).toHaveLength(1);
    });
  });

  describe('setCourseSeedCache', () => {
    it('should clone courses and lessons arrays', () => {
      const courses = [makeCourse()];
      const lessons = [makeLesson()];
      const catalog = { courses, lessons };
      setCourseSeedCache(catalog);
      courses.push(makeCourse({ id: 'c2' }));
      lessons.push(makeLesson({ id: 'l2' }));
      const cached = getCourseSeedCache();
      expect(cached.courses).toHaveLength(1);
      expect(cached.lessons).toHaveLength(1);
    });
  });

  describe('setCardSeedCache', () => {
    it('should replace cache with a shallow copy', () => {
      const cards = [makeCard()];
      setCardSeedCache(cards);
      cards.push(makeCard({ id: 'card2' }));
      expect(getCardSeedCache()).toHaveLength(1);
    });
  });

  describe('resetContentSeedCache', () => {
    it('should clear all caches to initial state', () => {
      setScenarioSeedCache([makeScenario()]);
      setCardSeedCache([makeCard()]);
      setCourseSeedCache({
        courses: [makeCourse()],
        lessons: [makeLesson()],
      });

      resetContentSeedCache();

      expect(getScenarioSeedCache()).toEqual([]);
      expect(getCardSeedCache()).toEqual([]);
      expect(getCourseSeedCache().courses).toEqual([]);
      expect(getCourseSeedCache().lessons).toEqual([]);
    });
  });

  describe('isContentSeedCacheReady', () => {
    it('should return false when all caches are empty', () => {
      expect(isContentSeedCacheReady()).toBe(false);
    });

    it('should return false when only scenarios are present', () => {
      setScenarioSeedCache([makeScenario()]);
      expect(isContentSeedCacheReady()).toBe(false);
    });

    it('should return false when only courses are present', () => {
      setCourseSeedCache({
        courses: [makeCourse()],
        lessons: [],
      });
      expect(isContentSeedCacheReady()).toBe(false);
    });

    it('should return false when only cards are present', () => {
      setCardSeedCache([makeCard()]);
      expect(isContentSeedCacheReady()).toBe(false);
    });

    it('should return true when all caches have data', () => {
      setScenarioSeedCache([makeScenario()]);
      setCourseSeedCache({
        courses: [makeCourse()],
        lessons: [],
      });
      setCardSeedCache([makeCard()]);
      expect(isContentSeedCacheReady()).toBe(true);
    });
  });
});
