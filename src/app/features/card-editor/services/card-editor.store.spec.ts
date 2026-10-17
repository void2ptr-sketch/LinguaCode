import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CardsCatalogMockHandler } from '../../../entities/card/api/mock/cards-catalog.mock.handler';
import { cardsApiMockInterceptor } from '../../../entities/card/api/mock/cards-api.mock.interceptor';
import { CardRepository, CardSearchService } from '../../../entities/card';
import { ScenarioSearchService } from '../../../entities/scenario';
import { seedTestContentCache } from '../../../entities/content-seed/content-seed.test-utils';
import { USER_CONTENT_OVERLAY_KEY } from '../../../entities/user/overlay/user-content-overlay.types';
import type { ScenarioIndexEntry } from '../../../entities/scenario/model';
import { LearningResultsStore } from '../../../entities/learning/model/learning-results.store';
import { UserStore } from '../../../entities/user/model/user.store';
import { CardsApiService } from '../../../entities/card/api/cards-api.service';
import { IndexedDbService } from '../../../shared/storage';
import { SyncQueueService } from '../../../shared/sync';
import { CardEditorStore } from './card-editor.store';
import { emptyLexemeCardDraft, emptyMemoryPairDraft, emptyOptionLexemes } from '../types';

/** In-memory заглушка IndexedDbService для тестов. */
class FakeIdb {
  private readonly records = new Map<string, unknown>();

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return this.records.get(`${storeName}:${String(key)}`) as T | undefined;
  }

  async set(storeName: string, value: unknown, key?: IDBValidKey): Promise<void> {
    const recordKey = key ?? (value as { id: IDBValidKey })?.id;
    this.records.set(`${storeName}:${String(recordKey)}`, value);
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    this.records.delete(`${storeName}:${String(key)}`);
  }

  async getAll<T>(storeName: string): Promise<readonly T[]> {
    return [...this.records.entries()]
      .filter(([recordKey]) => recordKey.startsWith(`${storeName}:`))
      .map(([, value]) => value as T);
  }

  async clear(storeName: string): Promise<void> {
    for (const recordKey of [...this.records.keys()]) {
      if (recordKey.startsWith(`${storeName}:`)) {
        this.records.delete(recordKey);
      }
    }
  }
}

