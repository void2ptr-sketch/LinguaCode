import type { ScenarioIndexEntry } from '../model';
import { matchesScenarioIndexEntry } from './scenario-search.utils';

const baseEntry: ScenarioIndexEntry = {
  id: 's1',
  title: 'Demo scenario',
  authorId: 'local-user',
  cardSourceMode: 'fixed',
  cardSourceSummary: '1 карточек',
  published: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
  languagePairSummary: 'Русский → English',
};

describe('scenario-search.utils', () => {
  it('should match entry by active language pair criteria', () => {
    const matches = matchesScenarioIndexEntry(
      baseEntry,
      { scope: 'published', knownLanguage: 'ru', learningLanguage: 'en' },
      'other-user',
    );

    expect(matches).toBe(true);
  });

  it('should hide entry when language pair criteria mismatch', () => {
    const matches = matchesScenarioIndexEntry(
      baseEntry,
      { scope: 'published', knownLanguage: 'ru', learningLanguage: 'zh' },
      'other-user',
    );

    expect(matches).toBe(false);
  });

  it('should hide legacy entries without languagePairSummary in strict pair filter', () => {
    const legacyEntry: ScenarioIndexEntry = { ...baseEntry, languagePairSummary: undefined };

    const matches = matchesScenarioIndexEntry(
      legacyEntry,
      { scope: 'published', knownLanguage: 'ru', learningLanguage: 'en' },
      'other-user',
    );

    expect(matches).toBe(false);
  });

  it('should hide mine-scope entries from other users', () => {
    const matches = matchesScenarioIndexEntry(baseEntry, { scope: 'mine' }, 'other-user');

    expect(matches).toBe(false);
  });

  it('should show mine-scope entries for the owner', () => {
    const matches = matchesScenarioIndexEntry(baseEntry, { scope: 'mine' }, 'local-user');

    expect(matches).toBe(true);
  });

  it('should hide unpublished entries from non-authors in published scope', () => {
    const unpublishedEntry: ScenarioIndexEntry = { ...baseEntry, published: false };

    const matches = matchesScenarioIndexEntry(
      unpublishedEntry,
      { scope: 'published' },
      'other-user',
    );

    expect(matches).toBe(false);
  });

  it('should show unpublished entries to their author in published scope', () => {
    const unpublishedEntry: ScenarioIndexEntry = { ...baseEntry, published: false };

    const matches = matchesScenarioIndexEntry(
      unpublishedEntry,
      { scope: 'published' },
      'local-user',
    );

    expect(matches).toBe(true);
  });

  it('should filter by authorId', () => {
    const matches = matchesScenarioIndexEntry(
      baseEntry,
      { scope: 'published', authorId: 'different-author' },
      'local-user',
    );

    expect(matches).toBe(false);
  });

  it('should match when authorId matches', () => {
    const matches = matchesScenarioIndexEntry(
      baseEntry,
      { scope: 'published', authorId: 'local-user' },
      'local-user',
    );

    expect(matches).toBe(true);
  });

  it('should filter by cardSourceMode', () => {
    const matches = matchesScenarioIndexEntry(
      baseEntry,
      { scope: 'published', cardSourceMode: 'criteria' },
      'local-user',
    );

    expect(matches).toBe(false);
  });

  it('should match when cardSourceMode matches', () => {
    const matches = matchesScenarioIndexEntry(
      baseEntry,
      { scope: 'published', cardSourceMode: 'fixed' },
      'local-user',
    );

    expect(matches).toBe(true);
  });

  it('should filter by courseId', () => {
    const entryWithCourse: ScenarioIndexEntry = {
      ...baseEntry,
      courseId: 'course-1',
    };

    const matches = matchesScenarioIndexEntry(
      entryWithCourse,
      { scope: 'published', courseId: 'course-2' },
      'local-user',
    );

    expect(matches).toBe(false);
  });

  it('should match when courseId matches', () => {
    const entryWithCourse: ScenarioIndexEntry = {
      ...baseEntry,
      courseId: 'course-1',
    };

    const matches = matchesScenarioIndexEntry(
      entryWithCourse,
      { scope: 'published', courseId: 'course-1' },
      'local-user',
    );

    expect(matches).toBe(true);
  });

  it('should filter by text query in title', () => {
    const matches = matchesScenarioIndexEntry(
      baseEntry,
      { scope: 'published', query: 'nonexistent' },
      'local-user',
    );

    expect(matches).toBe(false);
  });

  it('should match when query matches title', () => {
    const matches = matchesScenarioIndexEntry(
      baseEntry,
      { scope: 'published', query: 'demo' },
      'local-user',
    );

    expect(matches).toBe(true);
  });

  it('should match query case-insensitively', () => {
    const matches = matchesScenarioIndexEntry(
      baseEntry,
      { scope: 'published', query: 'DEMO' },
      'local-user',
    );

    expect(matches).toBe(true);
  });

  it('should trim query before matching', () => {
    const matches = matchesScenarioIndexEntry(
      baseEntry,
      { scope: 'published', query: '  demo  ' },
      'local-user',
    );

    expect(matches).toBe(true);
  });
});
