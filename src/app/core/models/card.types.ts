import type { CardDirection } from './language-pair.types';
import type { CardIndexMetaOverride } from '../data/cards/card-index.mapper';

/**
 * Supported card kinds for language learning exercises.
 *
 * @remarks
 * Each kind determines the interaction pattern and UI component used during practice.
 */
export type CardKind =
  | 'select'
  | 'code-select'
  | 'memory'
  | 'symbol'
  | 'sound'
  | 'timed'
  | 'keyboard'
  | 'draw'
  | 'tone'
  | 'reading';

/**
 * User-configurable appearance settings for cards.
 *
 * @remarks
 * Applied to card preview and practice components for consistent styling.
 */
export type CardAppearance = {
  /** Theme name for the card (e.g., 'azure-blue', 'dark'). */
  theme: string;
  /** Font size preset: small, medium, or large. */
  fontSize: 'sm' | 'md' | 'lg';
};

/**
 * Base type shared by all card kinds.
 *
 * @remarks
 * Each specific card kind extends this type with kind-specific fields.
 */
export type CardBase = {
  id: string;
  kind: CardKind;
  title: string;
  appearance: CardAppearance;
  /** Card metadata. When absent, data from user-content-overlay is used. */
  meta?: CardIndexMetaOverride;
  /** ID of the Course this card belongs to. */
  courseId?: string;
  /** ID of the Lesson this card belongs to. */
  lessonId?: string;
  /** ID of the Scenario this card belongs to. */
  scenarioId?: string;
};

import type { PhoneticLexeme, ToneMark } from './phonetic-content.types';
import type { DrawPracticeMode, DrawStrokeGuide, DrawCharacterTarget } from './draw-practice.types';

/**
 * A pair of known and learning lexemes for memory cards.
 *
 * @remarks
 * Used in memory card exercises where the user matches known words with their learning-language equivalents.
 */
export type MemoryPair = {
  known: string;
  learning: string;
  learningLexeme?: PhoneticLexeme;
};

/**
 * Fields shared by lexeme-based card types.
 *
 * @remarks
 * Cards that display word-level content (lexemes) use these fields for the prompt and optional audio.
 */
export type LexemeCardFields = {
  promptLexeme?: PhoneticLexeme;
  audioUrl?: string;
};

/**
 * Supported syntax-highlighting languages for code-select cards.
 *
 * @remarks
 * Used by the code-highlight service to apply correct syntax coloring.
 * `plain` is a fallback for unrecognized languages.
 */
export type CodeHighlightLanguage =
  | 'perl'
  | 'cpp'
  | 'java'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'sql'
  | 'bash'
  | 'rust'
  | 'go'
  | 'plain';

/**
 * A code block used in code-select cards.
 *
 * @remarks
 * Contains source code and its syntax-highlighting language.
 * Used for both the prompt and options in code-select exercises.
 */
export type CodeBlock = {
  /** The source code text. */
  code: string;
  /** Syntax-highlighting language for the code block. */
  language: CodeHighlightLanguage;
};

/** Code-select card: user selects the correct code block matching the prompt. */
export type CodeSelectCard = CardBase & {
  kind: 'code-select';
  caption?: string;
  prompt: CodeBlock;
  options: readonly CodeBlock[];
  correctIndex: number;
};

/**
 * Select card: user chooses the correct translation from multiple options.
 *
 * @remarks
 * Supports both directions: known→learning and learning→known.
 */
export type SelectCard = CardBase &
  LexemeCardFields & {
    kind: 'select';
    direction: CardDirection;
    promptKnown: string;
    optionsLearning: readonly string[];
    /** Options in the known language — for "new → known" direction. */
    optionsKnown?: readonly string[];
    optionsLexemes?: readonly PhoneticLexeme[];
    correctIndex: number;
  };

/**
 * Memory card: user matches pairs of known and learning lexemes.
 *
 * @remarks
 * The board layout is randomized on each display via `memoryBoardNonce`.
 */
