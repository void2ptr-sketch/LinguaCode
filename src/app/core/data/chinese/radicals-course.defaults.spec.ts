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
    const scenarios = getTestDefaultScenarios().filter((scenario) =>
      scenario.id.startsWith('scenario-radicals-'),
    );

    expect(course?.title).toBe('214 китайских радикалов');
    expect(lessons).toHaveSize(RADICALS_LESSON_COUNT);
    expect(scenarios).toHaveSize(RADICALS_LESSON_COUNT);
    expect(RADICALS_LESSON_COUNT).toBe(11);

    const cardIds = new Set(
      scenarios.flatMap((scenario) =>
        scenario.cardSource.mode === 'fixed' ? scenario.cardSource.cardIds : [],
      ),
    );
    expect(cardIds.size).toBe(RADICALS_TOTAL);
    expect(cardIds.has(radicalCardId(1))).toBeTrue();
    expect(cardIds.has(radicalCardId(RADICALS_TOTAL))).toBeTrue();
  });

  it('should put 20 radicals per scenario except the last', () => {
    expect(radicalLessonCardIds(0)).toHaveSize(RADICALS_PER_SCENARIO);
    expect(radicalLessonCardIds(9)).toHaveSize(RADICALS_PER_SCENARIO);
    expect(radicalLessonCardIds(RADICALS_LESSON_COUNT - 1)).toHaveSize(14);
  });
});
