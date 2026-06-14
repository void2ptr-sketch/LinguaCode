import type { Scenario } from '../models';
import { DEFAULT_LANGUAGE_PAIR, type LanguagePair } from '../models/language-pair.types';

export const RU_ZH_LANGUAGE_PAIR: LanguagePair = {
  known: 'ru',
  learning: 'zh',
};

export const DEFAULT_EN_SCENARIOS: readonly Scenario[] = [
  {
    id: 'demo-scenario',
    title: 'Демо-сценарий',
    description: 'Базовый набор карточек для начала обучения (ru→en).',
    authorId: 'local-user',
    published: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    cardSource: {
      mode: 'fixed',
      cardIds: ['select-1', 'select-2', 'select-3'],
    },
    languagePair: DEFAULT_LANGUAGE_PAIR,
  },
];

export const DEFAULT_ZH_SCENARIOS: readonly Scenario[] = [
  {
    id: 'scenario-zh-greetings',
    title: 'Приветствия (китайский)',
    description: 'Базовые фразы: 你好, 谢谢, 再见 — выбор, память, символы и аудирование.',
    authorId: 'local-user',
    published: true,
    updatedAt: '2026-06-14T10:00:00.000Z',
    languagePair: RU_ZH_LANGUAGE_PAIR,
    cardSource: {
      mode: 'fixed',
      cardIds: ['select-zh-1', 'memory-zh-1', 'symbol-zh-1', 'sound-zh-1'],
    },
  },
  {
    id: 'scenario-zh-phonetics',
    title: 'Фонетика: пиньинь и тоны',
    description: 'Пиньинь, IPA и тоны на примере 你好 и 妈.',
    authorId: 'local-user',
    published: true,
    updatedAt: '2026-06-14T10:00:00.000Z',
    languagePair: RU_ZH_LANGUAGE_PAIR,
    cardSource: {
      mode: 'fixed',
      cardIds: ['keyboard-zh-pinyin-1', 'keyboard-zh-ipa-1', 'tone-ma-1'],
    },
  },
  {
    id: 'scenario-zh-characters',
    title: 'Иероглифы и чтение',
    description: 'Черты 人 и 好, ввод перевода, полифония 行 в 银行.',
    authorId: 'local-user',
    published: true,
    updatedAt: '2026-06-14T10:00:00.000Z',
    languagePair: RU_ZH_LANGUAGE_PAIR,
    cardSource: {
      mode: 'fixed',
      cardIds: ['draw-ren-1', 'draw-hao-1', 'keyboard-zh-1', 'reading-xing-1'],
    },
  },
  {
    id: 'scenario-zh-review',
    title: 'Закрепление (китайский)',
    description: 'Смешанная практика: на время, выбор и пары.',
    authorId: 'local-user',
    published: true,
    updatedAt: '2026-06-14T10:00:00.000Z',
    languagePair: RU_ZH_LANGUAGE_PAIR,
    cardSource: {
      mode: 'fixed',
      cardIds: ['timed-zh-1', 'select-zh-1', 'memory-zh-1'],
    },
  },
];

export const DEFAULT_SCENARIOS: readonly Scenario[] = [
  ...DEFAULT_EN_SCENARIOS,
  ...DEFAULT_ZH_SCENARIOS,
];

export function mergeScenariosWithDefaults(
  stored: readonly Scenario[],
  defaults: readonly Scenario[] = DEFAULT_SCENARIOS,
): Scenario[] {
  const byId = new Map<string, Scenario>();

  for (const scenario of defaults) {
    byId.set(scenario.id, scenario);
  }

  for (const scenario of stored) {
    byId.set(scenario.id, scenario);
  }

  return [...byId.values()];
}
