import { normalizeScenario, scenarioCardsLabel, scenarioUsesCardId } from './scenario-card-source.utils';

describe('scenario-card-source.utils', () => {
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
  });

  it('detects fixed card usage and labels', () => {
    const source = { mode: 'fixed' as const, cardIds: ['select-1'] };

    expect(scenarioUsesCardId(source, 'select-1')).toBeTrue();
    expect(scenarioUsesCardId(source, 'select-2')).toBeFalse();
    expect(scenarioCardsLabel(source)).toBe('1 карточек');
  });

  it('labels criteria source', () => {
    expect(
      scenarioCardsLabel({
        mode: 'criteria',
        criteria: { language: 'en' },
        limit: 10,
      }),
    ).toBe('до 10 по критериям');
  });
});
