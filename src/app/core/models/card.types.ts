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
  front: string;
  back: string;
};

export type SelectCard = CardBase & {
  kind: 'select';
  question: string;
  options: readonly string[];
  correctIndex: number;
};

export type MemoryCard = CardBase & {
  kind: 'memory';
  prompt: string;
  pairs: readonly MemoryPair[];
};

export type SymbolCard = CardBase & {
  kind: 'symbol';
  prompt: string;
  symbols: readonly string[];
  correctIndex: number;
};

export type SoundCard = CardBase & {
  kind: 'sound';
  prompt: string;
  audioLabel: string;
  options: readonly string[];
  correctIndex: number;
};

export type TimedCard = CardBase & {
  kind: 'timed';
  question: string;
  options: readonly string[];
  correctIndex: number;
  timeLimitSec: number;
};

export type KeyboardCard = CardBase & {
  kind: 'keyboard';
  prompt: string;
  acceptedAnswers: readonly string[];
};

export type DrawCard = CardBase & {
  kind: 'draw';
  prompt: string;
  referenceHint: string;
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
