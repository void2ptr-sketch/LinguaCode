import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { Card, DrawCard } from '../model';
import { CardRepository } from './card.repository';
import { seedTestContentCache } from '../../content-seed/content-seed.test-utils';
import { USER_CONTENT_OVERLAY_KEY } from '../../user/overlay/user-content-overlay.types';

const seedFixture = {
  cards: [
    {
      id: 'select-zh-1',
      kind: 'select',
      title: 'Приветствие (китайский)',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      direction: 'known-to-learning',
      promptKnown: 'Q',
      optionsLearning: ['你好'],
      correctIndex: 0,
    },
    {
      id: 'select-1',
      kind: 'select',
      title: 'Приветствие',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      direction: 'known-to-learning',
      promptKnown: 'Q',
      optionsLearning: ['Hello'],
      correctIndex: 0,
    },
  ],
} as const;

describe('CardRepository', () => {
  let repository: CardRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    seedTestContentCache();

    TestBed.configureTestingModule({
      providers: [CardRepository, provideHttpClient(), provideHttpClientTesting()],
    });

    repository = TestBed.inject(CardRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should load seed cards when overlay is empty', async () => {
    const cards = await repository.ensureLoaded();

    expect(cards.some((card) => card.id === 'select-zh-1')).toBe(true);
    expect(localStorage.getItem(USER_CONTENT_OVERLAY_KEY)).toBeNull();
  });

  it('should merge user cards from overlay with seed catalog', async () => {
    await repository.ensureLoaded();
    await repository.save([
      ...(await repository.ensureLoaded()),
      {
        id: 'custom-1',
        kind: 'select',
        title: 'ТЕСТ',
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        direction: 'known-to-learning',
        promptKnown: 'Q',
        optionsLearning: ['A'],
        correctIndex: 0,
      },
    ]);

    const cards = await repository.ensureLoaded();

    expect(cards.some((card) => card.id === 'custom-1')).toBe(true);
    expect(cards.some((card) => card.id === 'select-zh-1')).toBe(true);
    expect(localStorage.getItem(USER_CONTENT_OVERLAY_KEY)).toContain('custom-1');
  });

  it('should keep user-edited card when id matches seed', async () => {
    const seedCards = await repository.ensureLoaded();
    const edited = seedCards.map((card) =>
      card.id === 'select-zh-1'
        ? {
            ...card,
            title: 'Пользовательская версия',
          }
        : card,
    );

    repository.save(edited);
    const cards = await repository.ensureLoaded();

    expect(cards.find((card) => card.id === 'select-zh-1')?.title).toBe('Пользовательская версия');
  });

  it('should drop removed demo cards from overlay merge', () => {
    const merged = repository.mergeWithSeed(
      [
        {
          id: 'draw-jiangenshenfang-1',
          kind: 'draw',
          title: '将恩深房',
          appearance: { theme: 'azure-blue', fontSize: 'md' },
          promptKnown: 'Q',
          referenceHintKnown: '将恩深房',
          meaningKnown: '将恩深房',
        } as DrawCard,
        seedFixture.cards[0],
      ],
      [...seedFixture.cards],
    );

    expect(merged.some((card) => card.id === 'draw-jiangenshenfang-1')).toBe(false);
  });

  it('should merge draw card question fields from seed', () => {
    const seedDrawCard: DrawCard = {
      id: 'draw-1',
      kind: 'draw',
      title: 'Draw Test',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      promptKnown: '画',
      referenceHintKnown: 'hint',
      meaningKnown: 'meaning',
    };
    const userDrawCard: DrawCard = {
      id: 'draw-1',
      kind: 'draw',
      title: 'Draw Test User',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      promptKnown: '画',
      referenceHintKnown: 'user-hint',
    };

    const merged = repository.mergeWithSeed([userDrawCard], [seedDrawCard]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe('draw-1');
  });

  it('should merge non-draw cards normally', () => {
    const stored: Card = {
      id: 'select-1',
      kind: 'select',
      title: 'Updated Title',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      direction: 'known-to-learning',
      promptKnown: 'Q',
      optionsLearning: ['A'],
      correctIndex: 0,
    };

    const merged = repository.mergeWithSeed([stored], seedFixture.cards);

    expect(merged).toHaveLength(2);
    const found = merged.find((c) => c.id === 'select-1');
    expect(found?.title).toBe('Updated Title');
  });

  it('should find card by id', () => {
    const cards = seedFixture.cards;
    const found = repository.getById(cards, 'select-1');

    expect(found?.id).toBe('select-1');
    expect(found?.title).toBe('Приветствие');
  });

  it('should return null when card not found', () => {
    const cards = seedFixture.cards;
    const found = repository.getById(cards, 'nonexistent');

    expect(found).toBeNull();
  });

  it('should convert cards to catalog items', () => {
    const cards = seedFixture.cards;
    const items = repository.toCatalogItems(cards);

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      id: 'select-zh-1',
      kind: 'select',
      title: 'Приветствие (китайский)',
    });
    expect(items[1]).toEqual({
      id: 'select-1',
      kind: 'select',
      title: 'Приветствие',
    });
  });

  it('should return empty catalog for empty cards array', () => {
    const items = repository.toCatalogItems([]);
    expect(items).toEqual([]);
  });
});
