import { CardAppearance } from './card.types';
import type { UserLanguagePairEntry } from './user-language-pair.types';

export type { UserLanguagePairEntry, UserLanguagePairSettings } from './user-language-pair.types';
export type { CjkLearningPreferences, PhoneticPreferences } from './phonetic-content.types';
export {
  DEFAULT_CJK_LEARNING_PREFERENCES,
  DEFAULT_PHONETIC_PREFERENCES,
} from './phonetic-content.types';

export type UserPreferences = CardAppearance & {
  languagePairs: readonly UserLanguagePairEntry[];
  activeLanguagePairId: string;
};

export type User = {
  id: string;
  displayName: string;
  preferences: UserPreferences;
};
