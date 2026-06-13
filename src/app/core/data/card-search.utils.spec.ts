import type { CardIndexEntry } from '../models/card-index.types';

import { buildCardSearchFacets, filterCardIndex, matchesCardIndexEntry } from './card-search.utils';

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
      updatedAt: '2026-01-03T00:00:00.000Z',
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
      { value: 'en', count: 2 },
      { value: 'zh', count: 1 },
    ]);
    expect(facets.kinds).toEqual([
      { value: 'select', count: 1 },
      { value: 'memory', count: 1 },
    ]);
    expect(facets.tags).toEqual([
      { value: 'greetings', count: 1 },
      { value: 'memory', count: 1 },
      { value: 'vocabulary', count: 2 },
    ]);
  });

  it('ignores facet field when counting that facet', () => {
    expect(
      matchesCardIndexEntry(entries[0], { learningLanguage: 'zh' }, 'learningLanguage'),
    ).toBeTrue();
    expect(matchesCardIndexEntry(entries[0], { learningLanguage: 'zh' })).toBeFalse();
  });
});
