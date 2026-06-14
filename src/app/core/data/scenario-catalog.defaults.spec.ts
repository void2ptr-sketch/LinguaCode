import {
  DEFAULT_SCENARIOS,
  DEFAULT_ZH_SCENARIOS,
  mergeScenariosWithDefaults,
} from './scenario-catalog.defaults';

describe('scenario-catalog.defaults', () => {
  it('should include ru→zh demo scenarios', () => {
    expect(DEFAULT_ZH_SCENARIOS.length).toBeGreaterThanOrEqual(4);
    expect(DEFAULT_ZH_SCENARIOS.every((item) => item.languagePair?.learning === 'zh')).toBeTrue();
  });

  it('should merge missing default scenarios into stored list', () => {
    const stored = [
      {
        id: 'custom-scenario',
        title: 'Custom',
        description: 'User scenario',
        authorId: 'local-user',
        published: true,
        updatedAt: '2026-06-14T10:00:00.000Z',
        cardSource: { mode: 'fixed' as const, cardIds: ['select-zh-1'] },
        languagePair: { known: 'ru' as const, learning: 'zh' as const },
      },
    ];

    const merged = mergeScenariosWithDefaults(stored);

    expect(merged.some((item) => item.id === 'custom-scenario')).toBeTrue();
    expect(merged.some((item) => item.id === 'scenario-zh-greetings')).toBeTrue();
    expect(merged.length).toBe(DEFAULT_SCENARIOS.length + 1);
  });

  it('should prefer stored scenario when ids match', () => {
    const stored = DEFAULT_SCENARIOS.map((scenario) =>
      scenario.id === 'scenario-zh-greetings'
        ? { ...scenario, title: 'Пользовательское приветствие' }
        : scenario,
    );

    const merged = mergeScenariosWithDefaults(stored);
    expect(merged.find((item) => item.id === 'scenario-zh-greetings')?.title).toBe(
      'Пользовательское приветствие',
    );
  });
});
