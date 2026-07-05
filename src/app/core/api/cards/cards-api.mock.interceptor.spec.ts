import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { CardsApiService } from '../../data/cards-api.service';
import { CardRepository } from '../../data/card.repository';
import { cardsApiMockInterceptor } from './cards-api.mock.interceptor';

describe('cards API (mock interceptor)', () => {
  let api: CardsApiService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        CardsApiService,
        CardRepository,
        provideHttpClient(withFetch(), withInterceptors([cardsApiMockInterceptor])),
      ],
    });

    api = TestBed.inject(CardsApiService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('searches cards via GET /api/cards/search', async () => {
    const page = await api.search({
      learningLanguage: 'en',
      page: { page: 0, pageSize: 10 },
    });

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.totalItems).toBeGreaterThan(0);
    expect(page.facets.learningLanguages.some((facet) => facet.value === 'en')).toBeTrue();
  });

  it('loads card by id via GET /api/cards/:id', async () => {
    const card = await api.getById('select-1');

    expect(card.id).toBe('select-1');
    expect(card.kind).toBe('select');
  });

  it('returns 404 for unknown card id', async () => {
    await expectAsync(api.getById('missing-card')).toBeRejected();
  });
});
