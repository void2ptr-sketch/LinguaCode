import type { CourseIndexEntry } from '../../models/course-index.types';
import { matchesCourseIndexEntry } from './course-search.utils';

const baseEntry: CourseIndexEntry = {
  id: 'c1',
  title: 'Demo course',
  authorId: 'local-user',
  lessonCount: 1,
  published: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
  languagePairSummary: 'Русский → English',
};

describe('course-search.utils', () => {
  it('should match entry by active language pair criteria', () => {
    const matches = matchesCourseIndexEntry(
      baseEntry,
      { scope: 'published', knownLanguage: 'ru', learningLanguage: 'en' },
      'other-user',
    );

    expect(matches).toBe(true);
  });

  it('should hide entry when language pair criteria mismatch', () => {
    const matches = matchesCourseIndexEntry(
      baseEntry,
      { scope: 'published', knownLanguage: 'ru', learningLanguage: 'zh' },
      'other-user',
    );

    expect(matches).toBe(false);
  });
});
