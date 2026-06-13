import type { CardKind } from './card.types';

/** Язык содержимого карточки (контент, не UI). */
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
  language: ContentLanguage;
  difficulty: CardDifficulty;
  tags: readonly string[];
  updatedAt: string;
};
