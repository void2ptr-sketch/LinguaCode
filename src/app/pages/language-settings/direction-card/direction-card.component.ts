import { InjectionToken } from '@angular/core';

/** A single direction within a grouped card. */
export type DirectionItem = {
  id: string;
  known: string;
  learning: string;
  isActive: boolean;
};

/** Injection token for helper methods passed down to direction cards. */
export const DIRECTION_CARD_HELPERS = new InjectionToken<DirectionCardHelpers>(
  'DirectionCardHelpers',
);

export type DirectionCardHelpers = {
  getLanguageLabel(code: string): string;
  getFlagEmoji(code: string): string;
  getBadgeColor(code: string): string;
  getBadgeTextColor(code: string): string;
  getBadgeCode(code: string): string;
};
