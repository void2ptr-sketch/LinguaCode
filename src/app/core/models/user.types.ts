import { CardAppearance } from './card.types';

export type User = {
  id: string;
  displayName: string;
  preferences: CardAppearance;
};
