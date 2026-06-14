import { normalizeScenario, scenarioCardsLabel, scenarioUsesCardEntry, scenarioUsesCardId } from './scenario-card-source.utils';
import type { CardIndexEntry } from '../models';

describe('scenario-card-source.utils', () => {
  const entry: CardIndexEntry = {
    id: 'select-1',
    kind: 'select',
    title: 'Hello',
    knownLanguage: 'ru',
    learningLanguage: 'en',
    difficulty: 'beginner',
    tags: ['greetings'],
    ipaReadings: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('migrates legacy cardIds to fixed cardSource', () => {
    const scenario = normalizeScenario({
      id: 's1',
      title: 'Legacy',
      description: '',
      authorId: 'u1',
      cardIds: ['select-1', 'select-2'],
    });

    expect(scenario.cardSource).toEqual({
      mode: 'fixed',
      cardIds: ['select-1', 'select-2'],
    });
    expect(scenario.published).toBeFalse();
  });

  it('detects fixed card usage and labels', () => {
    const source = { mode: 'fixed' as const, cardIds: ['select-1'] };

    expect(scenarioUsesCardId(source, 'select-1')).toBeTrue();
    expect(scenarioUsesCardId(source, 'select-2')).toBeFalse();
    expect(scenarioCardsLabel(source)).toBe('1 карточек');
  });

  it('detects criteria card usage via index entry', () => {
    expect(
      scenarioUsesCardEntry(
        { mode: 'criteria', criteria: { learningLanguage: 'en' }, limit: 10 },
        entry,
      ),
    ).toBeTrue();
  });

  it('labels criteria and snapshot sources', () => {
    expect(
      scenarioCardsLabel({
        mode: 'criteria',
        criteria: { learningLanguage: 'en' },
        limit: 10,
      }),
    ).toBe('до 10 по критериям');

    expect(
      scenarioCardsLabel({
        mode: 'snapshot',
        cardIds: ['select-1'],
        criteria: { learningLanguage: 'en' },
        frozenAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toBe('1 карточек (snapshot)');
  });
});
