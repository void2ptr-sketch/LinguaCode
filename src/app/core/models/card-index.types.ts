import type { CardKind } from './card.types';

/** Язык контента карточек и UI приложения — не путать с UiLocale (см. docs/LANGUAGE-PAIR.md). */
export type ContentLanguage = 'en' | 'zh' | 'ru' | 'perl' | 'java' | 'cpp';

export type CardDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Лёгкая запись каталога — без payload карточки.
 * Используется в списках, фильтрах и server-side поиске.
 */
export type CardIndexEntry = {
  id: string;
  kind: CardKind;
  title: string;
  knownLanguage: ContentLanguage;
  learningLanguage: ContentLanguage;
  difficulty: CardDifficulty;
  tags: readonly string[];
  /** Нормализованные IPA-транскрипции для поиска в каталоге. */
  ipaReadings: readonly string[];
  updatedAt: string;
  /** ID курса (Course), к которому привязана карточка. */
  courseId?: string;
  /** ID урока (Lesson), к которому привязана карточка. */
  lessonId?: string;
  /** ID сценария (Scenario), к которому привязана карточка. */
  scenarioId?: string;
};
