import {
  getTestDemoCourseWithLessons,
  seedTestContentCache,
} from '../../content-seed/content-seed.test-utils';
import {
  buildLessonRoadmap,
  collectScenarioIds,
  courseMatchesActiveLanguagePair,
  inferActiveCourseId,
  resolveLearningResumeTarget,
} from './learning-resume.utils';

describe('learning-resume.utils', () => {
  beforeEach(() => {
    seedTestContentCache();
  });

  describe('inferActiveCourseId', () => {
    it('should return saved activeCourseId when present', () => {
      const result = inferActiveCourseId({ activeCourseId: 'saved-course' } as never, [], {
        id: 'current-course',
      } as never);
      expect(result).toBe('saved-course');
    });

    it('should return course ID from pairResults when no saved', () => {
      const result = inferActiveCourseId(
        undefined,
        [
          {
            id: '1',
            userId: 'u',
            cardId: 'c',
            scenarioId: 's1',
            correct: true,
            answeredAt: '2026-01-02T00:00:00.000Z',
            languagePair: { known: 'en' as const, learning: 'zh' as const },
            courseId: 'results-course',
          },
        ],
        { id: 'current-course' } as never,
      );
      expect(result).toBe('results-course');
    });

    it('should return most recent result course ID', () => {
      const result = inferActiveCourseId(
        undefined,
        [
          {
            id: '1',
            userId: 'u',
            cardId: 'c',
            scenarioId: 's1',
            correct: true,
            answeredAt: '2026-01-01T00:00:00.000Z',
            languagePair: { known: 'en' as const, learning: 'zh' as const },
            courseId: 'older-course',
          },
          {
            id: '2',
            userId: 'u',
            cardId: 'c',
            scenarioId: 's2',
            correct: true,
            answeredAt: '2026-01-02T00:00:00.000Z',
            languagePair: { known: 'en' as const, learning: 'zh' as const },
            courseId: 'newer-course',
          },
        ],
        { id: 'current-course' } as never,
      );
      expect(result).toBe('newer-course');
    });

    it('should return current course ID when no saved and no results', () => {
      const result = inferActiveCourseId(undefined, [], { id: 'fallback-course' } as never);
      expect(result).toBe('fallback-course');
    });

    it('should return null when no saved, no results, and no course', () => {
      const result = inferActiveCourseId(undefined, [], null);
      expect(result).toBeNull();
    });

    it('should ignore results without courseId', () => {
      const result = inferActiveCourseId(
        undefined,
        [
          {
            id: '1',
            userId: 'u',
            cardId: 'c',
            scenarioId: 's1',
            correct: true,
            answeredAt: '2026-01-02T00:00:00.000Z',
            languagePair: { known: 'en' as const, learning: 'zh' as const },
            courseId: undefined as never,
          },
        ],
        { id: 'fallback-course' } as never,
      );
      expect(result).toBe('fallback-course');
    });
  });

  describe('resolveLearningResumeTarget', () => {
    it('should suggest first scenario when nothing completed', () => {
      const demoCourse = getTestDemoCourseWithLessons();
      const target = resolveLearningResumeTarget({
        course: demoCourse,
        program: demoCourse.programs[0],
        pairResults: [],
        hasScenarioResult: () => false,
      });

      expect(target?.kind).toBe('start');
      expect(target?.scenarioId).toBe('demo-scenario');
      expect(target?.lessonTitle).toBe('Приветствия');
    });

    it('should continue next scenario in lesson', () => {
      const demoCourse = getTestDemoCourseWithLessons();
      const target = resolveLearningResumeTarget({
        course: demoCourse,
        program: demoCourse.programs[0],
        pairResults: [
          {
            id: '1',
            userId: 'u',
            cardId: 'c',
            scenarioId: 'demo-scenario',
            correct: true,
            answeredAt: '2026-01-02T00:00:00.000Z',
            languagePair: { known: 'ru', learning: 'en' },
            courseId: 'demo-course',
          },
        ],
        hasScenarioResult: (scenarioId) => scenarioId === 'demo-scenario',
      });

      expect(target?.kind).toBe('course-complete');
    });

    it('should return no-program when course has no lessons', () => {
      const emptyCourse = {
        ...getTestDemoCourseWithLessons(),
        programs: [],
      };
      const target = resolveLearningResumeTarget({
        course: emptyCourse,
        program: undefined as never,
        pairResults: [],
        hasScenarioResult: () => false,
      });

      expect(target?.kind).toBe('no-program');
      expect(target?.courseId).toBe(emptyCourse.id);
    });

    it('should return continue when has results but not all scenarios done', () => {
      const demoCourse = getTestDemoCourseWithLessons();
      const target = resolveLearningResumeTarget({
        course: demoCourse,
        program: demoCourse.programs[0],
        pairResults: [
          {
            id: '1',
            userId: 'u',
            cardId: 'c',
            scenarioId: 'demo-scenario',
            correct: true,
            answeredAt: '2026-01-02T00:00:00.000Z',
            languagePair: { known: 'ru', learning: 'en' },
            courseId: 'demo-course',
          },
        ],
        hasScenarioResult: () => false,
      });

      expect(target?.kind).toBe('continue');
    });

    it('should skip locked lessons', () => {
      const demoCourse = getTestDemoCourseWithLessons();
      const target = resolveLearningResumeTarget({
        course: demoCourse,
        program: demoCourse.programs[0],
        pairResults: [],
        hasScenarioResult: () => false,
      });

      // First lesson should be unlocked
      expect(target?.lessonTitle).toBe('Приветствия');
    });

    it('should return course-complete when all scenarios done', () => {
      const demoCourse = getTestDemoCourseWithLessons();
      const target = resolveLearningResumeTarget({
        course: demoCourse,
        program: demoCourse.programs[0],
        pairResults: [],
        hasScenarioResult: () => true,
      });

      expect(target?.kind).toBe('course-complete');
    });

    it('should use scenarioTitles when provided', () => {
      const demoCourse = getTestDemoCourseWithLessons();
      const target = resolveLearningResumeTarget({
        course: demoCourse,
        program: demoCourse.programs[0],
        pairResults: [],
        hasScenarioResult: () => false,
        scenarioTitles: { 'demo-scenario': 'Custom Title' },
      });

      expect(target?.scenarioTitle).toBe('Custom Title');
    });
  });

  describe('buildLessonRoadmap', () => {
    it('should build roadmap with locked lesson', () => {
      const demoCourse = getTestDemoCourseWithLessons();
      const roadmap = buildLessonRoadmap(demoCourse.programs[0].lessons, () => false);

      expect(roadmap).toHaveLength(2);
      expect(roadmap[0]?.unlocked).toBe(true);
      expect(roadmap[1]?.unlocked).toBe(false);
    });

    it('should mark completed lessons', () => {
      const demoCourse = getTestDemoCourseWithLessons();
      const roadmap = buildLessonRoadmap(demoCourse.programs[0].lessons, () => true);

      expect(roadmap[0]?.completed).toBe(true);
      expect(roadmap[0]?.completedScenarios).toBeGreaterThan(0);
    });

    it('should return block reason for locked lessons', () => {
      const demoCourse = getTestDemoCourseWithLessons();
      const roadmap = buildLessonRoadmap(demoCourse.programs[0].lessons, () => false);

      expect(roadmap[1]?.blockReason).toContain('урок');
    });
  });

  describe('courseMatchesActiveLanguagePair', () => {
    it('should detect course language pair mismatch', () => {
      expect(
        courseMatchesActiveLanguagePair(
          { languagePair: { known: 'en' as const, learning: 'zh' as const } },
          { known: 'en' as const, learning: 'ru' as const },
        ),
      ).toBe(false);
      expect(
        courseMatchesActiveLanguagePair(
          { languagePair: { known: 'en' as const, learning: 'zh' as const } },
          { known: 'en' as const, learning: 'zh' as const },
        ),
      ).toBe(true);
    });
  });

  describe('collectScenarioIds', () => {
    it('should collect unique scenario IDs from course lessons', () => {
      const demoCourse = getTestDemoCourseWithLessons();
      const ids = collectScenarioIds(demoCourse.programs[0]);

      expect(ids).toContain('demo-scenario');
      expect(ids.length).toBeGreaterThan(0);
    });

    it('should return unique IDs when scenarios repeat across lessons', () => {
      const program = {
        id: 'p1',
        courseId: 'c1',
        title: 'Test',
        description: '',
        lessonIds: ['l1', 'l2'],
        order: 0,
        updatedAt: '2024-01-01T00:00:00Z',
        lessons: [
          {
            id: 'l1',
            programId: 'p1',
            title: 'L1',
            description: '',
            scenarioIds: ['s1', 's2'],
            prerequisiteLessonIds: [],
            order: 0,
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'l2',
            programId: 'p1',
            title: 'L2',
            description: '',
            scenarioIds: ['s2', 's3'],
            prerequisiteLessonIds: [],
            order: 1,
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      };
      const ids = collectScenarioIds(program);

      expect(ids).toEqual(['s1', 's2', 's3']);
    });
  });
});
