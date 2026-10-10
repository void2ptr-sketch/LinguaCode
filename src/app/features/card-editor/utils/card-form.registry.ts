import type { CardKind } from '../../../core/models';

/**
 * Groups card kinds by the structure of their editor form.
 *
 * @remarks
 * - `choice` — multiple-choice cards (select options)
 * - `input` — free-form input cards (keyboard, drawing)
 * - `pairs` — card with known/learning pairs
 * - `media` — audio-based cards
 */
export type CardFormKindGroup = 'choice' | 'input' | 'pairs' | 'media';

/**
 * Maps each card kind to its editor form group.
 *
 * @remarks
 * Used by the card editor to determine which form layout to render.
 * Also exported as `CARD_FORM_BY_KIND` for backward compatibility.
 */
export const CARD_FORM_KIND_GROUP: Record<CardKind, CardFormKindGroup> = {
  select: 'choice',
  'code-select': 'choice',
  timed: 'choice',
  reading: 'choice',
  symbol: 'choice',
  tone: 'choice',
  keyboard: 'input',
  draw: 'input',
  memory: 'pairs',
  sound: 'media',
};

/**
 * Looks up the editor form group for a given card kind.
 *
 * @param kind - The card kind to look up.
 * @returns The corresponding form group (`'choice'`, `'input'`, `'pairs'`, or `'media'`).
 */
export function cardFormKindGroup(kind: CardKind): CardFormKindGroup {
  return CARD_FORM_KIND_GROUP[kind];
}

/**
 * Alias for `CARD_FORM_KIND_GROUP` for backward compatibility.
 */
export const CARD_FORM_BY_KIND = CARD_FORM_KIND_GROUP;
