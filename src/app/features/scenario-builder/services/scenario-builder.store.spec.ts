import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { UserStore } from '../../../core/state';
import { ScenarioBuilderStore } from './scenario-builder.store';
import { ScenarioBuilderService, SCENARIOS_STORAGE_KEY } from './scenario-builder.service';

describe('ScenarioBuilderStore', () => {
  let store: ScenarioBuilderStore;
  let service: ScenarioBuilderService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [ScenarioBuilderStore, ScenarioBuilderService, UserStore, provideHttpClient()],
    });

    store = TestBed.inject(ScenarioBuilderStore);
    service = TestBed.inject(ScenarioBuilderService);
    store.catalog.set([
      { id: 'select-1', kind: 'select', title: 'Приветствие' },
      { id: 'select-2', kind: 'select', title: 'Числа' },
    ]);
    store.scenarios.set(service.loadScenarios());
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create scenario and persist it', () => {
    const created = store.createScenario({
      title: 'Новый сценарий',
      description: 'Описание',
      cardIds: ['select-1'],
    });

    expect(created).toBeTrue();
    expect(store.scenarios().some((scenario) => scenario.title === 'Новый сценарий')).toBeTrue();
    expect(localStorage.getItem(SCENARIOS_STORAGE_KEY)).toContain('Новый сценарий');
  });

  it('should reject invalid draft', () => {
    const created = store.createScenario({
      title: '   ',
      description: '',
      cardIds: [],
    });

    expect(created).toBeFalse();
    expect(store.error()).toBe('Укажите название и выберите хотя бы одну карточку');
  });

  it('should update and delete scenario', () => {
    store.createScenario({
      title: 'Temp',
      description: 'Desc',
      cardIds: ['select-1'],
    });

    const scenarioId = store.scenarios().find((scenario) => scenario.title === 'Temp')?.id;
    expect(scenarioId).toBeDefined();

    if (!scenarioId) {
      return;
    }

    store.updateScenario(scenarioId, {
      title: 'Updated',
      description: 'New desc',
      cardIds: ['select-2'],
    });

    expect(store.scenarios().find((scenario) => scenario.id === scenarioId)?.title).toBe('Updated');

    store.deleteScenario(scenarioId);
    expect(store.scenarios().some((scenario) => scenario.id === scenarioId)).toBeFalse();
  });
});
