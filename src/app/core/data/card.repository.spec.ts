import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { DrawCard } from '../models';
import { CardRepository, CARDS_STORAGE_KEY } from './card.repository';

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

  it('should load seed cards when storage is empty', async () => {
    const loadPromise = repository.ensureLoaded();

    const mainRequest = httpMock.expectOne((req) => req.url.includes('select-cards.json'));
    mainRequest.flush(seedFixture);
    const radicalsRequest = httpMock.expectOne((req) => req.url.includes('radicals-course-cards.json'));
    radicalsRequest.flush({ cards: [] });

    const cards = await loadPromise;

    expect(cards).toHaveSize(2);
    expect(localStorage.getItem(CARDS_STORAGE_KEY)).toContain('select-zh-1');
  });

  it('should merge missing seed cards into existing storage', async () => {
    repository.save([
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

    const loadPromise = repository.ensureLoaded();
    const mainRequest = httpMock.expectOne((req) => req.url.includes('select-cards.json'));
    mainRequest.flush(seedFixture);
    const radicalsRequest = httpMock.expectOne((req) => req.url.includes('radicals-course-cards.json'));
    radicalsRequest.flush({ cards: [] });

    const cards = await loadPromise;

    expect(cards).toHaveSize(3);
    expect(cards.some((card) => card.id === 'custom-1')).toBeTrue();
    expect(cards.some((card) => card.id === 'select-zh-1')).toBeTrue();
    expect(cards.some((card) => card.id === 'select-1')).toBeTrue();
  });

  it('should keep user-edited card when id matches seed', async () => {
    repository.save([
      {
        id: 'select-zh-1',
        kind: 'select',
        title: 'Пользовательская версия',
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        direction: 'known-to-learning',
        promptKnown: 'Q',
        optionsLearning: ['A'],
        correctIndex: 0,
      },
    ]);

    const loadPromise = repository.ensureLoaded();
    const mainRequest = httpMock.expectOne((req) => req.url.includes('select-cards.json'));
    mainRequest.flush(seedFixture);
    const radicalsRequest = httpMock.expectOne((req) => req.url.includes('radicals-course-cards.json'));
    radicalsRequest.flush({ cards: [] });

    const cards = await loadPromise;

    expect(cards).toHaveSize(2);
    expect(cards.find((card) => card.id === 'select-zh-1')?.title).toBe('Пользовательская версия');
  });

  it('should drop removed demo cards from storage on merge', () => {
    repository.save([
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
    ]);

    const merged = repository.mergeWithSeed(repository.loadStored(), [...seedFixture.cards]);

    expect(merged.some((card) => card.id === 'draw-jiangenshenfang-1')).toBeFalse();
  });
});
