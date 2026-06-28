import type { CardIndexEntry } from '../models/card-index.types';

import { buildCardSearchFacets, filterCardIndex, matchesCardIndexEntry, matchesTagFacetEntry } from './card-search.utils';

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
    const facets = buildCardSearchFacets(entries, {
      learningLanguage: 'en',
      page: { page: 0, pageSize: 10 },
    });

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
    expect(
      matchesCardIndexEntry(entries[0], { learningLanguage: 'zh' }, 'learningLanguage'),
    ).toBeTrue();
    expect(matchesCardIndexEntry(entries[0], { learningLanguage: 'zh' })).toBeFalse();
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

    const facets = buildCardSearchFacets(taggedEntries, {
      tags: ['oracle'],
      page: { page: 0, pageSize: 10 },
    });

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

    expect(matchesTagFacetEntry(entry, { tags: ['oracle'] }, 'practice')).toBeTrue();
    expect(matchesTagFacetEntry(entry, { tags: ['oracle'] }, 'dbi-dbd')).toBeFalse();
    expect(matchesTagFacetEntry(entry, { tags: ['oracle', 'practice'] }, 'oracle')).toBeTrue();
    expect(matchesTagFacetEntry(entry, { tags: ['oracle', 'practice'] }, 'basics')).toBeFalse();
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
});