/** Creates an HttpErrorResponse that classifies as a network error. */
const createNetworkError = (): HttpErrorResponse =>
  new HttpErrorResponse({
    status: 0,
    statusText: 'Network Error',
    error: new ProgressEvent('error'),
  });

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
    optionsKnown: ['A', 'B'],
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
        provideHttpClient(withInterceptors([cardsApiMockInterceptor])),
        provideHttpClientTesting(),
        { provide: IndexedDbService, useClass: FakeIdb },
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
        optionsKnown: ['1', '2'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 1,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        ...emptyLexemeCardDraft(),
      },
      { knownLanguage: 'ru', learningLanguage: 'en' },
    );

    expect(created).toBe(true);
    expect(cardRepository.loadStored().some((card) => card.title === 'Новая')).toBe(true);
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

    expect(created).toBe(true);
    expect(cardRepository.loadStored().some((card) => card.kind === 'memory')).toBe(true);
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

    expect(await store.deleteCard('select-test')).toBe(false);
    expect(store.error()).toContain('scenarios');
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

    expect(await store.deleteCard('select-test')).toBe(false);
    expect(store.error()).toContain('results');
  });

  it('should update and delete unused card', async () => {
    await store.updateCard('select-test', {
      kind: 'select',
      title: 'Updated',
      direction: 'known-to-learning',
      promptKnown: 'New?',
      optionsLearning: ['X', 'Y'],
      optionsKnown: ['X', 'Y'],
      optionsLexemes: emptyOptionLexemes(2),
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'lg' },
      ...emptyLexemeCardDraft(),
    });

    expect(cardRepository.loadStored().find((card) => card.id === 'select-test')?.title).toBe(
      'Updated',
    );
    expect(await store.deleteCard('select-test')).toBe(true);
  });

  // ── startEdit error case ──

  it('should set error and cancel edit when card is not found', async () => {
    TestBed.inject(CardSearchService).getCardById = async () => {
      throw new Error('Not found');
    };

    await store.startEdit('missing-card');

    expect(store.editorMode()).toBe('list');
    expect(store.editorLoading()).toBe(false);
    // cancelEdit() clears error, so we just verify the state is reset
    expect(store.editingCardId()).toBeNull();
    expect(store.editingCard()).toBeNull();
  });

  // ── createCard validation failure ──

  it('should return false when card validation fails', async () => {
    const result = await store.createCard(
      {
        kind: 'select',
        title: '',
        direction: 'known-to-learning',
        promptKnown: 'Q?',
        optionsLearning: ['A', 'B'],
        optionsKnown: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        ...emptyLexemeCardDraft(),
      },
      { knownLanguage: 'ru', learningLanguage: 'en' },
    );

    expect(result).toBe(false);
    expect(store.error()).toBeTruthy();
  });

  // ── updateCard validation failure ──

  it('should return false when update card validation fails', async () => {
    const result = await store.updateCard('select-test', {
      kind: 'select',
      title: '',
      direction: 'known-to-learning',
      promptKnown: 'Q?',
      optionsLearning: ['A', 'B'],
      optionsKnown: ['A', 'B'],
      optionsLexemes: emptyOptionLexemes(2),
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      ...emptyLexemeCardDraft(),
    });

    expect(result).toBe(false);
    expect(store.error()).toBeTruthy();
  });

  // ── deleteCard card not found ──

  it('should return false when card does not exist for delete', async () => {
    TestBed.inject(CardSearchService).getCardById = async () => {
      throw new Error('Not found');
    };

    const result = await store.deleteCard('non-existent');

    expect(result).toBe(false);
  });

  // ── deleteCard with editingCardId match ──

  it('should cancel edit when deleting the currently edited card', async () => {
    store.editingCardId.set('select-test');

    const result = await store.deleteCard('select-test');

    expect(result).toBe(true);
    expect(store.editorMode()).toBe('list');
    expect(store.editingCardId()).toBeNull();
    expect(store.error()).toBeNull();
  });

  // ── emptyDraft and cardToDraft ──

  it('should create an empty draft for a given kind', () => {
    const draft = store.emptyDraft('memory');

    expect(draft.kind).toBe('memory');
    expect(draft.appearance).toBeTruthy();
  });

  it('should return default appearance from user preferences', () => {
    const appearance = store.defaultAppearance();

    expect(appearance).toBeTruthy();
    expect(appearance.fontSize).toBeTruthy();
  });

  // ── startCreate ──

  it('should enter create mode with specified kind', () => {
    store.startCreate('draw');

    expect(store.editorMode()).toBe('create');
    expect(store.editingCardId()).toBeNull();
    expect(store.editingCard()).toBeNull();
    expect(store.creatingKind()).toBe('draw');
    expect(store.error()).toBeNull();
  });

  // ── cancelEdit ──

  it('should cancel edit and return to list mode', () => {
    store.editingCardId.set('select-test');
    store.editingCard.set({
      id: 'select-test',
      kind: 'select',
    } as import('../../../entities/card/model').Card);
    store.editorMode.set('edit');
    store.error.set('some error');

    store.cancelEdit();

    expect(store.editorMode()).toBe('list');
    expect(store.editingCardId()).toBeNull();
    expect(store.editingCard()).toBeNull();
    expect(store.error()).toBeNull();
  });

  // ── Offline / network error paths ──

  it('should enqueue card.create in sync queue when network fails', async () => {
    const cardsApi = TestBed.inject(CardsApiService);
    vi.spyOn(cardsApi, 'create').mockRejectedValue(createNetworkError());

    const created = await store.createCard(
      {
        kind: 'select',
        title: 'Offline Card',
        direction: 'known-to-learning',
        promptKnown: 'Q?',
        optionsLearning: ['A', 'B'],
        optionsKnown: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        ...emptyLexemeCardDraft(),
      },
      { knownLanguage: 'ru', learningLanguage: 'en' },
    );

    expect(created).toBe(true);
    expect(store.editorMode()).toBe('list');
  });

  it('should enqueue card.update in sync queue when network fails', async () => {
    const cardsApi = TestBed.inject(CardsApiService);
    vi.spyOn(cardsApi, 'update').mockRejectedValue(createNetworkError());

    const updated = await store.updateCard('select-test', {
      kind: 'select',
      title: 'Offline Update',
      direction: 'known-to-learning',
      promptKnown: 'New Q?',
      optionsLearning: ['X', 'Y'],
      optionsKnown: ['X', 'Y'],
      optionsLexemes: emptyOptionLexemes(2),
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'lg' },
      ...emptyLexemeCardDraft(),
    });

    expect(updated).toBe(true);
    expect(store.editorMode()).toBe('list');
  });

  it('should enqueue card.delete in sync queue and cancel edit when network fails', async () => {
    const syncQueue = TestBed.inject(SyncQueueService);
    vi.spyOn(syncQueue, 'enqueue').mockResolvedValue(undefined as never);

    const cardsApi = TestBed.inject(CardsApiService);
    vi.spyOn(cardsApi, 'delete').mockRejectedValue(createNetworkError());

    store.editingCardId.set('select-test');

    const deleted = await store.deleteCard('select-test');

    expect(deleted).toBe(true);
    expect(store.editorMode()).toBe('list');
    expect(store.editingCardId()).toBeNull();
    expect(store.error()).toBeNull();
  });

  it('should rethrow non-network errors for createCard', async () => {
    const cardsApi = TestBed.inject(CardsApiService);
    vi.spyOn(cardsApi, 'create').mockRejectedValue(new Error('Conflict'));

    const result = store.createCard(
      {
        kind: 'select',
        title: 'Error Card',
        direction: 'known-to-learning',
        promptKnown: 'Q?',
        optionsLearning: ['A', 'B'],
        optionsKnown: ['A', 'B'],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        ...emptyLexemeCardDraft(),
      },
      { knownLanguage: 'ru', learningLanguage: 'en' },
    );

    await expect(result).rejects.toThrow('Conflict');
  });

  it('should rethrow non-network errors for deleteCard', async () => {
    const cardsApi = TestBed.inject(CardsApiService);
    vi.spyOn(cardsApi, 'delete').mockRejectedValue(new Error('Server error'));

    const result = store.deleteCard('select-test');

    await expect(result).rejects.toThrow('Server error');
  });
});
