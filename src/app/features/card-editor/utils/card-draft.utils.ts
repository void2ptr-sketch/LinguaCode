import { Card, CardAppearance, CardKind } from '../../../core/models';
import { DEFAULT_TONE_OPTIONS } from '../../../core/data/chinese/tone-mark.utils';
import { lexemeToDraftFields } from '../../../core/data/chinese/lexeme-draft.utils';
import {
  CardDraft,
  DEFAULT_CARD_DIRECTION,
  emptyLexemeCardDraft,
  emptyMemoryPairDraft,
  emptyOptionLexemes,
} from '../types';

/**
 * Extracts hierarchical fields (course, lesson, scenario) from a card.
 *
 * @remarks
 * Used by `emptyCardDraft` and `cardToDraft` to populate form fields
 * with course/lesson/scenario references. Returns empty strings when card is undefined.
 *
 * @param card - The card to extract fields from (may be undefined for new cards).
 * @returns An object with courseId, lessonId, and scenarioId.
 */
function hierarchyFields(card?: { courseId?: string; lessonId?: string; scenarioId?: string }) {
  return {
    courseId: card?.courseId ?? '',
    lessonId: card?.lessonId ?? '',
    scenarioId: card?.scenarioId ?? '',
  };
}

/**
 * Creates an empty card draft for the specified card kind with default appearance.
 *
 * @param kind - The kind of card to create a draft for.
 * @param appearance - Default appearance settings (theme, font size).
 * @returns An empty card draft populated with default values for the given kind.
 */
