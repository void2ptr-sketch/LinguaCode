import {
  DEFAULT_RADICALS_COURSE,
  DEFAULT_RADICALS_LESSONS,
  DEFAULT_RADICALS_SCENARIOS,
  RADICALS_LESSON_COUNT,
  RADICALS_TOTAL,
  radicalCardId,
  radicalLessonCardIds,
} from './radicals-course.defaults';

describe('radicals-course.defaults', () => {
  it('should define 214 draw cards across 5 scenarios', () => {
    expect(DEFAULT_RADICALS_COURSE.title).toBe('214 китайских радикалов');
    expect(DEFAULT_RADICALS_LESSONS).toHaveSize(RADICALS_LESSON_COUNT);
    expect(DEFAULT_RADICALS_SCENARIOS).toHaveSize(RADICALS_LESSON_COUNT);
    expect(RADICALS_LESSON_COUNT).toBe(5);

    const cardIds = new Set(
      DEFAULT_RADICALS_SCENARIOS.flatMap((scenario) =>
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
