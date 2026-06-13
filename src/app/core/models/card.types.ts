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

import type { PhoneticLexeme } from './phonetic-content.types';

export type MemoryPair = {
  known: string;
  learning: string;
  learningLexeme?: PhoneticLexeme;
};

export type LexemeCardFields = {
  promptLexeme?: PhoneticLexeme;
  audioUrl?: string;
};

export type SelectCard = CardBase &
  LexemeCardFields & {
    kind: 'select';
    direction: CardDirection;
    promptKnown: string;
    optionsLearning: readonly string[];
    optionsLexemes?: readonly PhoneticLexeme[];
    correctIndex: number;
  };

export type MemoryCard = CardBase &
  LexemeCardFields & {
    kind: 'memory';
    promptKnown: string;
    pairs: readonly MemoryPair[];
  };

export type SymbolCard = CardBase &
  LexemeCardFields & {
    kind: 'symbol';
    direction: CardDirection;
    promptKnown: string;
    symbols: readonly string[];
    symbolLexemes?: readonly PhoneticLexeme[];
    correctIndex: number;
  };

export type SoundCard = CardBase &
  LexemeCardFields & {
    kind: 'sound';
    direction: CardDirection;
    promptKnown: string;
    audioLabelLearning: string;
    optionsKnown: readonly string[];
    optionsLexemes?: readonly PhoneticLexeme[];
    correctIndex: number;
  };

export type TimedCard = CardBase &
  LexemeCardFields & {
    kind: 'timed';
    direction: CardDirection;
    promptKnown: string;
    optionsLearning: readonly string[];
    optionsLexemes?: readonly PhoneticLexeme[];
    correctIndex: number;
    timeLimitSec: number;
  };

export type KeyboardCard = CardBase &
  LexemeCardFields & {
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