export const emptyCardDraft = (kind: CardKind, appearance: CardAppearance): CardDraft => {
  const lexemeFields = emptyLexemeCardDraft();
  const h = hierarchyFields();

  switch (kind) {
    case 'select':
      return {
        kind: 'select',
        title: '',
        ...h,
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        optionsLearning: ['', ''],
        optionsKnown: ['', ''],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'code-select':
      return {
        kind: 'code-select',
        title: '',
        ...h,
        caption: '',
        prompt: { code: '', language: 'perl' },
        options: [
          { code: '', language: 'perl' },
          { code: '', language: 'perl' },
        ],
        correctIndex: 0,
        appearance: { ...appearance },
      };
    case 'memory':
      return {
        kind: 'memory',
        title: '',
        ...h,
        promptKnown: '',
        pairs: [emptyMemoryPairDraft()],
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'symbol':
      return {
        kind: 'symbol',
        title: '',
        ...h,
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        symbols: ['', ''],
        symbolLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'sound':
      return {
        kind: 'sound',
        title: '',
        ...h,
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        audioLabelLearning: '',
        audioLabelLexeme: lexemeToDraftFields(),
        optionsKnown: ['', ''],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'timed':
      return {
        kind: 'timed',
        title: '',
        ...h,
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        optionsLearning: ['', ''],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        timeLimitSec: 30,
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'keyboard':
      return {
        kind: 'keyboard',
        title: '',
        ...h,
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        acceptedAnswersKnown: [''],
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'draw':
      return {
        kind: 'draw',
        title: '',
        ...h,
        promptKnown: '',
        referenceHintKnown: '',
        targetCharacter: '',
        radicalHint: '',
        strokeGuides: [],
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'tone':
      return {
        kind: 'tone',
        title: '',
        ...h,
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        syllableBase: '',
        toneOptions: [...DEFAULT_TONE_OPTIONS],
        correctIndex: 0,
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'reading':
      return {
        kind: 'reading',
        title: '',
        ...h,
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        optionsLearning: ['', ''],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance: { ...appearance },
        ...lexemeFields,
      };
  }
};

/**
 * Converts a persisted Card object into a CardDraft for editing.
 *
 * Deep-copies all arrays and objects to prevent mutation of the original card.
 * Extracts lexeme fields, audio URL, and hierarchy references from the card.
 *
 * @param card - The card to convert.
 * @returns A card draft suitable for editing in the card form.
 */
export const cardToDraft = (card: Card): CardDraft => {
  const appearance = { ...card.appearance };
  const promptLexeme = lexemeToDraftFields('promptLexeme' in card ? card.promptLexeme : undefined);
  const audioUrl = 'audioUrl' in card ? (card.audioUrl ?? '') : '';
  const h = hierarchyFields(card);

  switch (card.kind) {
    case 'select':
      return {
        kind: 'select',
        title: card.title,
        ...h,
        direction: card.direction,
        promptKnown: card.promptKnown,
        optionsLearning: [...card.optionsLearning],
        optionsKnown: card.optionsKnown ?? card.optionsLearning.map(() => ''),
        optionsLexemes: card.optionsLearning.map((option, index) =>
          lexemeToDraftFields(card.optionsLexemes?.[index] ?? { primary: option, script: 'latn' }),
        ),
        correctIndex: card.correctIndex,
        appearance,
        promptLexeme,
        audioUrl,
      };
    case 'code-select':
      return {
        kind: 'code-select',
        title: card.title,
        ...h,
        caption: card.caption ?? '',
        prompt: { ...card.prompt },
        options: card.options.map((option) => ({ ...option })),
        correctIndex: card.correctIndex,
        appearance,
      };
    case 'memory':
      return {
        kind: 'memory',
        title: card.title,
        ...h,
        promptKnown: card.promptKnown,
        pairs: card.pairs.map((pair) => ({
          known: pair.known,
          learning: pair.learning,
          learningLexeme: lexemeToDraftFields(
            pair.learningLexeme ?? { primary: pair.learning, script: 'latn' },
          ),
        })),
        appearance,
        promptLexeme,
        audioUrl,
      };
    case 'symbol':
      return {
        kind: 'symbol',
        title: card.title,
        ...h,
        direction: card.direction,
        promptKnown: card.promptKnown,
        symbols: [...card.symbols],
        symbolLexemes: card.symbols.map((symbol, index) =>
          lexemeToDraftFields(card.symbolLexemes?.[index] ?? { primary: symbol, script: 'latn' }),
        ),
        correctIndex: card.correctIndex,
        appearance,
        promptLexeme,
        audioUrl,
      };
    case 'sound':
      return {
        kind: 'sound',
        title: card.title,
        ...h,
        direction: card.direction,
        promptKnown: card.promptKnown,
        audioLabelLearning: card.audioLabelLearning,
        audioLabelLexeme: lexemeToDraftFields(
          card.promptLexeme ?? { primary: card.audioLabelLearning, script: 'latn' },
        ),
        optionsKnown: [...card.optionsKnown],
        optionsLexemes: card.optionsKnown.map((option, index) =>
          lexemeToDraftFields(card.optionsLexemes?.[index] ?? { primary: option, script: 'latn' }),
        ),
        correctIndex: card.correctIndex,
        appearance,
        promptLexeme,
        audioUrl,
      };
    case 'timed':
      return {
        kind: 'timed',
        title: card.title,
        ...h,
        direction: card.direction,
        promptKnown: card.promptKnown,
        optionsLearning: [...card.optionsLearning],
        optionsLexemes: card.optionsLearning.map((option, index) =>
          lexemeToDraftFields(card.optionsLexemes?.[index] ?? { primary: option, script: 'latn' }),
        ),
        correctIndex: card.correctIndex,
        timeLimitSec: card.timeLimitSec,
        appearance,
        promptLexeme,
        audioUrl,
      };
    case 'keyboard':
      return {
        kind: 'keyboard',
        title: card.title,
        ...h,
        direction: card.direction,
        promptKnown: card.promptKnown,
        acceptedAnswersKnown: [...card.acceptedAnswersKnown],
        appearance,
        promptLexeme,
        audioUrl,
        ...(card.answerMode ? { answerMode: card.answerMode } : {}),
      };
    case 'draw':
      return {
        kind: 'draw',
        title: card.title,
        ...h,
        promptKnown: card.promptKnown,
        referenceHintKnown: card.referenceHintKnown,
        practiceMode: card.practiceMode,
        targetCharacter: card.targetCharacter ?? '',
        radicalHint: card.radicalHint ?? '',
        strokeGuides: (card.strokeGuides ?? []).map((guide) => ({ ...guide })),
        appearance,
        promptLexeme,
        audioUrl,
      };
    case 'tone':
      return {
        kind: 'tone',
        title: card.title,
        ...h,
        direction: card.direction,
        promptKnown: card.promptKnown,
        syllableBase: card.syllableBase,
        toneOptions: [...card.toneOptions],
        correctIndex: card.correctIndex,
        appearance,
        promptLexeme,
        audioUrl,
      };
    case 'reading':
      return {
        kind: 'reading',
        title: card.title,
        ...h,
        direction: card.direction,
        promptKnown: card.promptKnown,
        optionsLearning: [...card.optionsLearning],
        optionsLexemes: card.optionsLearning.map((option, index) =>
          lexemeToDraftFields(card.optionsLexemes?.[index] ?? { primary: option, script: 'latn' }),
        ),
        correctIndex: card.correctIndex,
        appearance,
        promptLexeme,
        audioUrl,
      };
  }
};

/**
 * Returns a human-readable summary string for displaying a card in lists.
 *
 * For code-select cards, returns the caption or the first line of the code prompt.
 * For all other card kinds, returns the prompt known text.
 *
 * @param card - The card to summarize.
 * @returns A short string representing the card's content.
 */
export const cardSummary = (card: Card): string => {
  if (card.kind === 'code-select') {
    return card.caption?.trim() || card.prompt.code.split('\n')[0]?.trim() || card.title;
  }

  return card.promptKnown;
};
