import type { CourseIndexEntry } from '../model';
import { matchesCourseIndexEntry } from './course-search.utils';

const baseEntry: CourseIndexEntry = {
  id: 'c1',
  title: 'Demo course',
  authorId: 'local-user',
  programCount: 1,
  published: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
  languagePairSummary: 'Русский → English',
};

describe('course-search.utils', () => {
  describe('matchesCourseIndexEntry', () => {
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

    it('should default to mine scope when scope is undefined', () => {
      const matches = matchesCourseIndexEntry(
        baseEntry,
        { knownLanguage: 'ru', learningLanguage: 'en' },
        'local-user',
      );

      expect(matches).toBe(true);
    });

    it('should hide entry in mine scope when author differs', () => {
      const matches = matchesCourseIndexEntry(
        baseEntry,
        { scope: 'mine', knownLanguage: 'ru', learningLanguage: 'en' },
        'other-user',
      );

      expect(matches).toBe(false);
    });

    it('should show entry in mine scope when author matches', () => {
      const matches = matchesCourseIndexEntry(
        baseEntry,
        { scope: 'mine', knownLanguage: 'ru', learningLanguage: 'en' },
        'local-user',
      );

      expect(matches).toBe(true);
    });

    it('should show published entry for other user in published scope', () => {
      const matches = matchesCourseIndexEntry(
        baseEntry,
        { scope: 'published', knownLanguage: 'ru', learningLanguage: 'en' },
        'other-user',
      );

      expect(matches).toBe(true);
    });

    it('should hide unpublished entry for other user in published scope', () => {
      const unpublishedEntry = { ...baseEntry, published: false };
      const matches = matchesCourseIndexEntry(
        unpublishedEntry,
        { scope: 'published', knownLanguage: 'ru', learningLanguage: 'en' },
        'other-user',
      );

      expect(matches).toBe(false);
    });

    it('should show unpublished entry for own unpublished entry in published scope', () => {
      const unpublishedEntry = { ...baseEntry, published: false };
      const matches = matchesCourseIndexEntry(
        unpublishedEntry,
        { scope: 'published', knownLanguage: 'ru', learningLanguage: 'en' },
        'local-user',
      );

      expect(matches).toBe(true);
    });

    it('should filter by authorId when specified', () => {
      const matches = matchesCourseIndexEntry(
        baseEntry,
        {
          scope: 'published',
          authorId: 'different-author',
          knownLanguage: 'ru',
          learningLanguage: 'en',
        },
        'local-user',
      );

      expect(matches).toBe(false);
    });

    it('should match by authorId when specified and matches', () => {
      const matches = matchesCourseIndexEntry(
        baseEntry,
        {
          scope: 'published',
          authorId: 'local-user',
          knownLanguage: 'ru',
          learningLanguage: 'en',
        },
        'other-user',
      );

      expect(matches).toBe(true);
    });

    it('should filter by text query in title', () => {
      const matches = matchesCourseIndexEntry(
        baseEntry,
        {
          scope: 'published',
          query: 'demo',
          knownLanguage: 'ru',
          learningLanguage: 'en',
        },
        'other-user',
      );

      expect(matches).toBe(true);
    });

    it('should filter by text query in authorId', () => {
      const matches = matchesCourseIndexEntry(
        baseEntry,
        {
          scope: 'published',
          query: 'local-user',
          knownLanguage: 'ru',
          learningLanguage: 'en',
        },
        'other-user',
      );

      expect(matches).toBe(true);
    });

    it('should not match when query does not match title or authorId', () => {
      const matches = matchesCourseIndexEntry(
        baseEntry,
        {
          scope: 'published',
          query: 'nonexistent',
          knownLanguage: 'ru',
          learningLanguage: 'en',
        },
        'other-user',
      );

      expect(matches).toBe(false);
    });

    it('should trim query whitespace', () => {
      const matches = matchesCourseIndexEntry(
        baseEntry,
        {
          scope: 'published',
          query: '  demo  ',
          knownLanguage: 'ru',
          learningLanguage: 'en',
        },
        'other-user',
      );

      expect(matches).toBe(true);
    });

    it('should skip query filtering when query is empty', () => {
      const matches = matchesCourseIndexEntry(
        baseEntry,
        {
          scope: 'published',
          query: '',
          knownLanguage: 'ru',
          learningLanguage: 'en',
        },
        'other-user',
      );

      expect(matches).toBe(true);
    });

    it('should skip query filtering when query is whitespace only', () => {
      const matches = matchesCourseIndexEntry(
        baseEntry,
        {
          scope: 'published',
          query: '   ',
          knownLanguage: 'ru',
          learningLanguage: 'en',
        },
        'other-user',
      );

      expect(matches).toBe(true);
    });
  });
});
