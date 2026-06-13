import { CardAppearance } from './card.types';
import type { LanguagePair } from './language-pair.types';

export type UserPreferences = CardAppearance & {
  languagePair: LanguagePair;
};

export type User = {
  id: string;
  displayName: string;
  preferences: UserPreferences;
};
