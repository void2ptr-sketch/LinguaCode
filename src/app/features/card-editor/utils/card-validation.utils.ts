import {
  isAllowedFontSize,
  sanitizePlainText,
  sanitizeTheme,
} from '../../../core/security';
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
import {
  CardDraft,
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

export const normalizeSelectCardDraft = (
  draft: SelectCardDraft,
  cardId: string,
): SelectCard | null => {
  const title = sanitizeTitle(draft.title);
  const question = sanitizePrompt(draft.question);
  const options = normalizeOptions(draft.options);

  if (!title || !question || !options) {
    return null;
  }

  const correctIndex = normalizeCorrectIndex(draft.correctIndex, options.length);
  if (correctIndex === null) {
    return null;
  }

  return {
    id: cardId,
    kind: 'select',
    title,
    question,
    options,
    correctIndex,
    appearance: normalizeAppearance(draft.appearance),
  };
};

export const normalizeMemoryCardDraft = (
  draft: MemoryCardDraft,
  cardId: string,
): MemoryCard | null => {
  const title = sanitizeTitle(draft.title);
  const prompt = sanitizePrompt(draft.prompt);
  const pairs = draft.pairs
    .map((pair) => ({
      front: sanitizeShort(pair.front),
      back: sanitizeShort(pair.back),
    }))
    .filter((pair) => pair.front.length > 0 && pair.back.length > 0);

  if (!title || !prompt || pairs.length < MIN_PAIRS || pairs.length > MAX_PAIRS) {
    return null;
  }

  return {
    id: cardId,
    kind: 'memory',
    title,
    prompt,
    pairs,
    appearance: normalizeAppearance(draft.appearance),
  };
};

export const normalizeSymbolCardDraft = (
  draft: SymbolCardDraft,
  cardId: string,
): SymbolCard | null => {
  const title = sanitizeTitle(draft.title);
  const prompt = sanitizePrompt(draft.prompt);
  const symbols = normalizeOptions(draft.symbols);

  if (!title || !prompt || !symbols) {
    return null;
  }

  const correctIndex = normalizeCorrectIndex(draft.correctIndex, symbols.length);
  if (correctIndex === null) {
    return null;
  }

  return {
    id: cardId,
    kind: 'symbol',
    title,
    prompt,
    symbols,
    correctIndex,
    appearance: normalizeAppearance(draft.appearance),
  };
};

export const normalizeSoundCardDraft = (draft: SoundCardDraft, cardId: string): SoundCard | null => {
  const title = sanitizeTitle(draft.title);
  const prompt = sanitizePrompt(draft.prompt);
  const audioLabel = sanitizeShort(draft.audioLabel);
  const options = normalizeOptions(draft.options);

  if (!title || !prompt || !audioLabel || !options) {
    return null;
  }

  const correctIndex = normalizeCorrectIndex(draft.correctIndex, options.length);
  if (correctIndex === null) {
    return null;
  }

  return {
    id: cardId,
    kind: 'sound',
    title,
    prompt,
    audioLabel,
    options,
    correctIndex,
    appearance: normalizeAppearance(draft.appearance),
  };
};

export const normalizeTimedCardDraft = (draft: TimedCardDraft, cardId: string): TimedCard | null => {
  const title = sanitizeTitle(draft.title);
  const question = sanitizePrompt(draft.question);
  const options = normalizeOptions(draft.options);
  const timeLimitSec = Math.round(draft.timeLimitSec);

  if (!title || !question || !options) {
    return null;
  }

  const correctIndex = normalizeCorrectIndex(draft.correctIndex, options.length);
  if (correctIndex === null || timeLimitSec < MIN_TIME_SEC || timeLimitSec > MAX_TIME_SEC) {
    return null;
  }

  return {
    id: cardId,
    kind: 'timed',
    title,
    question,
    options,
    correctIndex,
    timeLimitSec,
    appearance: normalizeAppearance(draft.appearance),
  };
};

export const normalizeKeyboardCardDraft = (
  draft: KeyboardCardDraft,
  cardId: string,
): KeyboardCard | null => {
  const title = sanitizeTitle(draft.title);
  const prompt = sanitizePrompt(draft.prompt);
  const acceptedAnswers = draft.acceptedAnswers
    .map(sanitizeShort)
    .filter((answer) => answer.length > 0);

  if (
    !title ||
    !prompt ||
    acceptedAnswers.length < MIN_ANSWERS ||
    acceptedAnswers.length > MAX_ANSWERS
  ) {
    return null;
  }

  return {
    id: cardId,
    kind: 'keyboard',
    title,
    prompt,
    acceptedAnswers,
    appearance: normalizeAppearance(draft.appearance),
  };
};

export const normalizeDrawCardDraft = (draft: DrawCardDraft, cardId: string): DrawCard | null => {
  const title = sanitizeTitle(draft.title);
  const prompt = sanitizePrompt(draft.prompt);
  const referenceHint = sanitizeHint(draft.referenceHint);

  if (!title || !prompt || !referenceHint) {
    return null;
  }

  return {
    id: cardId,
    kind: 'draw',
    title,
    prompt,
    referenceHint,
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
      return 'Проверьте название, вопрос, варианты, правильный ответ и лимит времени (5–600 сек)';
    case 'sound':
      return 'Проверьте название, подсказку, метку звука, варианты и правильный ответ';
    case 'symbol':
      return 'Проверьте название, подсказку, символы и правильный ответ';
    case 'select':
      return 'Проверьте название, вопрос, варианты ответа и правильный ответ';
  }
};
