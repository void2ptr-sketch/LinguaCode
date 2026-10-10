import type { CardKind } from '../../../core/models';
import type { CardFormKindGroup } from './card-form.registry';

/**
 * Alias for CardFormKindGroup — used in the card creation UI.
 */
export type CardCreateGroup = CardFormKindGroup;

/**
 * Available card creation groups in the order they appear in the UI.
 */
export const CARD_CREATE_GROUPS: readonly CardCreateGroup[] = ['choice', 'input', 'pairs', 'media'];

/**
 * Display labels for card creation groups (Russian).
 */
export const CARD_CREATE_GROUP_LABELS: Record<CardCreateGroup, string> = {
  choice: 'Выбор',
  input: 'Ввод',
  pairs: 'Пары',
  media: 'Медиа',
};

/**
 * Helper hints for card creation groups — lists the card kinds in each group.
 */
export const CARD_CREATE_GROUP_HINTS: Record<CardCreateGroup, string> = {
  choice: 'select, code-select, на время, чтение, символы, тон',
  input: 'клавиатура, рисование',
  pairs: 'запоминание пар',
  media: 'звук',
};

/**
 * Maps each card creation group to its constituent card kinds.
 */
export const KINDS_BY_CREATE_GROUP: Record<CardCreateGroup, readonly CardKind[]> = {
  choice: ['select', 'code-select', 'timed', 'reading', 'symbol', 'tone'],
  input: ['keyboard', 'draw'],
  pairs: ['memory'],
  media: ['sound'],
};

/**
 * Default card kind selected when a user picks a creation group.
 */
export const DEFAULT_KIND_BY_CREATE_GROUP: Record<CardCreateGroup, CardKind> = {
  choice: 'select',
  input: 'keyboard',
  pairs: 'memory',
  media: 'sound',
};

/**
 * Looks up the creation group for a given card kind.
 *
 * @param kind - The card kind to look up.
 * @returns The corresponding creation group.
 */
export function createGroupForKind(kind: CardKind): CardCreateGroup {
  switch (kind) {
    case 'select':
    case 'code-select':
    case 'timed':
    case 'reading':
    case 'symbol':
    case 'tone':
      return 'choice';
    case 'keyboard':
    case 'draw':
      return 'input';
    case 'memory':
      return 'pairs';
    case 'sound':
      return 'media';
  }
}
