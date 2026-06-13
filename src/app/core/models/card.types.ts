import type { CardDirection } from './language-pair.types';

export type CardKind =
  | 'select'
  | 'memory'
  | 'symbol'
  | 'sound'
  | 'timed'
  | 'keyboard'
  | 'draw';

export type CardAppearance = {
  theme: string;
  fontSize: 'sm' | 'md' | 'lg';
};

export type CardBase = {
  id: string;
  kind: CardKind;
  title: string;
  appearance: CardAppearance;
};

export type MemoryPair = {
  known: string;
  learning: string;
};

export type SelectCard = CardBase & {
  kind: 'select';
  direction: CardDirection;
  promptKnown: string;
  optionsLearning: readonly string[];
  correctIndex: number;
};

export type MemoryCard = CardBase & {
  kind: 'memory';
  promptKnown: string;
  pairs: readonly MemoryPair[];
};

export type SymbolCard = CardBase & {
  kind: 'symbol';
  direction: CardDirection;
  promptKnown: string;
  symbols: readonly string[];
  correctIndex: number;
};

export type SoundCard = CardBase & {
  kind: 'sound';
  direction: CardDirection;
  promptKnown: string;
  audioLabelLearning: string;
  optionsKnown: readonly string[];
  correctIndex: number;
};

export type TimedCard = CardBase & {
  kind: 'timed';
  direction: CardDirection;
  promptKnown: string;
  optionsLearning: readonly string[];
  correctIndex: number;
  timeLimitSec: number;
};

export type KeyboardCard = CardBase & {
  kind: 'keyboard';
  direction: CardDirection;
  promptKnown: string;
  acceptedAnswersKnown: readonly string[];
};

export type DrawCard = CardBase & {
  kind: 'draw';
  promptKnown: string;
  referenceHintKnown: string;
};

export type Card =
  | SelectCard
  | MemoryCard
  | SymbolCard
  | SoundCard
  | TimedCard
  | KeyboardCard
  | DrawCard;

export type OptionCard = SelectCard | SymbolCard | SoundCard | TimedCard;

export const isOptionCard = (card: Card): card is OptionCard => {
  return (
    card.kind === 'select' ||
    card.kind === 'symbol' ||
    card.kind === 'sound' ||
    card.kind === 'timed'
  );
};
