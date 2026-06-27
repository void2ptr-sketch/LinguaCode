import { DEFAULT_COURSE_CATALOG } from './courses-storage';
import {
  buildLessonRoadmap,
  courseMatchesActiveLanguagePair,
  resolveLearningResumeTarget,
} from './learning-resume.utils';
import type { CourseWithLessons } from '../models';

describe('learning-resume.utils', () => {
  const demoCourse: CourseWithLessons = {
    ...DEFAULT_COURSE_CATALOG.courses[0],
    lessons: DEFAULT_COURSE_CATALOG.lessons.filter((lesson) => lesson.courseId === 'demo-course'),
  };

  it('should suggest first scenario when nothing completed', () => {
    const target = resolveLearningResumeTarget({
      course: demoCourse,
      pairResults: [],
      hasScenarioResult: () => false,
    });

    expect(target?.kind).toBe('start');
    expect(target?.scenarioId).toBe('demo-scenario');
    expect(target?.lessonTitle).toBe('Приветствия');
  });

  it('should continue next scenario in lesson', () => {
    const target = resolveLearningResumeTarget({
      course: demoCourse,
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

  it('should build roadmap with locked lesson', () => {
    const roadmap = buildLessonRoadmap(demoCourse.lessons, () => false);

    expect(roadmap).toHaveSize(2);
    expect(roadmap[0]?.unlocked).toBeTrue();
    expect(roadmap[1]?.unlocked).toBeFalse();
  });

  it('should detect course language pair mismatch', () => {
    expect(
      courseMatchesActiveLanguagePair(
        { languagePair: { known: 'ru', learning: 'zh' } },
        { known: 'ru', learning: 'en' },
      ),
    ).toBeFalse();
    expect(
      courseMatchesActiveLanguagePair(
        { languagePair: { known: 'ru', learning: 'zh' } },
        { known: 'ru', learning: 'zh' },
      ),
    ).toBeTrue();
  });
});
