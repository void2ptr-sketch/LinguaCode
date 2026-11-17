import type { CardDifficulty, CardIndexEntry, CardKind } from '../model';

import {
  buildCardSearchFacets,
  filterCardIndex,
  matchesCardIndexEntry,
  matchesTagFacetEntry,
} from './card-search.utils';

describe('card-search.utils', () => {
  const entries: readonly CardIndexEntry[] = [
    {
      id: '1',
      kind: 'select',
      title: 'Приветствие',
      knownLanguage: 'ru',
      learningLanguage: 'en',
      difficulty: 'beginner',
      tags: ['greetings', 'vocabulary'],
      ipaReadings: [],
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      kind: 'memory',
      title: 'Пары слов',
      knownLanguage: 'ru',
      learningLanguage: 'en',
      difficulty: 'intermediate',
      tags: ['memory', 'vocabulary'],
      ipaReadings: [],
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: '3',
      kind: 'select',
      title: 'Числа',
      knownLanguage: 'ru',
      learningLanguage: 'zh',
      difficulty: 'beginner',
      tags: ['numbers'],
      ipaReadings: [],
      updatedAt: '2026-01-03T00:00:00.000Z',
    },
    {
      id: '4',
      kind: 'select',
      title: 'Hello (IPA)',
      knownLanguage: 'ru',
      learningLanguage: 'en',
      difficulty: 'intermediate',
      tags: ['select', 'ipa', 'phonetics'],
      ipaReadings: ['həˈləʊ', 'ɡʊdˈbaɪ'],
      updatedAt: '2026-01-04T00:00:00.000Z',
    },
  ];

  it('filters by query, learning language and kind', () => {
    const filtered = filterCardIndex(entries, {
      query: 'чис',
      learningLanguage: 'zh',
      kinds: ['select'],
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.map((entry) => entry.id)).toEqual(['3']);
  });

  it('filters by selected tags', () => {
    const filtered = filterCardIndex(entries, {
      tags: ['vocabulary'],
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.map((entry) => entry.id)).toEqual(['1', '2']);
  });

  it('builds facets with counts for active filters', () => {
    const facets = buildCardSearchFacets(
      entries,
      {
        learningLanguage: 'en',
        page: { page: 0, pageSize: 10 },
      },
      {
        languageCodes: ['en', 'zh'] as readonly string[],
        difficulties: ['beginner', 'intermediate', 'advanced'] as readonly CardDifficulty[],
        kinds: [
          'select',
          'memory',
          'keyboard',
          'draw',
          'sound',
          'timed',
          'tone',
          'reading',
          'code-select',
          'flip',
          'cloze',
          'code-trace',
        ] as readonly CardKind[],
      },
    );

    expect(facets.learningLanguages).toEqual([
      { value: 'en', count: 3 },
      { value: 'zh', count: 1 },
    ]);
    expect(facets.kinds).toEqual([
      { value: 'select', count: 2 },
      { value: 'memory', count: 1 },
    ]);
    expect(facets.tags.map((facet) => facet.value)).toContain('ipa');
    expect(facets.tags.find((facet) => facet.value === 'vocabulary')?.count).toBe(2);
  });

  it('ignores facet field when counting that facet', () => {
    expect(matchesCardIndexEntry(entries[0], { learningLanguage: 'zh' }, 'learningLanguage')).toBe(
      true,
    );
    expect(matchesCardIndexEntry(entries[0], { learningLanguage: 'zh' })).toBe(false);
  });

  it('refines tag facet counts using other selected tags', () => {
    const taggedEntries: readonly CardIndexEntry[] = [
      {
        id: 'a',
        kind: 'select',
        title: 'Oracle card',
        knownLanguage: 'ru',
        learningLanguage: 'perl',
        difficulty: 'advanced',
        tags: ['advanced', 'practice', 'oracle'],
        ipaReadings: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'b',
        kind: 'select',
        title: 'DBI card',
        knownLanguage: 'ru',
        learningLanguage: 'perl',
        difficulty: 'advanced',
        tags: ['advanced', 'practice', 'dbi-dbd'],
        ipaReadings: [],
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'c',
        kind: 'select',
        title: 'Basics card',
        knownLanguage: 'ru',
        learningLanguage: 'perl',
        difficulty: 'beginner',
        tags: ['beginner', 'basics', 'scalar-context'],
        ipaReadings: [],
        updatedAt: '2026-01-03T00:00:00.000Z',
      },
    ];

    const facets = buildCardSearchFacets(
      taggedEntries,
      {
        tags: ['oracle'],
        page: { page: 0, pageSize: 10 },
      },
      {
        difficulties: ['beginner', 'intermediate', 'advanced'] as readonly CardDifficulty[],
        kinds: [
          'select',
          'memory',
          'keyboard',
          'draw',
          'sound',
          'timed',
          'tone',
          'reading',
          'code-select',
          'flip',
          'cloze',
          'code-trace',
        ] as readonly CardKind[],
      },
    );

    expect(facets.tags.find((facet) => facet.value === 'oracle')?.count).toBe(1);
    expect(facets.tags.find((facet) => facet.value === 'practice')?.count).toBe(1);
    expect(facets.tags.find((facet) => facet.value === 'dbi-dbd')).toBeUndefined();
    expect(facets.tags.find((facet) => facet.value === 'beginner')).toBeUndefined();
  });

  it('matches tag facet entry with conjunctive tag filters', () => {
    const entry: CardIndexEntry = {
      id: 'a',
      kind: 'select',
      title: 'Oracle card',
      knownLanguage: 'ru',
      learningLanguage: 'perl',
      difficulty: 'advanced',
      tags: ['advanced', 'practice', 'oracle'],
      ipaReadings: [],
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    expect(matchesTagFacetEntry(entry, { tags: ['oracle'] }, 'practice')).toBe(true);
    expect(matchesTagFacetEntry(entry, { tags: ['oracle'] }, 'dbi-dbd')).toBe(false);
    expect(matchesTagFacetEntry(entry, { tags: ['oracle', 'practice'] }, 'oracle')).toBe(true);
    expect(matchesTagFacetEntry(entry, { tags: ['oracle', 'practice'] }, 'basics')).toBe(false);
  });

  it('filters by ipa tag facet', () => {
    const filtered = filterCardIndex(entries, {
      tags: ['ipa'],
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.map((entry) => entry.id)).toEqual(['4']);
  });

  it('searches by ipa transcription', () => {
    const filtered = filterCardIndex(entries, {
      query: 'həˈlə',
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.map((entry) => entry.id)).toEqual(['4']);
  });

  it('searches ipa with brackets normalized', () => {
    const filtered = filterCardIndex(entries, {
      query: '[ɡʊdˈbaɪ]',
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.map((entry) => entry.id)).toEqual(['4']);
  });

  // ── Additional uncovered branches ──

  it('should return true when query is empty', () => {
    const filtered = filterCardIndex(entries, {
      query: '',
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.length).toBe(entries.length);
  });

  it('should filter by knownLanguage', () => {
    const filtered = filterCardIndex(entries, {
      knownLanguage: 'ru',
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.map((entry) => entry.id)).toEqual(['1', '2', '3', '4']);
  });

  it('should filter by languagePairId', () => {
    const entryWithPair: CardIndexEntry = {
      id: '5',
      kind: 'select',
      title: 'Pair card',
      knownLanguage: 'ru',
      learningLanguage: 'en',
      difficulty: 'beginner',
      tags: [],
      ipaReadings: [],
      languagePairId: 'ru-en',
      updatedAt: '2026-01-05T00:00:00.000Z',
    };

    const filtered = filterCardIndex([entryWithPair], {
      languagePairId: 'ru-en',
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.length).toBe(1);
  });

  it('should filter by difficulty', () => {
    const filtered = filterCardIndex(entries, {
      difficulty: 'advanced',
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.length).toBe(0);
  });

  it('should filter by published flag when set to false', () => {
    const unpublishedEntry: CardIndexEntry = {
      id: 'unpub-1',
      kind: 'select',
      title: 'Unpublished',
      knownLanguage: 'ru',
      learningLanguage: 'en',
      difficulty: 'beginner',
      tags: [],
      ipaReadings: [],
      published: false,
      updatedAt: '2026-01-06T00:00:00.000Z',
    };

    const filtered = filterCardIndex([unpublishedEntry], {
      published: false,
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.length).toBe(1);
  });

  it('should filter by published flag when set to true', () => {
    const publishedEntry: CardIndexEntry = {
      id: 'pub-1',
      kind: 'select',
      title: 'Published',
      knownLanguage: 'ru',
      learningLanguage: 'en',
      difficulty: 'beginner',
      tags: [],
      ipaReadings: [],
      published: true,
      updatedAt: '2026-01-06T00:00:00.000Z',
    };

    const filtered = filterCardIndex([publishedEntry], {
      published: true,
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.length).toBe(1);
  });

  it('should default published to true when not set', () => {
    const entryNoPublished: CardIndexEntry = {
      id: 'no-pub',
      kind: 'select',
      title: 'No published field',
      knownLanguage: 'ru',
      learningLanguage: 'en',
      difficulty: 'beginner',
      tags: [],
      ipaReadings: [],
      updatedAt: '2026-01-06T00:00:00.000Z',
    };

    const filtered = filterCardIndex([entryNoPublished], {
      published: true,
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.length).toBe(1);
  });

  it('should filter by courseId', () => {
    const entryWithCourse: CardIndexEntry = {
      id: 'course-1',
      kind: 'select',
      title: 'Course card',
      knownLanguage: 'ru',
      learningLanguage: 'en',
      difficulty: 'beginner',
      tags: [],
      ipaReadings: [],
      courseId: 'radicals-214',
      updatedAt: '2026-01-07T00:00:00.000Z',
    };

    const filtered = filterCardIndex([entryWithCourse], {
      courseId: 'radicals-214',
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.length).toBe(1);
  });

  it('should filter by programId', () => {
    const entryWithProgram: CardIndexEntry = {
      id: 'prog-1',
      kind: 'select',
      title: 'Program card',
      knownLanguage: 'ru',
      learningLanguage: 'en',
      difficulty: 'beginner',
      tags: [],
      ipaReadings: [],
      programId: 'prog-1',
      updatedAt: '2026-01-07T00:00:00.000Z',
    };

    const filtered = filterCardIndex([entryWithProgram], {
      programId: 'prog-1',
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.length).toBe(1);
  });

  it('should filter by lessonId', () => {
    const entryWithLesson: CardIndexEntry = {
      id: 'lesson-1',
      kind: 'select',
      title: 'Lesson card',
      knownLanguage: 'ru',
      learningLanguage: 'en',
      difficulty: 'beginner',
      tags: [],
      ipaReadings: [],
      lessonId: 'lesson-1',
      updatedAt: '2026-01-07T00:00:00.000Z',
    };

    const filtered = filterCardIndex([entryWithLesson], {
      lessonId: 'lesson-1',
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.length).toBe(1);
  });

  it('should filter by scenarioId', () => {
    const entryWithScenario: CardIndexEntry = {
      id: 'scenario-1',
      kind: 'select',
      title: 'Scenario card',
      knownLanguage: 'ru',
      learningLanguage: 'en',
      difficulty: 'beginner',
      tags: [],
      ipaReadings: [],
      scenarioId: 'scenario-1',
      updatedAt: '2026-01-07T00:00:00.000Z',
    };

    const filtered = filterCardIndex([entryWithScenario], {
      scenarioId: 'scenario-1',
      page: { page: 0, pageSize: 10 },
    });

    expect(filtered.length).toBe(1);
  });

  it('should build facets with empty options when no language codes provided', () => {
    const facets = buildCardSearchFacets(entries, { page: { page: 0, pageSize: 10 } });

    expect(facets.knownLanguages).toEqual([]);
    expect(facets.learningLanguages).toEqual([]);
  });

  it('should filter out facets with zero count', () => {
    const facets = buildCardSearchFacets(
      entries,
      { page: { page: 0, pageSize: 10 } },
      {
        difficulties: ['beginner', 'intermediate', 'advanced'] as readonly CardDifficulty[],
        kinds: ['select', 'memory'] as readonly CardKind[],
      },
    );

    expect(facets.difficulties.map((d) => d.value)).toContain('beginner');
    expect(facets.difficulties.map((d) => d.value)).toContain('intermediate');
    expect(facets.difficulties.map((d) => d.value)).not.toContain('advanced');
  });
});
