import { InjectionToken } from '@angular/core';

/** A single direction within a grouped card. */
export type DirectionItem = {
  id: string;
  known: string;
  learning: string;
  isActive: boolean;
};

/**
 * Payload emitted by a direction card event (`activate` / `remove`).
 *
 * @remarks
 * Carries the full pair identity so the parent can handle the event
 * strictly for this card only — no ambiguous lookups, no influence on
 * other mirror pair groups.
 */
export type DirectionCardEvent = {
  /** Backend language pair ID (as string). */
  pairId: string;
  /** Known language code of this direction. */
  known: string;
  /** Learning language code of this direction. */
  learning: string;
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
