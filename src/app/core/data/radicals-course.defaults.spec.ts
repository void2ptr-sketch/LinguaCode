import {
  getTestDefaultCourseCatalog,
  getTestDefaultScenarios,
  seedTestContentCache,
} from './content-seed.test-utils';
import {
  RADICALS_COURSE_ID,
  RADICALS_LESSON_COUNT,
  RADICALS_TOTAL,
  radicalCardId,
  radicalLessonCardIds,
} from './radicals-course.defaults';

describe('radicals-course.defaults', () => {
  beforeEach(() => {
    seedTestContentCache();
  });

  it('should define 214 draw cards across 5 scenarios', () => {
    const catalog = getTestDefaultCourseCatalog();
    const course = catalog.courses.find((item) => item.id === RADICALS_COURSE_ID);
    const lessons = catalog.lessons.filter((lesson) => lesson.courseId === RADICALS_COURSE_ID);
    const scenarios = getTestDefaultScenarios().filter((scenario) =>
      scenario.id.startsWith('scenario-radicals-'),
    );

    expect(course?.title).toBe('214 китайских радикалов');
    expect(lessons).toHaveSize(RADICALS_LESSON_COUNT);
    expect(scenarios).toHaveSize(RADICALS_LESSON_COUNT);
    expect(RADICALS_LESSON_COUNT).toBe(5);

    const cardIds = new Set(
      scenarios.flatMap((scenario) =>
        scenario.cardSource.mode === 'fixed' ? scenario.cardSource.cardIds : [],
      ),
    );
    expect(cardIds.size).toBe(RADICALS_TOTAL);
    expect(cardIds.has(radicalCardId(1))).toBeTrue();
    expect(cardIds.has(radicalCardId(RADICALS_TOTAL))).toBeTrue();
  });

  it('should put about 50 radicals per scenario', () => {
    expect(radicalLessonCardIds(0)).toHaveSize(50);
    expect(radicalLessonCardIds(3)).toHaveSize(50);
    expect(radicalLessonCardIds(RADICALS_LESSON_COUNT - 1)).toHaveSize(14);
  });
});
