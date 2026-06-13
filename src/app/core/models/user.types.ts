import { CardAppearance } from './card.types';
import type { UserLanguagePairEntry } from './user-language-pair.types';

export type { UserLanguagePairEntry } from './user-language-pair.types';

export type UserPreferences = CardAppearance & {
  languagePairs: readonly UserLanguagePairEntry[];
  activeLanguagePairId: string;
};

export type User = {
  id: string;
  displayName: string;
  preferences: UserPreferences;
};
