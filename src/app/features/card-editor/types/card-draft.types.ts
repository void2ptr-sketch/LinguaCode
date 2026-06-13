import { CardAppearance, CardKind, MemoryPair } from '../../../core/models';

export type CardAppearanceDraft = CardAppearance;

export type SelectCardDraft = {
  kind: 'select';
  title: string;
  question: string;
  options: readonly string[];
  correctIndex: number;
  appearance: CardAppearanceDraft;
};

export type MemoryCardDraft = {
  kind: 'memory';
  title: string;
  prompt: string;
  pairs: readonly MemoryPair[];
  appearance: CardAppearanceDraft;
};

export type SymbolCardDraft = {
  kind: 'symbol';
  title: string;
  prompt: string;
  symbols: readonly string[];
  correctIndex: number;
  appearance: CardAppearanceDraft;
};

export type SoundCardDraft = {
  kind: 'sound';
  title: string;
  prompt: string;
  audioLabel: string;
  options: readonly string[];
  correctIndex: number;
  appearance: CardAppearanceDraft;
};

export type TimedCardDraft = {
  kind: 'timed';
  title: string;
  question: string;
  options: readonly string[];
  correctIndex: number;
  timeLimitSec: number;
  appearance: CardAppearanceDraft;
};

export type KeyboardCardDraft = {
  kind: 'keyboard';
  title: string;
  prompt: string;
  acceptedAnswers: readonly string[];
  appearance: CardAppearanceDraft;
};

export type DrawCardDraft = {
  kind: 'draw';
  title: string;
  prompt: string;
  referenceHint: string;
  appearance: CardAppearanceDraft;
};

export type CardDraft =
  | SelectCardDraft
  | MemoryCardDraft
  | SymbolCardDraft
  | SoundCardDraft
  | TimedCardDraft
  | KeyboardCardDraft
  | DrawCardDraft;

export type EditableCardKind = CardKind;

export const CARD_KIND_LABELS: Record<CardKind, string> = {
  select: 'Выбор ответа',
  memory: 'Запоминание',
  symbol: 'Символы',
  sound: 'Звук',
  timed: 'На время',
  keyboard: 'Клавиатура',
  draw: 'Рисование',
};

export const CARD_KINDS: readonly CardKind[] = [
  'select',
  'memory',
  'symbol',
  'sound',
  'timed',
  'keyboard',
  'draw',
];
