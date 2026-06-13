import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CardRepository, CARDS_STORAGE_KEY, CardSearchService, ScenarioSearchService } from '../../../core/data';
import type { ScenarioIndexEntry } from '../../../core/models';
import { LearningResultsStore, UserStore } from '../../../core/state';
import { CardEditorStore } from './card-editor.store';

describe('CardEditorStore', () => {
  let store: CardEditorStore;
  let cardRepository: CardRepository;
  let scenariosUsingCard: readonly ScenarioIndexEntry[];

  const selectCard = {
    id: 'select-test',
    kind: 'select' as const,
    title: 'Тест',
    question: 'Q?',
    options: ['A', 'B'],
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' as const },
  };

  beforeEach(() => {
    localStorage.clear();
    scenariosUsingCard = [];

    TestBed.configureTestingModule({
      providers: [
        CardEditorStore,
        CardRepository,
        LearningResultsStore,
        UserStore,
        provideHttpClient(),
        {
          provide: CardSearchService,
          useValue: {
            refreshCatalog: () => undefined,
            getCardById: async () => selectCard,
          },
        },
        {
          provide: ScenarioSearchService,
          useValue: {
            findUsingCard: async () => scenariosUsingCard,
          },
        },
      ],
    });

    store = TestBed.inject(CardEditorStore);
    cardRepository = TestBed.inject(CardRepository);
    cardRepository.save([selectCard]);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create select card and persist it', async () => {
    const created = await store.createCard({
      kind: 'select',
      title: 'Новая',
      question: 'Вопрос?',
      options: ['1', '2'],
      correctIndex: 1,
      appearance: { theme: 'azure-blue', fontSize: 'md' },
    });

    expect(created).toBeTrue();
    expect(cardRepository.loadStored().some((card) => card.title === 'Новая')).toBeTrue();
    expect(localStorage.getItem(CARDS_STORAGE_KEY)).toContain('Новая');
  });

  it('should create memory card', async () => {
    const created = await store.createCard({
      kind: 'memory',
      title: 'Память',
      prompt: 'Пары',
      pairs: [{ front: 'A', back: 'B' }],
      appearance: { theme: 'azure-blue', fontSize: 'md' },
    });

    expect(created).toBeTrue();
    expect(cardRepository.loadStored().some((card) => card.kind === 'memory')).toBeTrue();
  });

  it('should block delete when card is used in scenario', async () => {
    scenariosUsingCard = [
      {
        id: 'scenario-1',
        title: 'Demo',
        authorId: 'local-user',
        cardSourceMode: 'fixed',
        cardSourceSummary: '1 карточек',
        published: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    expect(await store.deleteCard('select-test')).toBeFalse();
    expect(store.error()).toContain('сценариях');
  });

  it('should block delete when learning results exist', async () => {
    TestBed.inject(LearningResultsStore).addResult({
      id: 'result-1',
      userId: 'local-user',
      cardId: 'select-test',
      scenarioId: 'demo',
      correct: true,
      answeredAt: new Date().toISOString(),
    });

    expect(await store.deleteCard('select-test')).toBeFalse();
    expect(store.error()).toContain('результаты');
  });

  it('should update and delete unused card', async () => {
    await store.updateCard('select-test', {
      kind: 'select',
      title: 'Updated',
      question: 'New?',
      options: ['X', 'Y'],
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'lg' },
    });

    expect(cardRepository.loadStored().find((card) => card.id === 'select-test')?.title).toBe(
      'Updated',
    );
    expect(await store.deleteCard('select-test')).toBeTrue();
  });
});
