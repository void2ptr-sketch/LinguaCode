import { CardAppearance, CardKind, KeyboardAnswerMode } from '../../../core/models';
import type { CodeHighlightLanguage } from '../../../core/models';
import type {
  DrawPracticeMode,
  DrawCharacterTarget,
} from '../../../core/models/draw-practice.types';
import type { ToneMark } from '../../../core/models/phonetic-content.types';
import { CardDirection } from '../../../core/models/language-pair.types';
import type { LexemeDraftFields } from '../../../core/repositories/chinese/phonetics/lexeme-draft.utils';
import { emptyLexemeDraftFields } from '../../../core/repositories/chinese/phonetics/lexeme-draft.utils';

/**
 * Draft representation of card appearance settings. Aliased from `CardAppearance`.
 *
 * @remarks
 * Used in card editor forms before the card is normalized into a final `Card` type.
 */
export type CardAppearanceDraft = CardAppearance;

/**
 * Default card direction: known language → learning language.
 *
 * @remarks
 * Used as the initial direction for new cards in the editor. Reversible via the card form's direction toggle.
 */
export const DEFAULT_CARD_DIRECTION: CardDirection = 'known-to-learning';

/**
 * Draft fields for a lexeme-based card (cards with phonetic content).
 *
 * @remarks
 * All lexeme-based card kinds (select, memory, symbol, sound, etc.) extend this type.
 */
export type LexemeCardDraft = {
  promptLexeme: LexemeDraftFields;
  audioUrl: string;
};

/**
 * A pair of known and learning lexemes for memory card drafts.
 *
 * @remarks
 * Used in the memory card editor to build matching pairs.
 */
export type MemoryPairDraft = {
  known: string;
  learning: string;
  learningLexeme: LexemeDraftFields;
};

/**
 * A code block used in code-select card drafts.
 *
 * @remarks
 * Contains source code and its syntax-highlighting language.
 */
export type CodeBlockDraft = {
  code: string;
  language: CodeHighlightLanguage;
};

/**
 * Draft of a code-select card.
 *
 * @remarks
 * User selects the correct code block matching the prompt.
 */
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

/**
 * Draft of a select card (multiple-choice translation).
 *
 * @remarks
 * User chooses the correct translation from multiple options.
 */
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

/**
 * Draft of a memory card (pair matching).
 *
 * @remarks
 * User matches known words with their learning-language equivalents.
 */
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

/**
 * Draft of a symbol card (character recognition).
 *
 * @remarks
 * User selects the correct symbol from multiple options.
 */
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

/**
 * Draft of a sound card (audio matching).
 *
 * @remarks
 * User matches an audio clip with the correct text option.
 */
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

/**
 * Draft of a timed card (answer within time limit).
 *
 * @remarks
 * User selects the correct answer within a configurable time limit.
 */
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

/**
 * Draft of a keyboard card (typed answer).
 *
 * @remarks
 * User types the answer from the keyboard with configurable input modes.
 */
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

/**
 * Draft of a single stroke guide for draw cards.
 *
 * @remarks
 * Represents one stroke in the stroke order guide, stored as an SVG path
 * in the 100x100 viewBox coordinate system.
 */
export type DrawStrokeGuideDraft = {
  /** Zero-based stroke order index. */
  order: number;
  /** SVG path string in viewBox 0 0 100 100. */
  path: string;
};

/**
 * Draft of a draw card (character drawing).
 *
 * @remarks
 * User draws a Chinese character on a canvas with configurable practice modes.
 */
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

/**
 * Draft of a tone card (tone mark selection).
 *
 * @remarks
 * User selects the correct tone mark for a given syllable.
 */
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

/**
 * Draft of a reading card (passage interpretation).
 *
 * @remarks
 * User reads a passage and selects the correct interpretation.
 * Supports multiple reading options with lexeme data.
 */
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

/**
 * Union of all card draft kinds.
 *
 * @remarks
 * Used as the input type for card creation and editing operations.
 */
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

/**
 * Type alias: all card kinds are editable.
 *
 * @remarks
 * Convenience alias for use in card editor type guards and switch expressions.
 */
export type EditableCardKind = CardKind;

/**
 * Human-readable labels for each card kind (Russian).
 *
 * @remarks
 * Used in the card editor UI for kind selector dropdowns and display.
 */
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

/**
 * Array of all supported card kinds.
 *
 * @remarks
 * Used in the card editor for kind selector and validation.
 */
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

/**
 * Creates an empty lexeme card draft.
 *
 * @returns A `LexemeCardDraft` with empty prompt lexeme and empty audio URL.
 */
export const emptyLexemeCardDraft = (): LexemeCardDraft => ({
  promptLexeme: emptyLexemeDraftFields(),
  audioUrl: '',
});

/**
 * Creates an array of empty lexeme drafts.
 *
 * @param count - Number of empty lexeme drafts to create.
 * @returns Array of `LexemeDraftFields` with empty values.
 */
export const emptyOptionLexemes = (count: number): readonly LexemeDraftFields[] =>
  Array.from({ length: count }, () => emptyLexemeDraftFields());

/**
 * Creates an empty memory pair draft.
 *
 * @returns A `MemoryPairDraft` with empty known, learning, and lexeme fields.
 */
export const emptyMemoryPairDraft = (): MemoryPairDraft => ({
  known: '',
  learning: '',
  learningLexeme: emptyLexemeDraftFields(),
});
