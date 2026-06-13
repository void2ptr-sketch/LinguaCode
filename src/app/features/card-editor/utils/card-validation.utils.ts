import {
  emptyLexemeDraftFields,
  normalizePhoneticLexemeDraft,
} from '../../../core/data/lexeme-draft.utils';
import type { LexemeDraftFields } from '../../../core/data/lexeme-draft.utils';
import {
  isAllowedFontSize,
  sanitizePlainText,
  sanitizeTheme,
} from '../../../core/security';
import type { PhoneticLexeme } from '../../../core/models/phonetic-content.types';
import {
  Card,
  CardAppearance,
  CardKind,
  DrawCard,
  KeyboardCard,
  MemoryCard,
  SelectCard,
  SoundCard,
  SymbolCard,
  TimedCard,
} from '../../../core/models';
import type { CardDirection } from '../../../core/models/language-pair.types';
import {
  CardDraft,
  DEFAULT_CARD_DIRECTION,
  DrawCardDraft,
  KeyboardCardDraft,
  MemoryCardDraft,
  SelectCardDraft,
  SoundCardDraft,
  SymbolCardDraft,
  TimedCardDraft,
} from '../types';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;
const MIN_PAIRS = 1;
const MAX_PAIRS = 12;
const MIN_ANSWERS = 1;
const MAX_ANSWERS = 8;
const MIN_TIME_SEC = 5;
const MAX_TIME_SEC = 600;

const sanitizeTitle = (value: string): string => sanitizePlainText(value, 128);
const sanitizePrompt = (value: string): string => sanitizePlainText(value, 512);
const sanitizeShort = (value: string): string => sanitizePlainText(value, 128);
const sanitizeHint = (value: string): string => sanitizePlainText(value, 256);

const normalizeDirection = (direction: CardDirection): CardDirection => {
  return direction === 'learning-to-known' ? 'learning-to-known' : DEFAULT_CARD_DIRECTION;
};

const normalizeAppearance = (appearance: CardAppearance): CardAppearance => {
  const fontSize = isAllowedFontSize(appearance.fontSize) ? appearance.fontSize : 'md';

  return {
    theme: sanitizeTheme(appearance.theme),
    fontSize,
  };
};

const normalizeOptions = (options: readonly string[]): readonly string[] | null => {
  const normalized = options.map(sanitizeShort).filter((option) => option.length > 0);

  if (normalized.length < MIN_OPTIONS || normalized.length > MAX_OPTIONS) {
    return null;
  }

  return normalized;
};

const normalizeCorrectIndex = (correctIndex: number, length: number): number | null => {
  if (correctIndex < 0 || correctIndex >= length) {
    return null;
  }

  return correctIndex;
};

const normalizeAudioUrl = (value: string): string | undefined => {
  const sanitized = sanitizePlainText(value, 512);
  return sanitized || undefined;
};

const normalizeLexemeDraft = (
  draft: LexemeDraftFields | undefined,
  fallbackPrimary?: string,
): PhoneticLexeme | undefined => {
  return normalizePhoneticLexemeDraft(draft ?? emptyLexemeDraftFields(), fallbackPrimary);
};

const normalizeLexemeList = (
  texts: readonly string[],
  drafts: readonly LexemeDraftFields[] | undefined,
): readonly PhoneticLexeme[] | undefined => {
  const lexemes = texts
    .map((text, index) => normalizeLexemeDraft(drafts?.[index], text))
    .filter((lexeme): lexeme is PhoneticLexeme => lexeme !== undefined);

  return lexemes.length > 0 ? lexemes : undefined;
};

export const normalizeSelectCardDraft = (
  draft: SelectCardDraft,
  cardId: string,
): SelectCard | null => {
  const title = sanitizeTitle(draft.title);
  const promptKnown = sanitizePrompt(draft.promptKnown);
  const optionsLearning = normalizeOptions(draft.optionsLearning);

  if (!title || !promptKnown || !optionsLearning) {
    return null;
  }

  const correctIndex = normalizeCorrectIndex(draft.correctIndex, optionsLearning.length);
  if (correctIndex === null) {
    return null;
  }

  const promptLexeme = normalizeLexemeDraft(draft.promptLexeme, promptKnown);
  const optionsLexemes = normalizeLexemeList(optionsLearning, draft.optionsLexemes);

  return {
    id: cardId,
    kind: 'select',
    title,
    direction: normalizeDirection(draft.direction),
    promptKnown,
    optionsLearning,
    correctIndex,
    appearance: normalizeAppearance(draft.appearance),
    ...(optionsLexemes ? { optionsLexemes } : {}),
    ...(promptLexeme ? { promptLexeme } : {}),
    ...(normalizeAudioUrl(draft.audioUrl) ? { audioUrl: normalizeAudioUrl(draft.audioUrl) } : {}),
  };
};

