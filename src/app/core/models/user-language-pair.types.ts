import type { LanguagePair } from './language-pair.types';

/** Запись языковой пары в профиле пользователя (G7). */
export type UserLanguagePairEntry = {
  id: string;
  pair: LanguagePair;
  createdAt: string;
};
