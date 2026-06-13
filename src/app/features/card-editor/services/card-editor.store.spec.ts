import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CardRepository, CARDS_STORAGE_KEY } from '../../../core/data';
import { LearningResultsStore, UserStore } from '../../../core/state';
import {
  ScenarioBuilderService,
  SCENARIOS_STORAGE_KEY,
} from '../../scenario-builder/services/scenario-builder.service';
import { CardEditorStore } from './card-editor.store';

describe('CardEditorStore', () => {
  let store: CardEditorStore;

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

    TestBed.configureTestingModule({
      providers: [
        CardEditorStore,
        CardRepository,
        ScenarioBuilderService,
        LearningResultsStore,
        UserStore,
        provideHttpClient(),
      ],
    });

    store = TestBed.inject(CardEditorStore);
    store.cards.set([selectCard]);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create select card and persist it', () => {
    const created = store.createCard({
      kind: 'select',
      title: 'Новая',
      question: 'Вопрос?',
      options: ['1', '2'],
      correctIndex: 1,
      appearance: { theme: 'azure-blue', fontSize: 'md' },
    });

    expect(created).toBeTrue();
    expect(store.cards().some((card) => card.title === 'Новая')).toBeTrue();
    expect(localStorage.getItem(CARDS_STORAGE_KEY)).toContain('Новая');
  });

  it('should create memory card', () => {
    const created = store.createCard({
      kind: 'memory',
      title: 'Память',
      prompt: 'Пары',
      pairs: [{ front: 'A', back: 'B' }],
      appearance: { theme: 'azure-blue', fontSize: 'md' },
    });

    expect(created).toBeTrue();
    expect(store.cards().some((card) => card.kind === 'memory')).toBeTrue();
  });

  it('should block delete when card is used in scenario', () => {
    localStorage.setItem(
      SCENARIOS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'scenario-1',
          title: 'Demo',
          description: '',
          authorId: 'local-user',
          cardIds: ['select-test'],
        },
      ]),
    );

    expect(store.deleteCard('select-test')).toBeFalse();
    expect(store.error()).toContain('сценариях');
  });

  it('should block delete when learning results exist', () => {
    TestBed.inject(LearningResultsStore).addResult({
      id: 'result-1',
      userId: 'local-user',
      cardId: 'select-test',
      scenarioId: 'demo',
      correct: true,
      answeredAt: new Date().toISOString(),
    });

    expect(store.deleteCard('select-test')).toBeFalse();
    expect(store.error()).toContain('результаты');
  });

  it('should update and delete unused card', () => {
    store.updateCard('select-test', {
      kind: 'select',
      title: 'Updated',
      question: 'New?',
      options: ['X', 'Y'],
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'lg' },
    });

    expect(store.cards().find((card) => card.id === 'select-test')?.title).toBe('Updated');
    expect(store.deleteCard('select-test')).toBeTrue();
  });
});
