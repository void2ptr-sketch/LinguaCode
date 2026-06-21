import { CardAppearance } from './card.types';
import type { AppColorScheme } from '../theme/app-color-scheme.types';
import type { UserLanguagePairEntry } from './user-language-pair.types';

export type { UserLanguagePairEntry, UserLanguagePairSettings } from './user-language-pair.types';
export type { CjkLearningPreferences, PhoneticPreferences } from './phonetic-content.types';
export {
  DEFAULT_CJK_LEARNING_PREFERENCES,
  DEFAULT_PHONETIC_PREFERENCES,
} from './phonetic-content.types';

export type { AppColorScheme } from '../theme/app-color-scheme.types';
export { DEFAULT_APP_COLOR_SCHEME } from '../theme/app-color-scheme.types';

export type UserPreferences = CardAppearance & {
  colorScheme: AppColorScheme;
  /** Авто-полный экран карточки на вкладке «Обучение»; также сохраняется при ручном переключении. */
  cardFocusFullscreen: boolean;
  languagePairs: readonly UserLanguagePairEntry[];
  activeLanguagePairId: string;
};

export type User = {
  id: string;
  displayName: string;
  preferences: UserPreferences;
};