export const normalizeMemoryCardDraft = (
  draft: MemoryCardDraft,
  cardId: string,
): MemoryCard | null => {
  const title = sanitizeTitle(draft.title);
  const promptKnown = sanitizePrompt(draft.promptKnown);
  const pairs = draft.pairs
    .map((pair) => {
      const known = sanitizeShort(pair.known);
      const learning = sanitizeShort(pair.learning);
      const learningLexeme = normalizeLexemeDraft(pair.learningLexeme, learning);

      return {
        known,
        learning,
        ...(learningLexeme ? { learningLexeme } : {}),
      };
    })
    .filter((pair) => pair.known.length > 0 && pair.learning.length > 0);

  if (!title || !promptKnown || pairs.length < MIN_PAIRS || pairs.length > MAX_PAIRS) {
    return null;
  }

  const promptLexeme = normalizeLexemeDraft(draft.promptLexeme, promptKnown);

  return {
    id: cardId,
    kind: 'memory',
    title,
    promptKnown,
    pairs,
    appearance: normalizeAppearance(draft.appearance),
    ...(promptLexeme ? { promptLexeme } : {}),
    ...(normalizeAudioUrl(draft.audioUrl) ? { audioUrl: normalizeAudioUrl(draft.audioUrl) } : {}),
  };
};

export const normalizeSymbolCardDraft = (
  draft: SymbolCardDraft,
  cardId: string,
): SymbolCard | null => {
  const title = sanitizeTitle(draft.title);
  const promptKnown = sanitizePrompt(draft.promptKnown);
  const symbols = normalizeOptions(draft.symbols);

  if (!title || !promptKnown || !symbols) {
    return null;
  }

  const correctIndex = normalizeCorrectIndex(draft.correctIndex, symbols.length);
  if (correctIndex === null) {
    return null;
  }

  const promptLexeme = normalizeLexemeDraft(draft.promptLexeme, promptKnown);
  const symbolLexemes = normalizeLexemeList(symbols, draft.symbolLexemes);

  return {
    id: cardId,
    kind: 'symbol',
    title,
    direction: normalizeDirection(draft.direction),
    promptKnown,
    symbols,
    correctIndex,
    appearance: normalizeAppearance(draft.appearance),
    ...(symbolLexemes ? { symbolLexemes } : {}),
    ...(promptLexeme ? { promptLexeme } : {}),
    ...(normalizeAudioUrl(draft.audioUrl) ? { audioUrl: normalizeAudioUrl(draft.audioUrl) } : {}),
  };
};

export const normalizeSoundCardDraft = (draft: SoundCardDraft, cardId: string): SoundCard | null => {
  const title = sanitizeTitle(draft.title);
  const promptKnown = sanitizePrompt(draft.promptKnown);
  const audioLabelLearning = sanitizeShort(draft.audioLabelLearning);
  const optionsKnown = normalizeOptions(draft.optionsKnown);

  if (!title || !promptKnown || !audioLabelLearning || !optionsKnown) {
    return null;
  }

  const correctIndex = normalizeCorrectIndex(draft.correctIndex, optionsKnown.length);
  if (correctIndex === null) {
    return null;
  }

  const promptLexeme =
    normalizeLexemeDraft(draft.promptLexeme, promptKnown) ??
    normalizeLexemeDraft(draft.audioLabelLexeme, audioLabelLearning);
  const optionsLexemes = normalizeLexemeList(optionsKnown, draft.optionsLexemes);

  return {
    id: cardId,
    kind: 'sound',
    title,
    direction: normalizeDirection(draft.direction),
    promptKnown,
    audioLabelLearning,
    optionsKnown,
    correctIndex,
    appearance: normalizeAppearance(draft.appearance),
    ...(optionsLexemes ? { optionsLexemes } : {}),
    ...(promptLexeme ? { promptLexeme } : {}),
    ...(normalizeAudioUrl(draft.audioUrl) ? { audioUrl: normalizeAudioUrl(draft.audioUrl) } : {}),
  };
};

