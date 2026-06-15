import type { LanguagePair } from './language-pair.types';
import type { CjkLearningPreferences, PhoneticPreferences } from './phonetic-content.types';
import type { LearningSessionPreferences } from './learning-session.types';

/** Настройки, специфичные для одной языковой пары (CJK, IPA и т.д.). */
export type UserLanguagePairSettings = {
  cjkLearning?: CjkLearningPreferences;
  phonetic?: PhoneticPreferences;
  learning?: LearningSessionPreferences;
};

/** Запись языковой пары в профиле пользователя (G7). */
export type UserLanguagePairEntry = {
  id: string;
  pair: LanguagePair;
  createdAt: string;
  settings?: UserLanguagePairSettings;
};