export type MemoryCard = CardBase &
  LexemeCardFields & {
    kind: 'memory';
    promptKnown: string;
    pairs: readonly MemoryPair[];
  };

/**
 * Symbol card: user selects the correct symbol from multiple options.
 *
 * @remarks
 * Typically used for Chinese character recognition exercises.
 */
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

/**
 * Sound card: user matches an audio clip with the correct text option.
 *
 * @remarks
 * Supports both directions: audio→text and text→audio.
 */
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

/**
 * Timed card: user selects the correct answer within a time limit.
 *
 * @remarks
 * The `timeLimitSec` field controls the countdown duration in seconds.
 */
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

/** Input mode for keyboard cards: free-text, IPA transcription, Pinyin, or auto-detect. */
export type KeyboardAnswerMode = 'text' | 'ipa' | 'pinyin' | 'auto';

/**
 * Keyboard card: user types the answer from the keyboard.
 *
 * @remarks
 * Supports multiple accepted answers and various input modes (text, IPA, Pinyin).
 */
export type KeyboardCard = CardBase &
  LexemeCardFields & {
    kind: 'keyboard';
    direction: CardDirection;
    promptKnown: string;
    acceptedAnswersKnown: readonly string[];
    /** Acceptable answers in the learning language — for "known → new" mode. */
    acceptedAnswersLearning?: readonly string[];
    answerMode?: KeyboardAnswerMode;
  };

/**
 * Draw card: user draws a Chinese character on a canvas.
 *
 * @remarks
 * Supports stroke guides, radical hints, and multiple characters across tabs.
 */
export type DrawCard = CardBase &
  LexemeCardFields & {
    kind: 'draw';
    promptKnown: string;
    referenceHintKnown: string;
    /** Meaning / translation displayed in the question zone (without the character). */
    meaningKnown?: string;
    practiceMode?: DrawPracticeMode;
    targetCharacter?: string;
    strokeGuides?: readonly DrawStrokeGuide[];
    radicalHint?: string;
    /** One character per tab; when absent, falls back to `targetCharacter` / `promptLexeme`. */
    characterTargets?: readonly DrawCharacterTarget[];
  };

/**
 * Tone card: user selects the correct tone mark for a given syllable.
 *
 * @remarks
 * Used for Mandarin Chinese tone recognition exercises.
 */
export type ToneCard = CardBase &
  LexemeCardFields & {
    kind: 'tone';
    direction: CardDirection;
    promptKnown: string;
    syllableBase: string;
    toneOptions: readonly ToneMark[];
    correctIndex: number;
  };

/**
 * Reading card: user reads a passage and selects the correct interpretation.
 *
 * @remarks
 * Similar to SelectCard but designed for longer text passages.
 */
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

/**
 * Union of all card kinds.
 *
 * @remarks
 * This is the primary card type used throughout the application.
 */
export type Card =
  | SelectCard
  | CodeSelectCard
  | MemoryCard
  | SymbolCard
  | SoundCard
  | TimedCard
  | KeyboardCard
  | DrawCard
  | ToneCard
  | ReadingCard;

/**
 * Subset of Card types that present multiple-choice options.
 *
 * @remarks
 * These cards share a common answer-checking pattern via `canCheckCardAnswer` and `checkCardAnswer`.
 */
export type OptionCard =
  | SelectCard
  | CodeSelectCard
  | SymbolCard
  | SoundCard
  | TimedCard
  | ReadingCard;

/**
 * Type guard: checks whether a card is an option-based card (multiple choice).
 *
 * @param card - The card to check.
 * @returns `true` if the card is one of: select, code-select, symbol, sound, timed, reading.
 */
export const isOptionCard = (card: Card): card is OptionCard => {
  return (
    card.kind === 'select' ||
    card.kind === 'code-select' ||
    card.kind === 'symbol' ||
    card.kind === 'sound' ||
    card.kind === 'timed' ||
    card.kind === 'reading'
  );
};
