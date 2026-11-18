import type { Card } from '../../card/model';
import type { Course, Lesson } from '../model';
import type { Scenario } from '../../scenario/model';
import type { CardIndexMetaOverride } from '../../card/model';
import { collectCourseBundle, validateCourseBundle } from './course-bundle.utils';
import type { CourseBundle, CourseBundleV1 } from './course-bundle.types';

describe('course-bundle.utils', () => {
  function makeBaseCourse(): Course {
    return {
      id: 'course-test-1',
      title: 'Test Course',
      description: 'A test course',
      authorId: 'local-user',
      languagePair: { known: 'ru', learning: 'en' },
      programIds: ['program-test-1'],
      published: false,
      updatedAt: '2026-06-01T00:00:00.000Z',
    };
  }

  function makeBaseLesson(): Lesson {
    return {
      id: 'lesson-test-1',
      programId: 'program-test-1',
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

  function makeProgram(
    courseId: string,
    lessonIds: string[],
  ): import('../../program/model/program.types').Program {
    return {
      id: 'program-test-1',
      courseId,
      title: 'Test Program',
      description: '',
      lessonIds,
      order: 0,
      updatedAt: '2026-06-01T00:00:00.000Z',
    };
  }

  function makeCatalog(
    course?: Course,
    lesson?: Lesson,
    program?: import('../../program/model/program.types').Program,
  ): {
    courses: Course[];
    programs: import('../../program/model/program.types').Program[];
    lessons: Lesson[];
  } {
    return {
      courses: course ? [course] : [],
      programs: program ? [program] : [],
      lessons: lesson ? [lesson] : [],
    };
  }

  describe('collectCourseBundle', () => {
    it('collects a complete bundle for a valid course (v2 format)', () => {
      const catalog = makeCatalog(
        makeBaseCourse(),
        makeBaseLesson(),
        makeProgram('course-test-1', ['lesson-test-1']),
      );
      const result = collectCourseBundle(
        'course-test-1',
        catalog.courses,
        catalog.programs,
        catalog.lessons,
        [makeBaseScenario()],
        [makeBaseCard()],
        makeBaseMeta(),
      );

      expect(result).not.toBeNull();
      expect(result!.errors).toEqual([]);
      expect(result!.bundle.formatVersion).toBe(2);
      expect(result!.bundle.course.id).toBe('course-test-1');
      expect(result!.bundle.programs.length).toBe(1);
      expect(result!.bundle.programs[0].order).toBe(0);
      expect(result!.bundle.programs[0].lessons.length).toBe(1);
      expect(result!.bundle.programs[0].lessons[0].order).toBe(0);
      expect(result!.bundle.programs[0].lessons[0].scenarios.length).toBe(1);
      expect(result!.bundle.programs[0].lessons[0].scenarios[0].order).toBe(0);
      expect(result!.bundle.programs[0].lessons[0].scenarios[0].cards.length).toBe(1);
      expect(result!.bundle.programs[0].lessons[0].scenarios[0].cards[0].order).toBe(0);
      expect(result!.bundle.programs[0].lessons[0].scenarios[0].cards[0].card.id).toBe('card-test-1');
      expect(result!.bundle.programs[0].lessons[0].scenarios[0].cards[0].meta).toBeDefined();
      expect(result!.bundle.sourceAuthorId).toBe('local-user');
    });

    it('returns null when course is not found', () => {
      const catalog = makeCatalog(
        makeBaseCourse(),
        makeBaseLesson(),
        makeProgram('course-test-1', ['lesson-test-1']),
      );
      const result = collectCourseBundle(
        'course-nonexistent',
        catalog.courses,
        catalog.programs,
        catalog.lessons,
        [makeBaseScenario()],
        [makeBaseCard()],
        makeBaseMeta(),
      );

      expect(result).toBeNull();
    });

    it('returns null when all lessons are missing', () => {
      const courseWithMissingLesson: Course = {
        ...makeBaseCourse(),
        programIds: ['program-missing'],
      };

      const catalog = makeCatalog(courseWithMissingLesson);
      const result = collectCourseBundle(
        'course-test-1',
        catalog.courses,
        catalog.programs,
        catalog.lessons,
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

      const catalog = makeCatalog(
        makeBaseCourse(),
        makeBaseLesson(),
        makeProgram('course-test-1', ['lesson-test-1']),
      );

      const result = collectCourseBundle(
        'course-test-1',
        catalog.courses,
        catalog.programs,
        catalog.lessons,
        [criteriaScenario],
        [makeBaseCard()],
        makeBaseMeta(),
      );

      expect(result).not.toBeNull();
      expect(result!.errors.some((e) => e.includes('criteria'))).toBe(true);
    });

    it('returns errors when card is missing', () => {
      const catalog = makeCatalog(
        makeBaseCourse(),
        makeBaseLesson(),
        makeProgram('course-test-1', ['lesson-test-1']),
      );

      const result = collectCourseBundle(
        'course-test-1',
        catalog.courses,
        catalog.programs,
        catalog.lessons,
        [makeBaseScenario()],
        [],
        makeBaseMeta(),
      );

      expect(result).not.toBeNull();
      expect(result!.errors.some((e) => e.includes('card-test-1'))).toBe(true);
    });

    it('returns errors when card meta is missing', () => {
      const catalog = makeCatalog(
        makeBaseCourse(),
        makeBaseLesson(),
        makeProgram('course-test-1', ['lesson-test-1']),
      );

      const result = collectCourseBundle(
        'course-test-1',
        catalog.courses,
        catalog.programs,
        catalog.lessons,
        [makeBaseScenario()],
        [makeBaseCard()],
        {},
      );

      expect(result).not.toBeNull();
      expect(result!.errors.some((e) => e.includes('Мета-информация'))).toBe(true);
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

      const catalog = makeCatalog(
        makeBaseCourse(),
        makeBaseLesson(),
        makeProgram('course-test-1', ['lesson-test-1']),
      );

      const result = collectCourseBundle(
        'course-test-1',
        catalog.courses,
        catalog.programs,
        catalog.lessons,
        [snapshotScenario],
        [makeBaseCard()],
        makeBaseMeta(),
      );

      expect(result).not.toBeNull();
      expect(result!.errors).toEqual([]);
      expect(result!.bundle.programs[0].lessons[0].scenarios[0].scenario.cardSource.mode).toBe(
        'snapshot',
      );
    });
  });

  describe('validateCourseBundle', () => {
    function makeValidBundleV2(): CourseBundle {
      return {
        formatVersion: 2,
        exportedAt: '2026-06-15T00:00:00.000Z',
        sourceAuthorId: 'local-user',
        course: makeBaseCourse(),
        programs: [
          {
            program: makeProgram('course-test-1', ['lesson-test-1']),
            order: 0,
            lessons: [
              {
                lesson: makeBaseLesson(),
                order: 0,
                scenarios: [
                  {
                    scenario: makeBaseScenario(),
                    order: 0,
                    cards: [
                      {
                        card: makeBaseCard(),
                        order: 0,
                        meta: makeBaseMeta()['card-test-1'],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
    }

    function makeValidBundleV1(): CourseBundleV1 {
      return {
        formatVersion: 1,
        exportedAt: '2026-06-15T00:00:00.000Z',
        sourceAuthorId: 'local-user',
        course: {
          courses: [makeBaseCourse()],
          programs: [makeProgram('course-test-1', ['lesson-test-1'])],
          lessons: [makeBaseLesson()],
        },
        scenarios: [makeBaseScenario()],
        cards: [makeBaseCard()],
        cardIndexMeta: makeBaseMeta(),
      };
    }

    it('validates a correct v2 bundle', () => {
      const result = validateCourseBundle(makeValidBundleV2());
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates a correct v1 bundle', () => {
      const result = validateCourseBundle(makeValidBundleV1());
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('rejects unsupported formatVersion', () => {
      const bundle = makeValidBundleV2();
      bundle.formatVersion = 999 as 2;

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('версия'))).toBe(true);
    });

    it('rejects missing exportedAt', () => {
      const bundle = makeValidBundleV2();
      bundle.exportedAt = '';

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBe(false);
    });

    it('rejects bundles with negative program order', () => {
      const bundle = makeValidBundleV2();
      bundle.programs[0].order = -1;

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('order'))).toBe(true);
    });

    it('rejects bundles with negative lesson order', () => {
      const bundle = makeValidBundleV2();
      bundle.programs[0].lessons[0].order = -1;

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('order'))).toBe(true);
    });

    it('rejects bundles with negative scenario order', () => {
      const bundle = makeValidBundleV2();
      bundle.programs[0].lessons[0].scenarios[0].order = -1;

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('order'))).toBe(true);
    });

    it('rejects bundles with negative card order', () => {
      const bundle = makeValidBundleV2();
      bundle.programs[0].lessons[0].scenarios[0].cards[0].order = -1;

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('order'))).toBe(true);
    });

    it('rejects bundles with missing card meta', () => {
      const bundle = makeValidBundleV2();
      // Установить meta в undefined
      const cards = bundle.programs[0].lessons[0].scenarios[0].cards;
      const firstCard = cards[0] as { card: Card; order: number; meta?: CardIndexMetaOverride };
      firstCard.meta = undefined;

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Мета-информация'))).toBe(true);
    });

    it('rejects criteria scenarios in v2 validation', () => {
      const bundle = makeValidBundleV2();
      bundle.programs[0].lessons[0].scenarios[0].scenario.cardSource = {
        mode: 'criteria',
        criteria: { knownLanguage: 'ru', learningLanguage: 'en' },
        limit: 10,
      };

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('criteria'))).toBe(true);
    });

    it('rejects bundles with missing scenario', () => {
      const bundle = makeValidBundleV1();
      bundle.course.programs[0].lessonIds = ['lesson-missing'];

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('lesson-missing'))).toBe(true);
    });

    it('rejects bundles with missing scenario reference', () => {
      const bundle = makeValidBundleV1();
      bundle.course.lessons[0].scenarioIds = ['scenario-missing'];

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('scenario-missing'))).toBe(true);
    });

    it('rejects bundles with missing card reference', () => {
      const bundle = makeValidBundleV1();
      bundle.scenarios[0].cardSource = { mode: 'fixed', cardIds: ['card-missing'] };

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('card-missing'))).toBe(true);
    });

    it('rejects bundles with missing card meta in v1', () => {
      const bundle = makeValidBundleV1();
      bundle.cardIndexMeta = {};

      const result = validateCourseBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Мета-информация'))).toBe(true);
    });
  });
});
