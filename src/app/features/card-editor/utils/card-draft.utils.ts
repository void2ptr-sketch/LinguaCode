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

export const emptyCardDraft = (kind: CardKind, appearance: CardAppearance): CardDraft => {
  const lexemeFields = emptyLexemeCardDraft();

  switch (kind) {
    case 'select':
      return {
        kind: 'select',
        title: '',
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: '',
        optionsLearning: ['', ''],
        optionsLexemes: emptyOptionLexemes(2),
        correctIndex: 0,
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'code-select':
      return {
        kind: 'code-select',
        title: '',
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
        promptKnown: '',
        pairs: [emptyMemoryPairDraft()],
        appearance: { ...appearance },
        ...lexemeFields,
      };
    case 'symbol':
      return {
        kind: 'symbol',
        title: '',
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

export const cardToDraft = (card: Card): CardDraft => {
  const appearance = { ...card.appearance };
  const promptLexeme = lexemeToDraftFields('promptLexeme' in card ? card.promptLexeme : undefined);
  const audioUrl = 'audioUrl' in card ? (card.audioUrl ?? '') : '';

  switch (card.kind) {
    case 'select':
      return {
        kind: 'select',
        title: card.title,
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
    case 'code-select':
      return {
        kind: 'code-select',
        title: card.title,
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

export const cardSummary = (card: Card): string => {
  if (card.kind === 'code-select') {
    return card.caption?.trim() || card.prompt.code.split('\n')[0]?.trim() || card.title;
  }

  return card.promptKnown;
};
