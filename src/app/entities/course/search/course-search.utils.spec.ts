import { describe, expect, it } from 'vitest';

import { filterCourseIndex, matchesCourseIndexEntry } from './course-search.utils';
import type { CourseIndexEntry } from '../model';

function entry(overrides: Partial<CourseIndexEntry>): CourseIndexEntry {
  return {
    id: 'c1',
    title: 'Course 1',
    authorId: 'author-1',
    programCount: 1,
    published: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    languagePairSummary: 'Russian → English',
    knownLanguage: 'ru',
    learningLanguage: 'en',
    ...overrides,
  };
}

const ruEn = entry({ id: 'c-ru-en', knownLanguage: 'ru', learningLanguage: 'en' });
const ruZh = entry({
  id: 'c-ru-zh',
  knownLanguage: 'ru',
  learningLanguage: 'zh',
  languagePairSummary: 'Russian → Chinese',
});

describe('course-search.utils — multi-pair criteria', () => {
  it('keeps entries matching ANY of the listed pairs', () => {
    const result = filterCourseIndex(
      [ruEn, ruZh],
      { scope: 'all', languagePairs: [{ known: 'ru', learning: 'zh' }] },
      'user-1',
    );

    expect(result.map((item) => item.id)).toEqual(['c-ru-zh']);
  });

  it('matches multiple pairs with OR semantics', () => {
    const result = filterCourseIndex(
      [ruEn, ruZh],
      {
        scope: 'all',
        languagePairs: [
          { known: 'ru', learning: 'en' },
          { known: 'ru', learning: 'zh' },
        ],
      },
      'user-1',
    );

    expect(result.map((item) => item.id)).toEqual(['c-ru-en', 'c-ru-zh']);
  });

  it('returns no entries when no pair matches', () => {
    const result = filterCourseIndex(
      [ruEn, ruZh],
      { scope: 'all', languagePairs: [{ known: 'en', learning: 'de' }] },
      'user-1',
    );

    expect(result).toEqual([]);
  });

  it('falls back to single-pair criteria when languagePairs is absent', () => {
    const result = filterCourseIndex(
      [ruEn, ruZh],
      { scope: 'all', knownLanguage: 'ru', learningLanguage: 'zh' },
      'user-1',
    );

    expect(result.map((item) => item.id)).toEqual(['c-ru-zh']);
  });

  it('keeps all entries when no pair criteria are set', () => {
    const result = filterCourseIndex([ruEn, ruZh], { scope: 'all' }, 'user-1');

    expect(result.length).toBe(2);
  });

  it('matchesCourseIndexEntry returns true for ANY matching pair', () => {
    const matches = matchesCourseIndexEntry(
      ruZh,
      {
        scope: 'all',
        languagePairs: [
          { known: 'ru', learning: 'en' },
          { known: 'ru', learning: 'zh' },
        ],
      },
      'user-1',
    );

    expect(matches).toBe(true);
  });
});
