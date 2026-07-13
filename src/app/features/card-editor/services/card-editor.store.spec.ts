import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CardsCatalogMockHandler } from '../../../core/api/cards/cards-catalog.mock.handler';
import { CardRepository, CardSearchService, ScenarioSearchService } from '../../../core/data';
import { seedTestContentCache } from '../../../core/data/content-seed/content-seed.test-utils';
import { USER_CONTENT_OVERLAY_KEY } from '../../../core/data/user/user-content-overlay.types';
import type { ScenarioIndexEntry } from '../../../core/models';
import { LearningResultsStore, UserStore } from '../../../core/state';
import { CardEditorStore } from './card-editor.store';
import { emptyLexemeCardDraft, emptyMemoryPairDraft, emptyOptionLexemes } from '../types';

describe('CardEditorStore', () => {
  let store: CardEditorStore;
  let cardRepository: CardRepository;
  let scenariosUsingCard: readonly ScenarioIndexEntry[];

  const selectCard = {
    id: 'select-test',
    kind: 'select' as const,
    title: 'Тест',
    direction: 'known-to-learning' as const,
    promptKnown: 'Q?',
    optionsLearning: ['A', 'B'],
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' as const },
  };

  beforeEach(async () => {
    localStorage.clear();
    seedTestContentCache();
    scenariosUsingCard = [];

    TestBed.configureTestingModule({
      providers: [
        CardEditorStore,
        CardRepository,
        CardsCatalogMockHandler,
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
    const cards = await cardRepository.ensureLoaded();
    cardRepository.save([...cards, selectCard]);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create select card and persist it', async () => {
    const created = await store.createCard(
      {
        kind: 'select',
        title: 'Новая',
        direction: 'known-to-learning',
        promptKnown: 'Вопрос?',
        optionsLearning: ['1', '2'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 1,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        ...emptyLexemeCardDraft(),
      },
      { knownLanguage: 'ru', learningLanguage: 'en' },
    );

    expect(created).toBeTrue();
    expect(cardRepository.loadStored().some((card) => card.title === 'Новая')).toBeTrue();
    expect(localStorage.getItem(USER_CONTENT_OVERLAY_KEY)).toContain('Новая');
  });

  it('should create memory card', async () => {
    const created = await store.createCard({
      kind: 'memory',
      title: 'Память',
      promptKnown: 'Пары',
      pairs: [{ ...emptyMemoryPairDraft(), known: 'A', learning: 'B' }],
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      ...emptyLexemeCardDraft(),
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
      languagePair: { known: 'ru', learning: 'en' },
    });

    expect(await store.deleteCard('select-test')).toBeFalse();
    expect(store.error()).toContain('результаты');
  });

  it('should update and delete unused card', async () => {
    await store.updateCard('select-test', {
      kind: 'select',
      title: 'Updated',
      direction: 'known-to-learning',
      promptKnown: 'New?',
      optionsLearning: ['X', 'Y'],
      optionsLexemes: emptyOptionLexemes(2),
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'lg' },
      ...emptyLexemeCardDraft(),
    });

    expect(cardRepository.loadStored().find((card) => card.id === 'select-test')?.title).toBe(
      'Updated',
    );
    expect(await store.deleteCard('select-test')).toBeTrue();
  });
});
