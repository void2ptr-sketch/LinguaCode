import type { Scenario } from '../../../scenario/model';
import {
  getTestDefaultCourseCatalog,
  getTestDefaultScenarios,
  seedTestContentCache,
} from '../../../content-seed/content-seed.test-utils';
import {
  RADICALS_COURSE_ID,
  radicalCardId,
  isObsoleteRadicalsCatalogItem,
  radicalLessonCardIds,
  RADICALS_LESSON_COUNT,
} from './radicals-course.defaults';

describe('radicals-course.defaults', () => {
  beforeEach(() => {
    seedTestContentCache();
  });

  it('should define 214 draw cards across scenarios', () => {
    const catalog = getTestDefaultCourseCatalog();
    const course = catalog.courses.find((item) => item.id === RADICALS_COURSE_ID);
    const courseProgramIds = new Set((course?.programIds ?? []).map((pid) => pid));
    const lessons = catalog.lessons.filter((lesson) => courseProgramIds.has(lesson.programId));
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

  // ── isObsoleteRadicalsCatalogItem ────────────────────────────────────────

  it('should return false for non-radicals IDs', () => {
    expect(isObsoleteRadicalsCatalogItem('course-1')).toBe(false);
    expect(isObsoleteRadicalsCatalogItem('draw-radical-001')).toBe(false);
  });

  it('should return false for lesson-radicals within count', () => {
    expect(isObsoleteRadicalsCatalogItem('lesson-radicals-01')).toBe(false);
    expect(
      isObsoleteRadicalsCatalogItem(
        `lesson-radicals-${String(RADICALS_LESSON_COUNT).padStart(2, '0')}`,
      ),
    ).toBe(false);
  });

  it('should return true for lesson-radicals beyond count', () => {
    expect(
      isObsoleteRadicalsCatalogItem(
        `lesson-radicals-${String(RADICALS_LESSON_COUNT + 1).padStart(2, '0')}`,
      ),
    ).toBe(true);
    expect(isObsoleteRadicalsCatalogItem('lesson-radicals-99')).toBe(true);
  });

  it('should return false for scenario-radicals within count', () => {
    expect(isObsoleteRadicalsCatalogItem('scenario-radicals-01')).toBe(false);
  });

  it('should return true for scenario-radicals beyond count', () => {
    expect(
      isObsoleteRadicalsCatalogItem(
        `scenario-radicals-${String(RADICALS_LESSON_COUNT + 1).padStart(2, '0')}`,
      ),
    ).toBe(true);
  });

  // ── radicalLessonCardIds ─────────────────────────────────────────────────

  it('should generate card IDs for lesson 0', () => {
    const ids = radicalLessonCardIds(0);
    expect(ids).toHaveLength(20);
    expect(ids[0]).toBe('draw-radical-001');
    expect(ids[19]).toBe('draw-radical-020');
  });

  it('should generate card IDs for lesson 1', () => {
    const ids = radicalLessonCardIds(1);
    expect(ids).toHaveLength(20);
    expect(ids[0]).toBe('draw-radical-021');
  });

  it('should handle last lesson with fewer cards', () => {
    const ids = radicalLessonCardIds(RADICALS_LESSON_COUNT - 1);
    expect(ids.length).toBeLessThanOrEqual(20);
  });
});
