import { TestBed } from '@angular/core/testing';

import { CardsApiService } from '../../repositories/cards/api/cards-api.service';
import { CardRepository } from '../../repositories/cards/repository/card.repository';
import { CardsCatalogMockHandler } from './cards-catalog.mock.handler';
import { cardsApiMockInterceptor } from './cards-api.mock.interceptor';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

describe('CardsCatalogMockHandler', () => {
  let api: CardsApiService;
  let handler: CardsCatalogMockHandler;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        CardsApiService,
        CardRepository,
        CardsCatalogMockHandler,
        provideHttpClient(withFetch(), withInterceptors([cardsApiMockInterceptor])),
      ],
    });

    api = TestBed.inject(CardsApiService);
    handler = TestBed.inject(CardsCatalogMockHandler);
  });

  afterEach(() => {
    localStorage.clear();
    handler.resetCache();
  });

  it('returns multiple cards by ids', async () => {
    const cards = await api.getByIds(['select-1', 'select-2']);

    expect(cards.length).toBe(2);
    expect(cards.map((c) => c.id)).toContain('select-1');
    expect(cards.map((c) => c.id)).toContain('select-2');
  });

  it('returns only existing cards when some ids are missing', async () => {
    const cards = await api.getByIds(['select-1', 'non-existent-id']);

    expect(cards.length).toBe(1);
    expect(cards[0].id).toBe('select-1');
  });

  it('returns empty array for all missing ids', async () => {
    const cards = await api.getByIds(['missing-1', 'missing-2']);

    expect(cards.length).toBe(0);
  });

  it('returns index entry for a known card', async () => {
    const entry = await handler.getIndexEntry('select-1');

    expect(entry).toBeDefined();
    expect(entry!.id).toBe('select-1');
  });

  it('returns null for unknown card index entry', async () => {
    const entry = await handler.getIndexEntry('non-existent-card');

    expect(entry).toBeNull();
  });

  it('clears cached data on resetCache', async () => {
    // Ensure data is loaded
    await handler.ensureIndexForCardLookup();

    handler.resetCache();

    // Next access should reload data
    const entry = await handler.getIndexEntry('select-1');
    expect(entry).toBeDefined();
  });
});
