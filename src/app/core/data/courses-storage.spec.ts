import {
  DEFAULT_COURSE_CATALOG,
  DEFAULT_ZH_COURSE_CATALOG,
  mergeCourseCatalogWithDefaults,
} from './courses-storage';

describe('courses-storage', () => {
  it('should include ru→zh demo courses and lessons', () => {
    expect(DEFAULT_ZH_COURSE_CATALOG.courses).toHaveSize(2);
    expect(DEFAULT_ZH_COURSE_CATALOG.lessons).toHaveSize(5);
    expect(
      DEFAULT_ZH_COURSE_CATALOG.courses.every((course) => course.languagePair.learning === 'zh'),
    ).toBeTrue();
  });

  it('should merge missing default courses and lessons into stored catalog', () => {
    const stored = {
      courses: [
        {
          id: 'custom-course',
          title: 'Custom course',
          description: 'User course',
          authorId: 'local-user',
          languagePair: { known: 'ru' as const, learning: 'zh' as const },
          lessonIds: ['custom-lesson'],
          published: true,
          updatedAt: '2026-06-14T10:00:00.000Z',
        },
      ],
      lessons: [
        {
          id: 'custom-lesson',
          courseId: 'custom-course',
          title: 'Custom lesson',
          description: 'User lesson',
          scenarioIds: ['scenario-zh-greetings'],
          prerequisiteLessonIds: [],
          order: 0,
          updatedAt: '2026-06-14T10:00:00.000Z',
        },
      ],
    };

    const merged = mergeCourseCatalogWithDefaults(stored);

    expect(merged.courses.some((course) => course.id === 'custom-course')).toBeTrue();
    expect(merged.courses.some((course) => course.id === 'course-zh-a1')).toBeTrue();
    expect(merged.lessons.some((lesson) => lesson.id === 'lesson-zh-greetings')).toBeTrue();
    expect(merged.courses.length).toBe(DEFAULT_COURSE_CATALOG.courses.length + 1);
    expect(merged.lessons.length).toBe(DEFAULT_COURSE_CATALOG.lessons.length + 1);
  });
});
