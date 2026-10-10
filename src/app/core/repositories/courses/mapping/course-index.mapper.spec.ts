import { courseToIndexEntry } from './course-index.mapper';
import type { Course } from '../../../models';

function makeCourse(overrides?: Partial<Course>): Course {
  return {
    id: 'c1',
    title: 'Test Course',
    description: 'Description',
    authorId: 'local-user',
    languagePair: { known: 'ru', learning: 'zh' },
    lessonIds: ['l1', 'l2'],
    published: true,
    updatedAt: '2026-10-10T12:00:00.000Z',
    ...overrides,
  } as Course;
}

describe('course-index.mapper', () => {
  describe('courseToIndexEntry', () => {
    it('should map course to index entry with correct values', () => {
      const course = makeCourse();
      const entry = courseToIndexEntry(course, 5);

      expect(entry.id).toBe('c1');
      expect(entry.title).toBe('Test Course');
      expect(entry.authorId).toBe('local-user');
      expect(entry.lessonCount).toBe(5);
      expect(entry.published).toBe(true);
      expect(entry.updatedAt).toBe('2026-10-10T12:00:00.000Z');
      expect(entry.languagePairSummary).toBeTruthy();
      expect(typeof entry.languagePairSummary).toBe('string');
    });

    it('should use provided lessonCount', () => {
      const course = makeCourse();
      const entry = courseToIndexEntry(course, 0);
      expect(entry.lessonCount).toBe(0);
    });

    it('should handle unpublished courses', () => {
      const course = makeCourse({ published: false });
      const entry = courseToIndexEntry(course, 3);
      expect(entry.published).toBe(false);
    });

    it('should generate language pair summary for different pairs', () => {
      const course = makeCourse({ languagePair: { known: 'en', learning: 'zh' } as Course['languagePair'] });
      const entry = courseToIndexEntry(course, 1);
      expect(entry.languagePairSummary).toBeTruthy();
      expect(entry.languagePairSummary.length).toBeGreaterThan(0);
    });
  });
});
