export type HelpPageFeature = {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
};

export type HelpPageHierarchyLevel = {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: string;
};

export const HELP_PAGE_HERO = {
  eyebrow: 'LinguaCode',
  title: 'Языки, знания и навыки — в одном ритме',
  lead: 'Короткие упражнения на карточках, сценарии под вашу цель и учебные программы с прогрессом. От первого слова до технического интервью — всё в едином, понятном формате.',
  primaryCtaLabel: 'Начать обучение',
  primaryCtaPath: '/home',
  secondaryCtaLabel: 'Сценарии использования',
  secondaryCtaPath: '/help/scenarios',
} as const;

export const HELP_PAGE_FEATURES: readonly HelpPageFeature[] = [
  {
    id: 'learning',
    title: 'Умный dashboard',
    description:
      'Экран «Обучение» подсказывает, куда идти дальше: продолжить программу, увидеть roadmap уроков и свой прогресс.',
    icon: 'dashboard',
    path: '/home',
  },
  {
    id: 'practice',
    title: 'Гибкая практика',
    description:
      'Выбирайте программу, урок или сценарий — тренируйтесь по расписанию курса или в свободном режиме.',
    icon: 'style',
    path: '/cards/select',
  },
  {
    id: 'cards',
    title: 'Фокус на одном шаге',
    description:
      'Каждая карточка тренирует один аспект: форму, звук или смысл. Известное не отвлекает — вы учитесь точечно.',
    icon: 'center_focus_strong',
    path: '/tools/cards',
  },
  {
    id: 'scenarios',
    title: 'Сценарии под задачу',
    description:
      'Соберите прогон из карточек или задайте критерии — готовый сценарий для урока, повторения или интервью.',
    icon: 'view_list',
    path: '/tools/scenario-builder',
  },
  {
    id: 'courses',
    title: 'Программы с целью',
    description:
      'Уроки и сценарии объединяются в учебные программы: от «Приветствия» до подготовки к собеседованию.',
    icon: 'menu_book',
    path: '/courses',
  },
  {
    id: 'profile',
    title: 'Ваш стиль обучения',
    description:
      'Языковые пары, романизация, IPA, размер шрифта и полноэкранный режим — интерфейс подстраивается под вас.',
    icon: 'tune',
    path: '/user',
  },
];

export const HELP_PAGE_HIERARCHY: readonly HelpPageHierarchyLevel[] = [
  {
    id: 'card',
    label: 'Карточка',
    title: 'Одно упражнение',
    description: 'Атомарный шаг: вопрос, выбор, ввод — один фокус за раз.',
    icon: 'crop_square',
  },
  {
    id: 'scenario',
    label: 'Сценарий',
    title: 'Один прогон',
    description: 'Набор карточек в нужном порядке — урок, повторение или проверка.',
    icon: 'playlist_play',
  },
  {
    id: 'lesson',
    label: 'Урок',
    title: 'Тема',
    description: 'Несколько сценариев по одной теме: «Числа», «Приветствия», «Perl basics».',
    icon: 'topic',
  },
  {
    id: 'course',
    label: 'Программа',
    title: 'Путь к цели',
    description: 'Последовательность уроков с прогрессом — от нуля до уверенного уровня.',
    icon: 'flag',
  },
];

export const HELP_PAGE_HIGHLIGHTS: readonly string[] = [
  'Естественные и искусственные языки — единая модель обучения',
  'Прогресс сохраняется: сценарий, урок, программа',
  'Режим полного экрана — только вы и задание',
  'Создавайте и публикуйте свой контент',
];
