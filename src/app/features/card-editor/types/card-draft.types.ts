import { CardAppearance, CardKind, KeyboardAnswerMode } from '../../../core/models';
import type { CodeHighlightLanguage } from '../../../core/models';
import type {
  DrawPracticeMode,
  DrawCharacterTarget,
} from '../../../core/models/draw-practice.types';
import type { ToneMark } from '../../../core/models/phonetic-content.types';
import { CardDirection } from '../../../core/models/language-pair.types';
import type { LexemeDraftFields } from '../../../core/data/chinese/lexeme-draft.utils';
import { emptyLexemeDraftFields } from '../../../core/data/chinese/lexeme-draft.utils';

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

export type CodeBlockDraft = {
  code: string;
  language: CodeHighlightLanguage;
};

export type CodeSelectCardDraft = {
  kind: 'code-select';
  title: string;
  caption: string;
  courseId?: string;
  lessonId?: string;
  scenarioId?: string;
  prompt: CodeBlockDraft;
  options: readonly CodeBlockDraft[];
  correctIndex: number;
  appearance: CardAppearanceDraft;
};

export type SelectCardDraft = LexemeCardDraft & {
  kind: 'select';
  title: string;
  courseId?: string;
  lessonId?: string;
  scenarioId?: string;
  direction: CardDirection;
  promptKnown: string;
  optionsLearning: readonly string[];
  optionsKnown: readonly string[];
  optionsLexemes: readonly LexemeDraftFields[];
  correctIndex: number;
  appearance: CardAppearanceDraft;
};

export type MemoryCardDraft = LexemeCardDraft & {
  kind: 'memory';
  title: string;
  courseId?: string;
  lessonId?: string;
  scenarioId?: string;
  promptKnown: string;
  pairs: readonly MemoryPairDraft[];
  appearance: CardAppearanceDraft;
};

export type SymbolCardDraft = LexemeCardDraft & {
  kind: 'symbol';
  title: string;
  courseId?: string;
  lessonId?: string;
  scenarioId?: string;
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
  courseId?: string;
  lessonId?: string;
  scenarioId?: string;
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
  courseId?: string;
  lessonId?: string;
  scenarioId?: string;
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
  courseId?: string;
  lessonId?: string;
  scenarioId?: string;
  direction: CardDirection;
  promptKnown: string;
  acceptedAnswersKnown: readonly string[];
  answerMode?: KeyboardAnswerMode;
  appearance: CardAppearanceDraft;
};

export type DrawStrokeGuideDraft = {
  order: number;
  path: string;
};

export type DrawCardDraft = LexemeCardDraft & {
  kind: 'draw';
  title: string;
  courseId?: string;
  lessonId?: string;
  scenarioId?: string;
  promptKnown: string;
  referenceHintKnown: string;
  meaningKnown?: string;
  practiceMode?: DrawPracticeMode;
  targetCharacter: string;
  radicalHint: string;
  strokeGuides: readonly DrawStrokeGuideDraft[];
  characterTargets?: readonly DrawCharacterTarget[];
  appearance: CardAppearanceDraft;
};

export type ToneCardDraft = LexemeCardDraft & {
  kind: 'tone';
  title: string;
  courseId?: string;
  lessonId?: string;
  scenarioId?: string;
  direction: CardDirection;
  promptKnown: string;
  syllableBase: string;
  toneOptions: readonly ToneMark[];
  correctIndex: number;
  appearance: CardAppearanceDraft;
};

export type ReadingCardDraft = LexemeCardDraft & {
  kind: 'reading';
  title: string;
  courseId?: string;
  lessonId?: string;
  scenarioId?: string;
  direction: CardDirection;
  promptKnown: string;
  optionsLearning: readonly string[];
  optionsLexemes: readonly LexemeDraftFields[];
  correctIndex: number;
  appearance: CardAppearanceDraft;
};

export type CardDraft =
  | SelectCardDraft
  | CodeSelectCardDraft
  | MemoryCardDraft
  | SymbolCardDraft
  | SoundCardDraft
  | TimedCardDraft
  | KeyboardCardDraft
  | DrawCardDraft
  | ToneCardDraft
  | ReadingCardDraft;

export type EditableCardKind = CardKind;

export const CARD_KIND_LABELS: Record<CardKind, string> = {
  select: 'Выбор ответа',
  'code-select': 'Код: выбор ответа',
  memory: 'Запоминание',
  symbol: 'Символы',
  sound: 'Звук',
  timed: 'На время',
  keyboard: 'Клавиатура',
  draw: 'Рисование',
  tone: 'Тон',
  reading: 'Чтение (полифония)',
};

export const CARD_KINDS: readonly CardKind[] = [
  'select',
  'code-select',
  'memory',
  'symbol',
  'sound',
  'timed',
  'keyboard',
  'draw',
  'tone',
  'reading',
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
