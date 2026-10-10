import { vi } from 'vitest';

import { TestBed } from '@angular/core/testing';

import { CardSearchService } from './card-search.service';
import { CardsApiService } from '../api/cards-api.service';
import { CardsCatalogMockHandler } from '../../../api/cards/cards-catalog.mock.handler';
import type { CardSearchCriteria, CardSearchPage } from '../../../models';
import type { CardIndexEntry } from '../../../models';
describe('CardSearchService', () => {
  let service: CardSearchService;
  let cardsApiService: { search: ReturnType<typeof vi.fn>; getById: ReturnType<typeof vi.fn> };
  let catalogMockHandler: { resetCache: ReturnType<typeof vi.fn> };

  const mockIndexEntry: CardIndexEntry = {
    id: 'card-1',
    kind: 'select',
    title: 'Test Card',
    knownLanguage: 'ru',
    learningLanguage: 'en',
    difficulty: 'beginner',
    tags: ['test'],
    ipaReadings: [],
    updatedAt: new Date().toISOString(),
  };

  const mockSearchPage: CardSearchPage = {
    items: [mockIndexEntry],
    totalItems: 1,
    page: 0,
    pageSize: 20,
    totalPages: 1,
    facets: {
      kinds: [],
      difficulties: [],
      knownLanguages: [],
      learningLanguages: [],
      tags: [],
    },
  };

  beforeEach(async () => {
    const apiSpy = {
      search: vi.fn(),
      getById: vi.fn(),
    };
    const mockHandlerSpy = {
      resetCache: vi.fn(),
    };

    await TestBed.configureTestingModule({
      providers: [
        CardSearchService,
        { provide: CardsApiService, useValue: apiSpy },
        { provide: CardsCatalogMockHandler, useValue: mockHandlerSpy },
      ],
    }).compileComponents();

    service = TestBed.inject(CardSearchService);
    cardsApiService = TestBed.inject(CardsApiService) as never;
    catalogMockHandler = TestBed.inject(CardsCatalogMockHandler) as never;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty indexEntries initially', () => {
    expect(service.indexEntries()).toEqual([]);
  });

  it('should return loading false initially', () => {
    expect(service.loading()).toBe(false);
  });

  it('should return null error initially', () => {
    expect(service.error()).toBeNull();
  });

  it('should load index cache on ensureIndexLoaded', async () => {
    (cardsApiService.search as ReturnType<typeof vi.fn>).mockResolvedValue(mockSearchPage);

    await service.ensureIndexLoaded();

    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.indexEntries()).toEqual([mockIndexEntry]);
    expect(cardsApiService.search).toHaveBeenCalledWith({
      page: { page: 0, pageSize: 1000 },
    });
  });

  it('should set error when index loading fails', async () => {
    (cardsApiService.search as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));

    await service.ensureIndexLoaded();

    expect(service.loading()).toBe(false);
    expect(service.error()).toBe('Не удалось загрузить каталог карточек');
  });

  it('should skip loading if index cache is already populated', async () => {
    // Pre-populate by calling ensureIndexLoaded once
    (cardsApiService.search as ReturnType<typeof vi.fn>).mockResolvedValue(mockSearchPage);
    await service.ensureIndexLoaded();

    // Reset mock to check it's not called again
    (cardsApiService.search as ReturnType<typeof vi.fn>).mockClear();

    await service.ensureIndexLoaded();

    expect(cardsApiService.search).not.toHaveBeenCalled();
  });

  it('should search cards by criteria', async () => {
    const criteria: CardSearchCriteria = {
      query: 'test',
      page: { page: 0, pageSize: 20 },
    };
    (cardsApiService.search as ReturnType<typeof vi.fn>).mockResolvedValue(mockSearchPage);

    const result = await service.search(criteria);

    expect(result).toEqual(mockSearchPage);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(cardsApiService.search).toHaveBeenCalledWith(criteria);
  });

  it('should merge search results into index cache', async () => {
    const criteria: CardSearchCriteria = {
      query: 'test',
      page: { page: 0, pageSize: 20 },
    };
    (cardsApiService.search as ReturnType<typeof vi.fn>).mockResolvedValue(mockSearchPage);

    await service.ensureIndexLoaded();
    expect(service.indexEntries().length).toBe(1);

    const newEntry: CardIndexEntry = {
      ...mockIndexEntry,
      id: 'card-2',
      title: 'New Card',
    };
    const newPage: CardSearchPage = {
      ...mockSearchPage,
      items: [newEntry],
    };
    (cardsApiService.search as ReturnType<typeof vi.fn>).mockResolvedValue(newPage);

    await service.search(criteria);

    expect(service.indexEntries().length).toBe(2);
  });

  it('should set error when search fails', async () => {
    const criteria: CardSearchCriteria = {
      query: 'test',
      page: { page: 0, pageSize: 20 },
    };
    (cardsApiService.search as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));

    await expect(service.search(criteria)).rejects.toThrow('Card search failed');

    expect(service.loading()).toBe(false);
    expect(service.error()).toBe('Не удалось выполнить поиск карточек');
  });

  it('should get card by ID', async () => {
    const mockCard = { id: 'card-1', kind: 'select', title: 'Test' } as never;
    (cardsApiService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(mockCard);

    const result = await service.getCardById('card-1');

    expect(result).toEqual(mockCard);
    expect(service.loading()).toBe(false);
    expect(cardsApiService.getById).toHaveBeenCalledWith('card-1');
  });

  it('should set error when getCardById fails', async () => {
    (cardsApiService.getById as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Not found'));

    await expect(service.getCardById('nonexistent')).rejects.toThrow('Card not found');

    expect(service.loading()).toBe(false);
    expect(service.error()).toBe('Карточка не найдена');
  });

  it('should clear index cache and mock handler on refreshCatalog', async () => {
    // Pre-populate index
    (cardsApiService.search as ReturnType<typeof vi.fn>).mockResolvedValue(mockSearchPage);
    await service.ensureIndexLoaded();

    expect(service.indexEntries().length).toBe(1);

    service.refreshCatalog();

    expect(service.indexEntries()).toEqual([]);
    expect(catalogMockHandler.resetCache).toHaveBeenCalled();
  });

  it('should not merge empty entries into index cache', async () => {
    const emptyPage: CardSearchPage = {
      ...mockSearchPage,
      items: [],
    };
    (cardsApiService.search as ReturnType<typeof vi.fn>).mockResolvedValue(emptyPage);

    await service.search({
      query: 'test',
      page: { page: 0, pageSize: 20 },
    });

    expect(service.indexEntries()).toEqual([]);
  });
});
