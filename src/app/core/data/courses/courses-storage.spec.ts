import { seedTestContentCache, getTestDefaultCourseCatalog, getTestZhCourseCatalog } from '../content-seed/content-seed.test-utils';
import { mergeCourseCatalogWithDefaults } from './courses-storage';

describe('courses-storage', () => {
  beforeEach(() => {
    seedTestContentCache();
  });

  it('should include ru→zh demo courses and lessons', () => {
    const zhCatalog = getTestZhCourseCatalog();

    expect(zhCatalog.courses).toHaveSize(3);
    expect(zhCatalog.lessons).toHaveSize(16);
    expect(zhCatalog.courses.every((course) => course.languagePair.learning === 'zh')).toBeTrue();
  });

  it('should merge missing default courses and lessons into stored catalog', () => {
    const defaults = getTestDefaultCourseCatalog();
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
    expect(merged.courses.length).toBe(defaults.courses.length + 1);
    expect(merged.lessons.length).toBe(defaults.lessons.length + 1);
  });

  it('should keep default languagePair when stored course overrides without it', () => {
    const merged = mergeCourseCatalogWithDefaults({
      courses: [
        {
          id: 'course-zh-radicals-214',
          title: 'Пользовательское название',
          description: '',
          authorId: 'local-user',
          languagePair: undefined as unknown as import('../../models').LanguagePair,
          lessonIds: [],
          published: true,
          updatedAt: '2026-06-14T10:00:00.000Z',
        },
      ],
      lessons: [],
    });

    const radicals = merged.courses.find((course) => course.id === 'course-zh-radicals-214');
    expect(radicals?.title).toBe('Пользовательское название');
    expect(radicals?.languagePair).toEqual({ known: 'ru', learning: 'zh' });
    expect(radicals?.lessonIds.length).toBeGreaterThan(0);
  });

  it('should keep default zh languagePair when stored seed course has en pair', () => {
    const merged = mergeCourseCatalogWithDefaults({
      courses: [
        {
          id: 'course-zh-radicals-214',
          title: '214 китайских радикалов',
          description: '',
          authorId: 'local-user',
          languagePair: { known: 'ru', learning: 'en' },
          lessonIds: [],
          published: true,
          updatedAt: '2026-06-14T10:00:00.000Z',
        },
      ],
      lessons: [],
    });

    expect(
      merged.courses.find((course) => course.id === 'course-zh-radicals-214')?.languagePair,
    ).toEqual({ known: 'ru', learning: 'zh' });
  });
});
