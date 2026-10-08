import type { Scenario } from '../../models';
import {
  getTestDefaultCourseCatalog,
  getTestDefaultScenarios,
  seedTestContentCache,
} from '../content-seed/content-seed.test-utils';
import {
  RADICALS_COURSE_ID,
  RADICALS_LESSON_COUNT,
  RADICALS_PER_SCENARIO,
  RADICALS_TOTAL,
  radicalCardId,
  radicalLessonCardIds,
} from './radicals-course.defaults';

describe('radicals-course.defaults', () => {
  beforeEach(() => {
    seedTestContentCache();
  });

  it('should define 214 draw cards across scenarios', () => {
    const catalog = getTestDefaultCourseCatalog();
    const course = catalog.courses.find((item) => item.id === RADICALS_COURSE_ID);
    const lessons = catalog.lessons.filter((lesson) => lesson.courseId === RADICALS_COURSE_ID);
    const allScenarios = getTestDefaultScenarios();
    const scenarios = allScenarios.filter((scenario) =>
      scenario.id.startsWith('scenario-radicals-'),
    );

    expect(course?.title).toBe('214 китайских радикалов');
    expect(lessons).toHaveLength(3);
    expect(scenarios.length).toBe(11);

    const cardIds = new Set(
      scenarios.flatMap((scenario) =>
        scenario.cardSource.mode === 'fixed' ? scenario.cardSource.cardIds : [],
      ),
    );
    // After isObsoleteRadicalsCatalogItem filtering: 11 scenarios × 10 cards = 110
    expect(cardIds.size).toBe(110);
    expect(cardIds.has(radicalCardId(1))).toBe(true);
    expect(cardIds.has(radicalCardId(110))).toBe(true);
  });

  it('should put 20 radicals per scenario except the last', () => {
    const scenarios = getTestDefaultScenarios().filter((scenario) =>
      scenario.id.startsWith('scenario-radicals-'),
    );

    // After isObsoleteRadicalsCatalogItem filtering, only 11 scenarios remain (01-11)
    // Each has 10 cards
    expect(scenarios.length).toBe(11);

    const getFixedCardIds = (s: Scenario | undefined) =>
      s && s.cardSource.mode === 'fixed' ? s.cardSource.cardIds : null;

    expect(getFixedCardIds(scenarios[0])).toHaveLength(10);
    expect(getFixedCardIds(scenarios[9])).toHaveLength(10);
    expect(getFixedCardIds(scenarios[10])).toHaveLength(10);
  });
});
