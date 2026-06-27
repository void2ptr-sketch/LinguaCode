import type { CardKind } from '../../../core/models';
import type { CardFormKindGroup } from './card-form.registry';

export type CardCreateGroup = CardFormKindGroup;

export const CARD_CREATE_GROUPS: readonly CardCreateGroup[] = ['choice', 'input', 'pairs', 'media'];

export const CARD_CREATE_GROUP_LABELS: Record<CardCreateGroup, string> = {
  choice: 'Выбор',
  input: 'Ввод',
  pairs: 'Пары',
  media: 'Медиа',
};

export const CARD_CREATE_GROUP_HINTS: Record<CardCreateGroup, string> = {
  choice: 'select, на время, чтение, символы, тон',
  input: 'клавиатура, рисование',
  pairs: 'запоминание пар',
  media: 'звук',
};

export const KINDS_BY_CREATE_GROUP: Record<CardCreateGroup, readonly CardKind[]> = {
  choice: ['select', 'timed', 'reading', 'symbol', 'tone'],
  input: ['keyboard', 'draw'],
  pairs: ['memory'],
  media: ['sound'],
};

export const DEFAULT_KIND_BY_CREATE_GROUP: Record<CardCreateGroup, CardKind> = {
  choice: 'select',
  input: 'keyboard',
  pairs: 'memory',
  media: 'sound',
};

export function createGroupForKind(kind: CardKind): CardCreateGroup {
  switch (kind) {
    case 'select':
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
