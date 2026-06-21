import type { CardDirection } from './language-pair.types';

export type CardKind =
  | 'select'
  | 'memory'
  | 'symbol'
  | 'sound'
  | 'timed'
  | 'keyboard'
  | 'draw'
  | 'tone'
  | 'reading';

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

import type { PhoneticLexeme, ToneMark } from './phonetic-content.types';
import type { DrawPracticeMode, DrawStrokeGuide } from './draw-practice.types';

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
    /** Варианты на известном языке — для режима «новый → известный». */
    optionsKnown?: readonly string[];
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
    optionsKnown?: readonly string[];
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
    optionsKnown?: readonly string[];
    optionsLexemes?: readonly PhoneticLexeme[];
    correctIndex: number;
    timeLimitSec: number;
  };

export type KeyboardAnswerMode = 'text' | 'ipa' | 'pinyin' | 'auto';

export type KeyboardCard = CardBase &
  LexemeCardFields & {
    kind: 'keyboard';
    direction: CardDirection;
    promptKnown: string;
    acceptedAnswersKnown: readonly string[];
    /** Допустимые ответы на изучаемом языке — для режима «известный → новый». */
    acceptedAnswersLearning?: readonly string[];
    answerMode?: KeyboardAnswerMode;
  };

export type DrawCard = CardBase &
  LexemeCardFields & {
    kind: 'draw';
    promptKnown: string;
    referenceHintKnown: string;
    practiceMode?: DrawPracticeMode;
    targetCharacter?: string;
    strokeGuides?: readonly DrawStrokeGuide[];
    radicalHint?: string;
  };

export type ToneCard = CardBase &
  LexemeCardFields & {
    kind: 'tone';
    direction: CardDirection;
    promptKnown: string;
    syllableBase: string;
    toneOptions: readonly ToneMark[];
    correctIndex: number;
  };

export type ReadingCard = CardBase &
  LexemeCardFields & {
    kind: 'reading';
    direction: CardDirection;
    promptKnown: string;
    optionsLearning: readonly string[];
    optionsKnown?: readonly string[];
    optionsLexemes?: readonly PhoneticLexeme[];
    correctIndex: number;
  };

export type Card =
  | SelectCard
  | MemoryCard
  | SymbolCard
  | SoundCard
  | TimedCard
  | KeyboardCard
  | DrawCard
  | ToneCard
  | ReadingCard;

export type OptionCard = SelectCard | SymbolCard | SoundCard | TimedCard | ReadingCard;

export const isOptionCard = (card: Card): card is OptionCard => {
  return (
    card.kind === 'select' ||
    card.kind === 'symbol' ||
    card.kind === 'sound' ||
    card.kind === 'timed' ||
    card.kind === 'reading'
  );
};
