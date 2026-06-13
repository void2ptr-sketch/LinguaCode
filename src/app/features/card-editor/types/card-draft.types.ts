import { CardAppearance, CardKind } from '../../../core/models';
import { CardDirection } from '../../../core/models/language-pair.types';
import type { LexemeDraftFields } from '../../../core/data/lexeme-draft.utils';
import { emptyLexemeDraftFields } from '../../../core/data/lexeme-draft.utils';

export type CardAppearanceDraft = CardAppearance;

export const DEFAULT_CARD_DIRECTION: CardDirection = 'known-to-learning';

export type LexemeCardDraft = {
  promptLexeme: LexemeDraftFields;
  audioUrl: string;
};

export type MemoryPairDraft = {
  known: string;
  learning: string;
  learningLexeme: LexemeDraftFields;
};

export type SelectCardDraft = LexemeCardDraft & {
  kind: 'select';
  title: string;
  direction: CardDirection;
  promptKnown: string;
  optionsLearning: readonly string[];
  optionsLexemes: readonly LexemeDraftFields[];
  correctIndex: number;
  appearance: CardAppearanceDraft;
};

export type MemoryCardDraft = LexemeCardDraft & {
  kind: 'memory';
  title: string;
  promptKnown: string;
  pairs: readonly MemoryPairDraft[];
  appearance: CardAppearanceDraft;
};

export type SymbolCardDraft = LexemeCardDraft & {
  kind: 'symbol';
  title: string;
  direction: CardDirection;
  promptKnown: string;
  symbols: readonly string[];
  symbolLexemes: readonly LexemeDraftFields[];
  correctIndex: number;
  appearance: CardAppearanceDraft;
};

export type SoundCardDraft = LexemeCardDraft & {
  kind: 'sound';
  title: string;
  direction: CardDirection;
  promptKnown: string;
  audioLabelLearning: string;
  audioLabelLexeme: LexemeDraftFields;
  optionsKnown: readonly string[];
  optionsLexemes: readonly LexemeDraftFields[];
  correctIndex: number;
  appearance: CardAppearanceDraft;
};

export type TimedCardDraft = LexemeCardDraft & {
  kind: 'timed';
  title: string;
  direction: CardDirection;
  promptKnown: string;
  optionsLearning: readonly string[];
  optionsLexemes: readonly LexemeDraftFields[];
  correctIndex: number;
  timeLimitSec: number;
  appearance: CardAppearanceDraft;
};

export type KeyboardCardDraft = LexemeCardDraft & {
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

export const emptyLexemeCardDraft = (): LexemeCardDraft => ({
  promptLexeme: emptyLexemeDraftFields(),
  audioUrl: '',
});

export const emptyOptionLexemes = (count: number): readonly LexemeDraftFields[] =>
  Array.from({ length: count }, () => emptyLexemeDraftFields());

export const emptyMemoryPairDraft = (): MemoryPairDraft => ({
  known: '',
  learning: '',
  learningLexeme: emptyLexemeDraftFields(),
});
