import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CardSearchService } from '../../../core/data';
import { UserStore } from '../../../core/state';
import { ScenarioBuilderStore } from './scenario-builder.store';
import { ScenarioBuilderService, SCENARIOS_STORAGE_KEY } from './scenario-builder.service';

describe('ScenarioBuilderStore', () => {
  let store: ScenarioBuilderStore;
  let service: ScenarioBuilderService;

  const indexEntries = [
    {
      id: 'select-1',
      kind: 'select' as const,
      title: 'Приветствие',
      language: 'en' as const,
      difficulty: 'beginner' as const,
      tags: ['greetings'],
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'select-2',
      kind: 'select' as const,
      title: 'Числа',
      language: 'en' as const,
      difficulty: 'beginner' as const,
      tags: ['numbers'],
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        ScenarioBuilderStore,
        ScenarioBuilderService,
        UserStore,
        provideHttpClient(),
        {
          provide: CardSearchService,
          useValue: {
            ensureIndexLoaded: async () => undefined,
            indexEntries: () => indexEntries,
          },
        },
      ],
    });

    store = TestBed.inject(ScenarioBuilderStore);
    service = TestBed.inject(ScenarioBuilderService);
    store.scenarios.set(service.loadScenarios());
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create fixed scenario and persist it', () => {
    const created = store.createScenario({
      title: 'Новый сценарий',
      description: 'Описание',
      cardSource: { mode: 'fixed', cardIds: ['select-1'] },
    });

    expect(created).toBeTrue();
    expect(store.scenarios().some((scenario) => scenario.title === 'Новый сценарий')).toBeTrue();
    expect(localStorage.getItem(SCENARIOS_STORAGE_KEY)).toContain('Новый сценарий');
  });

  it('should create criteria scenario', () => {
    const created = store.createScenario({
      title: 'Dynamic',
      description: '',
      cardSource: {
        mode: 'criteria',
        criteria: { language: 'en' },
        limit: 5,
      },
    });

    expect(created).toBeTrue();
    expect(
      store.scenarios().find((scenario) => scenario.title === 'Dynamic')?.cardSource.mode,
    ).toBe('criteria');
  });

  it('should reject invalid draft', () => {
    const created = store.createScenario({
      title: '   ',
      description: '',
      cardSource: { mode: 'fixed', cardIds: [] },
    });

    expect(created).toBeFalse();
    expect(store.error()).toBe('Укажите название сценария');
  });

  it('should update and delete scenario', () => {
    store.createScenario({
      title: 'Temp',
      description: 'Desc',
      cardSource: { mode: 'fixed', cardIds: ['select-1'] },
    });

    const scenarioId = store.scenarios().find((scenario) => scenario.title === 'Temp')?.id;
    expect(scenarioId).toBeDefined();

    if (!scenarioId) {
      return;
    }

    store.updateScenario(scenarioId, {
      title: 'Updated',
      description: 'New desc',
      cardSource: { mode: 'fixed', cardIds: ['select-2'] },
    });

    expect(store.scenarios().find((scenario) => scenario.id === scenarioId)?.title).toBe('Updated');

    store.deleteScenario(scenarioId);
    expect(store.scenarios().some((scenario) => scenario.id === scenarioId)).toBeFalse();
  });
});
