import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { CardsApiService } from '../cards-api.service';
import { CardRepository } from '../../repository/card.repository';
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
    TestBed.resetTestingModule();
  });

  it('searches cards via GET /api/cards/search', async () => {
    const page = await api.search({
      learningLanguage: 'en',
      page: { page: 0, pageSize: 10 },
    });

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.totalItems).toBeGreaterThan(0);
    expect(page.facets.learningLanguages.some((facet) => facet.value === 'en')).toBe(true);
  });

  it('loads card by id via GET /api/cards/:id', async () => {
    const card = await api.getById('select-1');

    expect(card.id).toBe('select-1');
    expect(card.kind).toBe('select');
  });

  it('returns 404 for unknown card id', async () => {
    await expect(api.getById('missing-card')).rejects.toThrow();
  });

  it('creates a card via POST /api/cards', async () => {
    const created = await api.create({
      id: 'select-created',
      kind: 'select',
      title: 'Created',
      direction: 'known-to-learning',
      promptKnown: 'Q?',
      optionsLearning: ['A', 'B'],
      optionsKnown: ['A', 'B'],
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'md' },
    });

    expect(created.id).toBe('select-created');

    const stored = await api.getById('select-created');
    expect(stored.title).toBe('Created');
  });

  it('updates a card via PUT /api/cards/:id', async () => {
    const current = await api.getById('select-1');
    const updated = await api.update('select-1', { ...current, title: 'Updated Title' });

    expect(updated.title).toBe('Updated Title');
    expect((await api.getById('select-1')).title).toBe('Updated Title');
  });

  it('deletes a card via DELETE /api/cards/:id', async () => {
    await api.delete('select-1');
    await expect(api.getById('select-1')).rejects.toThrow();
  });
});
