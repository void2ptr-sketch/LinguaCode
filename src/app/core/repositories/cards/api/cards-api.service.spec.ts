import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { CardsApiService } from './cards-api.service';
import { cardsApiMockInterceptor } from '../../../api/cards/cards-api.mock.interceptor';

describe('CardsApiService', () => {
  let service: CardsApiService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        CardsApiService,
        provideHttpClient(withFetch(), withInterceptors([cardsApiMockInterceptor])),
      ],
    });

    service = TestBed.inject(CardsApiService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('search', () => {
    it('searches cards and returns paginated results', async () => {
      const page = await service.search({
        learningLanguage: 'en',
        page: { page: 0, pageSize: 10 },
      });

      expect(page.items).toBeDefined();
      expect(Array.isArray(page.items)).toBe(true);
      expect(page.totalItems).toBeGreaterThan(0);
    });

    it('searches cards with tag filter', async () => {
      const page = await service.search({
        tags: ['hsk1'],
        page: { page: 0, pageSize: 20 },
      });

      expect(page.items).toBeDefined();
      expect(page.totalItems).toBeGreaterThanOrEqual(0);
    });

    it('returns empty results for non-matching criteria', async () => {
      const page = await service.search({
        tags: ['nonexistent-tag-xyz'],
        page: { page: 0, pageSize: 10 },
      });

      expect(page.items.length).toBe(0);
      expect(page.totalItems).toBe(0);
    });
  });

  describe('getById', () => {
    it('retrieves a card by ID', async () => {
      const card = await service.getById('select-1');

      expect(card).toBeDefined();
      expect(card.id).toBe('select-1');
      expect(card.kind).toBe('select');
    });

    it('throws for unknown card ID', async () => {
      await expect(service.getById('nonexistent-card-xyz')).rejects.toThrow();
    });
  });

  describe('getByIds', () => {
    it('returns empty array for empty input', async () => {
      const cards = await service.getByIds([]);
      expect(cards).toEqual([]);
    });

    it('retrieves multiple cards by IDs', async () => {
      const cards = await service.getByIds(['select-1', 'memory-1']);

      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeGreaterThan(0);
    });

    it('returns empty array when batch contains only unknown IDs', async () => {
      const cards = await service.getByIds(['nonexistent-xyz']);
      expect(cards).toEqual([]);
    });
  });
});
