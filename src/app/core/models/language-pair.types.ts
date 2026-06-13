import type { ContentLanguage } from './card-index.types';

/** Пара языков обучения: известный пользователю → изучаемый. */
export type LanguagePair = {
  known: ContentLanguage;
  learning: ContentLanguage;
};

/** Направление показа/проверки на карточке (бэклог G2+). */
export type CardDirection = 'known-to-learning' | 'learning-to-known';

export const DEFAULT_LANGUAGE_PAIR: LanguagePair = {
  known: 'ru',
  learning: 'en',
};
