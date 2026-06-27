import { stripPinyinTones } from '../../../core/data/cjk-romanization.utils';
import type { DrawCharacterTarget, DrawPracticeMode } from '../../../core/models/draw-practice.types';
import { normalizeToneOptions } from '../../../core/data/tone-mark.utils';
import type { LexemeDraftFields } from '../../../core/data/lexeme-draft.utils';
import {
  emptyLexemeDraftFields,
  normalizePhoneticLexemeDraft,
} from '../../../core/data/lexeme-draft.utils';
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
  ReadingCard,
  SelectCard,
  SoundCard,
  SymbolCard,
  TimedCard,
  ToneCard,
} from '../../../core/models';
import type { CardDirection } from '../../../core/models/language-pair.types';
import {
  CardDraft,
  DEFAULT_CARD_DIRECTION,
  DrawCardDraft,
  KeyboardCardDraft,
  MemoryCardDraft,
  ReadingCardDraft,
  SelectCardDraft,
  SoundCardDraft,
  SymbolCardDraft,
  TimedCardDraft,
  ToneCardDraft,
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

type OptionCardDraftSlice = {
  title: string;
  direction: CardDirection;
  promptKnown: string;
  promptLexeme: LexemeDraftFields;
  audioUrl: string;
  correctIndex: number;
  appearance: CardAppearance;
};

type OptionCardNormalizedCore = {
  title: string;
  direction: CardDirection;
  promptKnown: string;
  correctIndex: number;
  appearance: CardAppearance;
  promptLexeme?: PhoneticLexeme;
  audioUrl?: string;
  optionsLexemes?: readonly PhoneticLexeme[];
};

const normalizeOptionCardDraftCore = (
  draft: OptionCardDraftSlice,
  options: readonly string[] | null,
  optionLexemes: readonly LexemeDraftFields[] | undefined,
): OptionCardNormalizedCore | null => {
  const title = sanitizeTitle(draft.title);
  const promptKnown = sanitizePrompt(draft.promptKnown);

  if (!title || !promptKnown || !options) {
    return null;
  }

  const correctIndex = normalizeCorrectIndex(draft.correctIndex, options.length);
  if (correctIndex === null) {
    return null;
  }

  const promptLexeme = normalizeLexemeDraft(draft.promptLexeme, promptKnown);
  const optionsLexemes = normalizeLexemeList(options, optionLexemes);

  return {
    title,
    direction: normalizeDirection(draft.direction),
    promptKnown,
    correctIndex,
    appearance: normalizeAppearance(draft.appearance),
    ...(optionsLexemes ? { optionsLexemes } : {}),
    ...(promptLexeme ? { promptLexeme } : {}),
    ...(normalizeAudioUrl(draft.audioUrl) ? { audioUrl: normalizeAudioUrl(draft.audioUrl) } : {}),
  };
};

export const normalizeSelectCardDraft = (
  draft: SelectCardDraft,
  cardId: string,
): SelectCard | null => {
  const optionsLearning = normalizeOptions(draft.optionsLearning);
  const core = normalizeOptionCardDraftCore(draft, optionsLearning, draft.optionsLexemes);

  if (!core) {
    return null;
  }

  return {
    id: cardId,
    kind: 'select',
    optionsLearning: optionsLearning!,
    ...core,
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
  const symbols = normalizeOptions(draft.symbols);
  const core = normalizeOptionCardDraftCore(draft, symbols, draft.symbolLexemes);

  if (!core) {
    return null;
  }

  const { optionsLexemes: symbolLexemes, ...rest } = core;

  return {
    id: cardId,
    kind: 'symbol',
    symbols: symbols!,
    ...(symbolLexemes ? { symbolLexemes } : {}),
    ...rest,
  };
};

export const normalizeSoundCardDraft = (draft: SoundCardDraft, cardId: string): SoundCard | null => {
  const audioLabelLearning = sanitizeShort(draft.audioLabelLearning);
  const optionsKnown = normalizeOptions(draft.optionsKnown);
  const core = normalizeOptionCardDraftCore(draft, optionsKnown, draft.optionsLexemes);

  if (!core || !audioLabelLearning) {
    return null;
  }

  const promptLexeme =
    core.promptLexeme ??
    normalizeLexemeDraft(draft.audioLabelLexeme, audioLabelLearning);

  return {
    id: cardId,
    kind: 'sound',
    audioLabelLearning,
    optionsKnown: optionsKnown!,
    ...core,
    ...(promptLexeme ? { promptLexeme } : {}),
  };
};

export const normalizeTimedCardDraft = (draft: TimedCardDraft, cardId: string): TimedCard | null => {
  const optionsLearning = normalizeOptions(draft.optionsLearning);
  const timeLimitSec = Math.round(draft.timeLimitSec);
  const core = normalizeOptionCardDraftCore(draft, optionsLearning, draft.optionsLexemes);

  if (!core || timeLimitSec < MIN_TIME_SEC || timeLimitSec > MAX_TIME_SEC) {
    return null;
  }

  return {
    id: cardId,
    kind: 'timed',
    optionsLearning: optionsLearning!,
    timeLimitSec,
    ...core,
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
  const answerMode = draft.answerMode;

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
    ...(answerMode && answerMode !== 'auto' ? { answerMode } : {}),
  };
};

const normalizeCharacterTargets = (
  targets: readonly DrawCharacterTarget[] | undefined,
): readonly DrawCharacterTarget[] | undefined => {
  if (!targets?.length) {
    return undefined;
  }

  const normalized = targets
    .map((target) => {
      const character = sanitizeShort(target.character);
      const pinyin = sanitizeShort(target.pinyin ?? '');
      const zhuyin = sanitizeShort(target.zhuyin ?? '');
      const glossKnown = sanitizeHint(target.glossKnown ?? '');
      const radicalHint = sanitizeHint(target.radicalHint ?? '');
      const audioUrl = target.audioUrl ? normalizeAudioUrl(target.audioUrl) : undefined;

      if (!character) {
        return null;
      }

      return {
        character,
        ...(pinyin ? { pinyin } : {}),
        ...(zhuyin ? { zhuyin } : {}),
        ...(glossKnown ? { glossKnown } : {}),
        ...(radicalHint ? { radicalHint } : {}),
        ...(audioUrl ? { audioUrl } : {}),
      };
    })
    .filter((target): target is DrawCharacterTarget => target !== null);

  return normalized.length > 0 ? normalized : undefined;
};

const normalizePracticeMode = (mode?: DrawPracticeMode): DrawPracticeMode | undefined => {
  if (
    mode === 'stroke-order' ||
    mode === 'radicals' ||
    mode === 'freehand' ||
    mode === 'memory' ||
    mode === 'tracing' ||
    mode === 'hints'
  ) {
    return mode;
  }

  return undefined;
};

export const normalizeDrawCardDraft = (draft: DrawCardDraft, cardId: string): DrawCard | null => {
  const title = sanitizeTitle(draft.title);
  const promptKnown = sanitizePrompt(draft.promptKnown);
  const referenceHintKnown = sanitizeHint(draft.referenceHintKnown);
  const meaningKnown = sanitizeHint(draft.meaningKnown ?? '');
  const practiceMode = normalizePracticeMode(draft.practiceMode);
  const targetCharacter = sanitizeShort(draft.targetCharacter);
  const radicalHint = sanitizeHint(draft.radicalHint);
  const characterTargets = normalizeCharacterTargets(draft.characterTargets);
  const promptLexeme = normalizeLexemeDraft(draft.promptLexeme, promptKnown);

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
    ...(promptLexeme ? { promptLexeme } : {}),
    ...(normalizeAudioUrl(draft.audioUrl) ? { audioUrl: normalizeAudioUrl(draft.audioUrl) } : {}),
    ...(meaningKnown ? { meaningKnown } : {}),
    ...(practiceMode && practiceMode !== 'freehand' ? { practiceMode } : {}),
    ...(targetCharacter ? { targetCharacter } : {}),
    ...(radicalHint ? { radicalHint } : {}),
    ...(characterTargets ? { characterTargets } : {}),
  };
};

export const normalizeToneCardDraft = (draft: ToneCardDraft, cardId: string): ToneCard | null => {
  const title = sanitizeTitle(draft.title);
  const promptKnown = sanitizePrompt(draft.promptKnown);
  const syllableBase = stripPinyinTones(sanitizeShort(draft.syllableBase || draft.promptLexeme.pinyin));
  const toneOptions = normalizeToneOptions(draft.toneOptions);

  if (!title || !promptKnown || !syllableBase || !toneOptions) {
    return null;
  }

  const correctIndex = normalizeCorrectIndex(draft.correctIndex, toneOptions.length);
  if (correctIndex === null) {
    return null;
  }

  const promptLexeme = normalizeLexemeDraft(draft.promptLexeme, promptKnown);

  return {
    id: cardId,
    kind: 'tone',
    title,
    direction: normalizeDirection(draft.direction),
    promptKnown,
    syllableBase,
    toneOptions,
    correctIndex,
    appearance: normalizeAppearance(draft.appearance),
    ...(promptLexeme ? { promptLexeme } : {}),
    ...(normalizeAudioUrl(draft.audioUrl) ? { audioUrl: normalizeAudioUrl(draft.audioUrl) } : {}),
  };
};

export const normalizeReadingCardDraft = (
  draft: ReadingCardDraft,
  cardId: string,
): ReadingCard | null => {
  const optionsLearning = normalizeOptions(draft.optionsLearning);
  const core = normalizeOptionCardDraftCore(draft, optionsLearning, draft.optionsLexemes);

  if (!core) {
    return null;
  }

  return {
    id: cardId,
    kind: 'reading',
    optionsLearning: optionsLearning!,
    ...core,
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
    case 'tone':
      return normalizeToneCardDraft(draft, cardId);
    case 'reading':
      return normalizeReadingCardDraft(draft, cardId);
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
    case 'reading':
      return 'Проверьте название, контекст, варианты чтения и правильный ответ';
    case 'tone':
      return 'Проверьте название, подсказку, слог без тона и правильный тон';
  }
};
