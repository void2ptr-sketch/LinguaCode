import type { CardKind } from '../../../core/models';

export type CardFormKindGroup = 'choice' | 'input' | 'pairs' | 'media';

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

export function cardFormKindGroup(kind: CardKind): CardFormKindGroup {
  return CARD_FORM_KIND_GROUP[kind];
}

export const CARD_FORM_BY_KIND = CARD_FORM_KIND_GROUP;