export const normalizeTimedCardDraft = (draft: TimedCardDraft, cardId: string): TimedCard | null => {
  const title = sanitizeTitle(draft.title);
  const promptKnown = sanitizePrompt(draft.promptKnown);
  const optionsLearning = normalizeOptions(draft.optionsLearning);
  const timeLimitSec = Math.round(draft.timeLimitSec);

  if (!title || !promptKnown || !optionsLearning) {
    return null;
  }

  const correctIndex = normalizeCorrectIndex(draft.correctIndex, optionsLearning.length);
  if (correctIndex === null || timeLimitSec < MIN_TIME_SEC || timeLimitSec > MAX_TIME_SEC) {
    return null;
  }

  const promptLexeme = normalizeLexemeDraft(draft.promptLexeme, promptKnown);
  const optionsLexemes = normalizeLexemeList(optionsLearning, draft.optionsLexemes);

  return {
    id: cardId,
    kind: 'timed',
    title,
    direction: normalizeDirection(draft.direction),
    promptKnown,
    optionsLearning,
    correctIndex,
    timeLimitSec,
    appearance: normalizeAppearance(draft.appearance),
    ...(optionsLexemes ? { optionsLexemes } : {}),
    ...(promptLexeme ? { promptLexeme } : {}),
    ...(normalizeAudioUrl(draft.audioUrl) ? { audioUrl: normalizeAudioUrl(draft.audioUrl) } : {}),
  };
};

export const normalizeKeyboardCardDraft = (
  draft: KeyboardCardDraft,
  cardId: string,
): KeyboardCard | null => {
  const title = sanitizeTitle(draft.title);
  const promptKnown = sanitizePrompt(draft.promptKnown);
  const acceptedAnswersKnown = draft.acceptedAnswersKnown
    .map(sanitizeShort)
    .filter((answer) => answer.length > 0);

  if (
    !title ||
    !promptKnown ||
    acceptedAnswersKnown.length < MIN_ANSWERS ||
    acceptedAnswersKnown.length > MAX_ANSWERS
  ) {
    return null;
  }

  const promptLexeme = normalizeLexemeDraft(draft.promptLexeme, promptKnown);

  return {
    id: cardId,
    kind: 'keyboard',
    title,
    direction: normalizeDirection(draft.direction),
    promptKnown,
    acceptedAnswersKnown,
    appearance: normalizeAppearance(draft.appearance),
    ...(promptLexeme ? { promptLexeme } : {}),
    ...(normalizeAudioUrl(draft.audioUrl) ? { audioUrl: normalizeAudioUrl(draft.audioUrl) } : {}),
  };
};

export const normalizeDrawCardDraft = (draft: DrawCardDraft, cardId: string): DrawCard | null => {
  const title = sanitizeTitle(draft.title);
  const promptKnown = sanitizePrompt(draft.promptKnown);
  const referenceHintKnown = sanitizeHint(draft.referenceHintKnown);

  if (!title || !promptKnown || !referenceHintKnown) {
    return null;
  }

  return {
    id: cardId,
    kind: 'draw',
    title,
    promptKnown,
    referenceHintKnown,
    appearance: normalizeAppearance(draft.appearance),
  };
};

export const normalizeCardDraft = (draft: CardDraft, cardId: string): Card | null => {
  switch (draft.kind) {
    case 'select':
      return normalizeSelectCardDraft(draft, cardId);
    case 'memory':
      return normalizeMemoryCardDraft(draft, cardId);
    case 'symbol':
      return normalizeSymbolCardDraft(draft, cardId);
    case 'sound':
      return normalizeSoundCardDraft(draft, cardId);
    case 'timed':
      return normalizeTimedCardDraft(draft, cardId);
    case 'keyboard':
      return normalizeKeyboardCardDraft(draft, cardId);
    case 'draw':
      return normalizeDrawCardDraft(draft, cardId);
  }
};

export const cardValidationErrorMessage = (kind: CardKind): string => {
  switch (kind) {
    case 'memory':
      return 'Проверьте название, подсказку и пары (минимум одна пара)';
    case 'keyboard':
      return 'Проверьте название, подсказку и допустимые ответы';
    case 'draw':
      return 'Проверьте название, подсказку и ориентир для рисования';
    case 'timed':
      return 'Проверьте название, подсказку (известный), варианты (новый), правильный ответ и лимит времени (5–600 сек)';
    case 'sound':
      return 'Проверьте название, подсказку, метку звука, варианты и правильный ответ';
    case 'symbol':
      return 'Проверьте название, подсказку, символы и правильный ответ';
    case 'select':
      return 'Проверьте название, подсказку (известный), варианты (новый) и правильный ответ';
  }
};
