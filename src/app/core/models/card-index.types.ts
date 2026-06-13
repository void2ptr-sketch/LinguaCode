import type { CardKind } from './card.types';

/** Язык контента карточек и UI приложения — не путать с UiLocale (см. docs/LANGUAGE-PAIR.md). */
export type ContentLanguage = 'en' | 'zh' | 'ru';

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
  updatedAt: string;
};
