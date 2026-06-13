import { TestBed } from '@angular/core/testing';

import { CardSearchService } from '../../core/data';
import { CardCatalogSearchStore } from './card-catalog-search.store';

describe('CardCatalogSearchStore', () => {
  let store: CardCatalogSearchStore;

  const searchMock = jasmine.createSpy('search').and.resolveTo({
    items: [],
    page: 0,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    facets: { kinds: [], tags: [] },
  });

  beforeEach(() => {
    searchMock.calls.reset();

    TestBed.configureTestingModule({
      providers: [
        CardCatalogSearchStore,
        {
          provide: CardSearchService,
          useValue: { search: searchMock, loading: () => false, error: () => null },
        },
      ],
    });

    store = TestBed.inject(CardCatalogSearchStore);
  });

  it('should lock pair on initWithActivePair and pass criteria to search', async () => {
    await store.initWithActivePair('ru', 'en');

    expect(store.pairLocked()).toBe(true);
    expect(store.knownLanguage()).toBe('ru');
    expect(store.learningLanguage()).toBe('en');
    expect(searchMock).toHaveBeenCalledWith(
      jasmine.objectContaining({ knownLanguage: 'ru', learningLanguage: 'en' }),
    );
  });

  it('should preserve locked pair in clearFilters', async () => {
    await store.initWithActivePair('ru', 'zh');
    store.setQuery('hello');
    store.setDifficulty('beginner');

    store.clearFilters();

    expect(store.query()).toBe('');
    expect(store.difficulty()).toBeNull();
    expect(store.knownLanguage()).toBe('ru');
    expect(store.learningLanguage()).toBe('zh');
    expect(store.pairLocked()).toBe(true);
  });

  it('should ignore manual language changes when pair is locked', async () => {
    await store.initWithActivePair('ru', 'en');
    const callsBefore = searchMock.calls.count();

    store.setKnownLanguage('zh');
    store.setLearningLanguage('zh');

    expect(store.knownLanguage()).toBe('ru');
    expect(store.learningLanguage()).toBe('en');
    expect(searchMock.calls.count()).toBe(callsBefore);
  });
});
