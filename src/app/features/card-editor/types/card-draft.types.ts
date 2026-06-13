import { CardAppearance, CardKind, MemoryPair } from '../../../core/models';
import { CardDirection } from '../../../core/models/language-pair.types';

export type CardAppearanceDraft = CardAppearance;

export const DEFAULT_CARD_DIRECTION: CardDirection = 'known-to-learning';

export type SelectCardDraft = {
  kind: 'select';
  title: string;
  direction: CardDirection;
  promptKnown: string;
  optionsLearning: readonly string[];
  correctIndex: number;
  appearance: CardAppearanceDraft;
};

export type MemoryCardDraft = {
  kind: 'memory';
  title: string;
  promptKnown: string;
  pairs: readonly MemoryPair[];
  appearance: CardAppearanceDraft;
};

export type SymbolCardDraft = {
  kind: 'symbol';
  title: string;
  direction: CardDirection;
  promptKnown: string;
  symbols: readonly string[];
  correctIndex: number;
  appearance: CardAppearanceDraft;
};

export type SoundCardDraft = {
  kind: 'sound';
  title: string;
  direction: CardDirection;
  promptKnown: string;
  audioLabelLearning: string;
  optionsKnown: readonly string[];
  correctIndex: number;
  appearance: CardAppearanceDraft;
};

export type TimedCardDraft = {
  kind: 'timed';
  title: string;
  direction: CardDirection;
  promptKnown: string;
  optionsLearning: readonly string[];
  correctIndex: number;
  timeLimitSec: number;
  appearance: CardAppearanceDraft;
};

export type KeyboardCardDraft = {
  kind: 'keyboard';
  title: string;
  direction: CardDirection;
  promptKnown: string;
  acceptedAnswersKnown: readonly string[];
  appearance: CardAppearanceDraft;
};

export type DrawCardDraft = {
  kind: 'draw';
  title: string;
  promptKnown: string;
  referenceHintKnown: string;
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
