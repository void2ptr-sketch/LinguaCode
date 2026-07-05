import type { Card } from '../../models';
import type { Course, Lesson } from '../../models';
import type { Scenario } from '../../models';
import type { CardIndexMetaOverride } from '../cards/card-index.mapper';
import type { CourseCatalogState } from './course-catalog-state';
import { collectCourseBundle, validateCourseBundle } from './course-bundle.utils';
import type { CourseBundle } from './course-bundle.types';

describe('course-bundle.utils', () => {
  function makeBaseCourse(): Course {
    return {
      id: 'course-test-1',
      title: 'Test Course',
      description: 'A test course',
      authorId: 'local-user',
      languagePair: { known: 'ru', learning: 'en' },
      lessonIds: ['lesson-test-1'],
      published: false,
      updatedAt: '2026-06-01T00:00:00.000Z',
    };
  }

  function makeBaseLesson(): Lesson {
    return {
      id: 'lesson-test-1',
      courseId: 'course-test-1',
      title: 'Test Lesson',
      description: '',
      scenarioIds: ['scenario-test-1'],
      prerequisiteLessonIds: [],
      order: 0,
      updatedAt: '2026-06-01T00:00:00.000Z',
    };
  }

  function makeBaseScenario(): Scenario {
    return {
      id: 'scenario-test-1',
      title: 'Test Scenario',
      description: '',
      authorId: 'local-user',
      published: false,
      updatedAt: '2026-06-01T00:00:00.000Z',
      cardSource: { mode: 'fixed', cardIds: ['card-test-1'] },
    };
  }

  function makeBaseCard(): Card {
    return {
      id: 'card-test-1',
      kind: 'select',
      title: 'Test Card',
      appearance: { theme: 'default', fontSize: 'md' },
      languagePair: { known: 'ru', learning: 'en' },
      authorId: 'local-user',
      updatedAt: '2026-06-01T00:00:00.000Z',
      question: { text: 'Test question' },
      answer: { correct: ['answer'] },
      choices: [{ text: 'A' }, { text: 'B' }],
    } as unknown as Card;
  }

  function makeBaseMeta(): Record<string, CardIndexMetaOverride> {
    return {
      'card-test-1': {
        knownLanguage: 'ru',
        learningLanguage: 'en',
        difficulty: 'beginner',
        tags: ['test'],
      },
    };
  }

  function makeCatalog(course?: Course, lesson?: Lesson): CourseCatalogState {
    return {
      courses: course ? [course] : [],
      lessons: lesson ? [lesson] : [],
    };
  }

  describe('collectCourseBundle', () => {
    it('collects a complete bundle for a valid course', () => {
      const result = collectCourseBundle(
        'course-test-1',
        makeCatalog(makeBaseCourse(), makeBaseLesson()),
        [makeBaseScenario()],
        [makeBaseCard()],
        makeBaseMeta(),
      );

      expect(result).not.toBeNull();
      expect(result!.errors).toEqual([]);
      expect(result!.bundle.formatVersion).toBe(1);
      expect(result!.bundle.course.courses[0].id).toBe('course-test-1');
      expect(result!.bundle.course.lessons[0].id).toBe('lesson-test-1');
      expect(result!.bundle.scenarios[0].id).toBe('scenario-test-1');
      expect(result!.bundle.cards[0].id).toBe('card-test-1');
      expect(result!.bundle.cardIndexMeta['card-test-1']).toBeDefined();
      expect(result!.bundle.sourceAuthorId).toBe('local-user');
    });

    it('returns null when course is not found', () => {
      const result = collectCourseBundle(
        'course-nonexistent',
        makeCatalog(makeBaseCourse(), makeBaseLesson()),
        [makeBaseScenario()],
        [makeBaseCard()],
        makeBaseMeta(),
      );

      expect(result).toBeNull();
    });

    it('returns null when all lessons are missing', () => {
      const courseWithMissingLesson: Course = {
        ...makeBaseCourse(),
        lessonIds: ['lesson-missing'],
      };

      const result = collectCourseBundle(
        'course-test-1',
        makeCatalog(courseWithMissingLesson),
        [makeBaseScenario()],
        [makeBaseCard()],
        makeBaseMeta(),
      );

      expect(result).toBeNull();
    });

    it('rejects criteria scenarios', () => {
      const criteriaScenario: Scenario = {
        ...makeBaseScenario(),
        cardSource: {
          mode: 'criteria',
          criteria: { knownLanguage: 'ru', learningLanguage: 'en' },
          limit: 10,
        },
      };

      const result = collectCourseBundle(
        'course-test-1',
        makeCatalog(makeBaseCourse(), makeBaseLesson()),
        [criteriaScenario],
        [makeBaseCard()],
        makeBaseMeta(),
      );

      expect(result).not.toBeNull();
      expect(result!.errors.some((e) => e.includes('criteria'))).toBeTrue();
    });

    it('returns errors when card is missing', () => {
      const result = collectCourseBundle(
        'course-test-1',
        makeCatalog(makeBaseCourse(), makeBaseLesson()),
        [makeBaseScenario()],
        [],
        makeBaseMeta(),
      );

      expect(result).not.toBeNull();
      expect(result!.errors.some((e) => e.includes('card-test-1'))).toBeTrue();
    });

    it('returns errors when card meta is missing', () => {
      const result = collectCourseBundle(
        'course-test-1',
        makeCatalog(makeBaseCourse(), makeBaseLesson()),
        [makeBaseScenario()],
        [makeBaseCard()],
        {},
      );

      expect(result).not.toBeNull();
      expect(result!.errors.some((e) => e.includes('Мета-информация'))).toBeTrue();
    });

    it('handles snapshot card source', () => {
      const snapshotScenario: Scenario = {
        ...makeBaseScenario(),
        cardSource: {
          mode: 'snapshot',
          cardIds: ['card-test-1'],
          criteria: { knownLanguage: 'ru', learningLanguage: 'en' },
          limit: 10,
          frozenAt: '2026-06-01T00:00:00.000Z',
        },
      };

      const result = collectCourseBundle(
        'course-test-1',
        makeCatalog(makeBaseCourse(), makeBaseLesson()),
        [snapshotScenario],
        [makeBaseCard()],
        makeBaseMeta(),
      );

      expect(result).not.toBeNull();
      expect(result!.errors).toEqual([]);
      expect(result!.bundle.scenarios[0].cardSource.mode).toBe('snapshot');
    });
  });

  describe('validateCourseBundle', () => {
    function makeValidBundle(): CourseBundle {
      return {
        formatVersion: 1,
        exportedAt: '2026-06-15T00:00:00.000Z',
        sourceAuthorId: 'local-user',
        course: {
          courses: [makeBaseCourse()],
          lessons: [makeBaseLesson()],
        },
        scenarios: [makeBaseScenario()],
        cards: [makeBaseCard()],
        cardIndexMeta: makeBaseMeta(),
      };
    }

    it('validates a correct bundle', () => {
      const result = validateCourseBundle(makeValidBundle());
      expect(result.valid).toBeTrue();
      expect(result.errors).toEqual([]);
    });

    it('rejects unsupported formatVersion', () => {
      const bundle = makeValidBundle();
      bundle.formatVersion = 999 as 1;

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBeFalse();
      expect(result.errors.some((e) => e.includes('версия'))).toBeTrue();
    });

    it('rejects missing exportedAt', () => {
      const bundle = makeValidBundle();
      bundle.exportedAt = '';

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBeFalse();
    });

    it('rejects bundles with more than one course', () => {
      const bundle = makeValidBundle();
      bundle.course.courses = [makeBaseCourse(), { ...makeBaseCourse(), id: 'course-2' }];

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBeFalse();
      expect(result.errors.some((e) => e.includes('1'))).toBeTrue();
    });

    it('rejects bundles with missing lesson', () => {
      const bundle = makeValidBundle();
      bundle.course.courses[0].lessonIds = ['lesson-missing'];

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBeFalse();
      expect(result.errors.some((e) => e.includes('lesson-missing'))).toBeTrue();
    });

    it('rejects bundles with missing scenario', () => {
      const bundle = makeValidBundle();
      bundle.course.lessons[0].scenarioIds = ['scenario-missing'];

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBeFalse();
      expect(result.errors.some((e) => e.includes('scenario-missing'))).toBeTrue();
    });

    it('rejects bundles with missing card', () => {
      const bundle = makeValidBundle();
      bundle.scenarios[0].cardSource = { mode: 'fixed', cardIds: ['card-missing'] };

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBeFalse();
      expect(result.errors.some((e) => e.includes('card-missing'))).toBeTrue();
    });

    it('rejects bundles with missing card meta', () => {
      const bundle = makeValidBundle();
      bundle.cardIndexMeta = {};

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBeFalse();
      expect(result.errors.some((e) => e.includes('Мета-информация'))).toBeTrue();
    });

    it('rejects criteria scenarios in validation', () => {
      const bundle = makeValidBundle();
      bundle.scenarios[0].cardSource = {
        mode: 'criteria',
        criteria: { knownLanguage: 'ru', learningLanguage: 'en' },
        limit: 10,
      };

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBeFalse();
      expect(result.errors.some((e) => e.includes('criteria'))).toBeTrue();
    });
  });
});
