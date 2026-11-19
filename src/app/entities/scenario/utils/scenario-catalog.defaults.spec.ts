import {
  getTestDefaultScenarios,
  getTestZhScenarios,
  seedTestContentCache,
} from '../../content-seed/content-seed.test-utils';
import { mergeScenariosWithDefaults } from './scenario-catalog.defaults';
import { resetContentSeedCache } from '../../content-seed/content-seed.cache';
import {
  writeUserContentOverlay,
  emptyUserContentOverlay,
} from '../../user/overlay/user-content-overlay.storage';
import { USER_CONTENT_MIGRATED_KEY } from '../../user/overlay/user-content-overlay.types';

describe('scenario-catalog.defaults', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(USER_CONTENT_MIGRATED_KEY, '1');
    writeUserContentOverlay(emptyUserContentOverlay());
    resetContentSeedCache();
    seedTestContentCache();
  });

  afterEach(() => {
    localStorage.clear();
    localStorage.setItem(USER_CONTENT_MIGRATED_KEY, '1');
    writeUserContentOverlay(emptyUserContentOverlay());
    resetContentSeedCache();
  });

  it('should include ru→zh demo scenarios', () => {
    const zhScenarios = getTestZhScenarios();

    expect(zhScenarios.length).toBeGreaterThanOrEqual(4);
    expect(zhScenarios.every((item) => item.languagePair?.learning === 'zh')).toBe(true);
  });

  it('should merge missing default scenarios into stored list', () => {
    const defaults = getTestDefaultScenarios();
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

    expect(merged.some((item) => item.id === 'custom-scenario')).toBe(true);
    expect(merged.some((item) => item.id === 'scenario-zh-greetings')).toBe(true);
    expect(merged.length).toBe(defaults.length + 1);
  });

  it('should prefer stored scenario when ids match', () => {
    const defaults = getTestDefaultScenarios();
    const stored = defaults.map((scenario) =>
      scenario.id === 'scenario-zh-greetings'
        ? { ...scenario, title: 'Пользовательское приветствие' }
        : scenario,
    );

    const merged = mergeScenariosWithDefaults(stored);
    expect(merged.find((item) => item.id === 'scenario-zh-greetings')?.title).toBe(
      'Пользовательское приветствие',
    );
  });

  it('should skip obsolete radicals catalog items', () => {
    const stored = [
      {
        id: 'lesson-radicals-12',
        title: 'Obsolete Radical Lesson 12',
        description: 'This should be skipped',
        authorId: 'system',
        published: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
        cardSource: { mode: 'fixed' as const, cardIds: [] },
        languagePair: { known: 'ru' as const, learning: 'zh' as const },
      },
    ];

    const merged = mergeScenariosWithDefaults(stored);
    // defaults are still added, but obsolete stored items should be filtered
    expect(merged.every((item) => item.id !== 'lesson-radicals-12')).toBe(true);
  });
});
