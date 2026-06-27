/** Demo scenario fixtures (ru→en and ru→zh). */

export const RU_ZH_LANGUAGE_PAIR = { known: 'ru', learning: 'zh' };
export const DEFAULT_LANGUAGE_PAIR = { known: 'ru', learning: 'en' };

export const DEMO_SCENARIOS = [
  {
    id: 'demo-scenario',
    title: 'Демо-сценарий',
    description: '3 карточки для начала обучения (ru→en): выбор ответа.',
    authorId: 'system',
    published: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    cardSource: {
      mode: 'fixed',
      cardIds: ['select-1', 'select-2', 'select-3'],
    },
    languagePair: DEFAULT_LANGUAGE_PAIR,
  },
  {
    id: 'scenario-zh-greetings',
    title: 'Приветствия (китайский)',
    description: '4 карточки: 你好, 谢谢, 再见 — выбор, память, символы и аудирование.',
    authorId: 'system',
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
    description: '3 карточки: пиньинь, IPA и тоны на примере 你好 и 妈.',
    authorId: 'system',
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
    description: '7 карточек: черты 人 и 好, ввод перевода, полифония 行 в 银行.',
    authorId: 'system',
    published: true,
    updatedAt: '2026-06-14T10:00:00.000Z',
    languagePair: RU_ZH_LANGUAGE_PAIR,
    cardSource: {
      mode: 'fixed',
      cardIds: [
        'draw-nihao-1',
        'draw-henbang-1',
        'draw-bowuguan-1',
        'draw-ren-1',
        'draw-hao-1',
        'keyboard-zh-1',
        'reading-xing-1',
      ],
    },
  },
  {
    id: 'scenario-zh-review',
    title: 'Закрепление (китайский)',
    description: '3 карточки: на время, выбор и пары.',
    authorId: 'system',
    published: true,
    updatedAt: '2026-06-14T10:00:00.000Z',
    languagePair: RU_ZH_LANGUAGE_PAIR,
    cardSource: {
      mode: 'fixed',
      cardIds: ['timed-zh-1', 'select-zh-1', 'memory-zh-1'],
    },
  },
];
