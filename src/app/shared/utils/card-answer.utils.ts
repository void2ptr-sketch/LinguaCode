import { Card, DrawCard, isOptionCard, ReadingCard } from '../../core/models';
import type { CardDirection } from '../../core/models/language-pair.types';
import {
  checkDrawCardAnswer,
  type HanziModelResolver,
} from '../../core/data/draw-card-answer.utils';
import {
  answersMatchRomanization,
  normalizeHanAnswer,
  normalizeZhuyinAnswer,
} from '../../core/data/cjk-answer-normalize.utils';
import {
  effectiveCardDirection,
  resolveKeyboardAcceptedAnswers,
  resolveOptionCard,
} from '../../core/data/card-direction.utils';
import { answersMatchIpa } from '../../core/data/ipa-normalize.utils';
import { collectLexemeAcceptedAnswers } from '../../core/data/lexeme-draft.utils';
import {
  resolveIpaString,
  resolveRomanizationReading,
} from '../../core/data/phonetic-lexeme.utils';
import type { PhoneticLexeme } from '../../core/models/phonetic-content.types';
import type { ResolvedOptionCard } from '../../core/data/card-direction.utils';
import { CardAnswerState } from '../types';

const normalizeLatinAnswer = (value: string): string => value.trim().toLowerCase();

function readingCandidateTexts(
  optionText: string,
  lexeme: PhoneticLexeme | undefined,
): readonly string[] {
  const candidates = new Set<string>();
  const add = (value: string | undefined): void => {
    const trimmed = value?.trim();
    if (trimmed) {
      candidates.add(trimmed);
    }
  };

  add(optionText);
  add(lexeme?.primary);
  add(lexeme?.pinyin);
  add(lexeme?.palladius);
  if (lexeme) {
    add(resolveRomanizationReading(lexeme, 'pinyin') ?? undefined);
    add(resolveRomanizationReading(lexeme, 'zhuyin') ?? undefined);
  }

  return [...candidates];
}

function readingTextsMatch(left: string, right: string): boolean {
  if (normalizeLatinAnswer(left) === normalizeLatinAnswer(right)) {
    return true;
  }

  if (answersMatchRomanization(left, right, 'pinyin', false)) {
    return true;
  }

  if (answersMatchRomanization(left, right, 'pinyin', true)) {
    return true;
  }

  if (answersMatchRomanization(left, right, 'palladius')) {
    return true;
  }

  if (normalizeHanAnswer(left) === normalizeHanAnswer(right)) {
    return true;
  }

  return answersMatchRomanization(left, right, 'zhuyin', false);
}

function readingCorrectTexts(card: ReadingCard, resolved: ResolvedOptionCard): readonly string[] {
  const correctIndex = resolved.correctIndex;
  const correctLexeme =
    card.optionsLexemes?.[correctIndex] ?? resolved.optionLexemes?.[correctIndex];
  const texts = new Set(
    readingCandidateTexts(resolved.options[correctIndex] ?? '', correctLexeme),
  );

  if (card.promptLexeme) {
    for (const text of readingCandidateTexts(card.promptLexeme.primary, card.promptLexeme)) {
      texts.add(text);
    }
  }

  return [...texts];
}

function matchesReadingCardSelection(
  card: ReadingCard,
  resolved: ResolvedOptionCard,
  selectedIndex: number,
): boolean {
  const correctIndex = resolved.correctIndex;
  if (selectedIndex === correctIndex) {
    return true;
  }

  const selectedLexeme =
    resolved.optionLexemes?.[selectedIndex] ?? card.optionsLexemes?.[selectedIndex];

  const correctTexts = readingCorrectTexts(card, resolved);
  const selectedTexts = readingCandidateTexts(
    resolved.options[selectedIndex] ?? '',
    selectedLexeme,
  );

  for (const selected of selectedTexts) {
    for (const correct of correctTexts) {
      if (readingTextsMatch(selected, correct)) {
        return true;
      }
    }
  }

  return false;
}

function checkOptionCardAnswer(
  card: Card & { kind: 'select' | 'symbol' | 'sound' | 'timed' | 'reading' },
  selectedIndex: number,
  sessionDirection: CardDirection,
): boolean {
  const direction = effectiveCardDirection(card.direction, sessionDirection);
  const resolved = resolveOptionCard(card, direction);

  if (card.kind === 'reading') {
    return matchesReadingCardSelection(card, resolved, selectedIndex);
  }

  return selectedIndex === resolved.correctIndex;
}

const matchesLexemeAnswer = (actual: string, lexeme: PhoneticLexeme): boolean => {
  const trimmed = actual.trim();
  if (!trimmed) {
    return false;
  }

  for (const expected of collectLexemeAcceptedAnswers(lexeme)) {
    if (normalizeLatinAnswer(expected) === normalizeLatinAnswer(trimmed)) {
      return true;
    }
  }

  if (
    lexeme.script === 'hani' &&
    normalizeHanAnswer(lexeme.primary) === normalizeHanAnswer(trimmed)
  ) {
    return true;
  }

  const systems = ['pinyin', 'palladius', 'zhuyin'] as const;
  for (const system of systems) {
    const reading = resolveRomanizationReading(lexeme, system);
    if (reading && answersMatchRomanization(trimmed, reading, system)) {
      return true;
    }
  }

  const ipa = resolveIpaString(lexeme.ipa);
  if (ipa && answersMatchIpa(trimmed, ipa)) {
    return true;
  }

  return false;
};

const matchesKeyboardAnswer = (
  actual: string,
  accepted: readonly string[],
  promptLexeme?: PhoneticLexeme,
): boolean => {
  const trimmed = actual.trim();
  if (!trimmed) {
    return false;
  }

  for (const answer of accepted) {
    if (normalizeLatinAnswer(answer) === normalizeLatinAnswer(trimmed)) {
      return true;
    }

    if (answersMatchRomanization(trimmed, answer, 'palladius')) {
      return true;
    }

    if (answersMatchRomanization(trimmed, answer, 'pinyin')) {
      return true;
    }

    if (normalizeZhuyinAnswer(trimmed) === normalizeZhuyinAnswer(answer)) {
      return true;
    }

    if (answersMatchIpa(trimmed, answer)) {
      return true;
    }
  }

  if (promptLexeme && matchesLexemeAnswer(trimmed, promptLexeme)) {
    return true;
  }

  return false;
};

export const canCheckCardAnswer = (card: Card, state: CardAnswerState): boolean => {
  switch (card.kind) {
    case 'select':
    case 'symbol':
    case 'sound':
    case 'timed':
    case 'reading':
    case 'tone':
      return state.selectedIndex !== null;
    case 'keyboard':
      return state.answerText.trim().length > 0;
    case 'memory':
      return state.memoryComplete;
    case 'draw':
      return state.drawSubmitted;
  }
};

export const checkCardAnswer = (
  card: Card,
  state: CardAnswerState,
  sessionDirection: CardDirection = 'known-to-learning',
  getHanziModel?: HanziModelResolver,
): boolean | null => {
  if (!canCheckCardAnswer(card, state)) {
    return null;
  }

  if (isOptionCard(card)) {
    return checkOptionCardAnswer(card, state.selectedIndex!, sessionDirection);
  }

  switch (card.kind) {
    case 'keyboard': {
      const direction = effectiveCardDirection(card.direction, sessionDirection);
      const accepted = resolveKeyboardAcceptedAnswers(card, direction);
      return matchesKeyboardAnswer(state.answerText, accepted, card.promptLexeme);
    }
    case 'tone':
      return state.selectedIndex === card.correctIndex;
    case 'memory':
      return state.memoryComplete;
    case 'draw':
      return checkDrawCardAnswer(
        card as DrawCard,
        state.drawSubmitted,
        state.drawAnswer,
        state.learningProficiencyLevel,
        getHanziModel,
      );
  }
};

export const getCorrectAnswerLabel = (
  card: Card,
  sessionDirection: CardDirection = 'known-to-learning',
): string | null => {
  if (isOptionCard(card)) {
    const direction = effectiveCardDirection(card.direction, sessionDirection);
    const resolved = resolveOptionCard(card, direction);

    if (card.kind === 'reading' && card.promptLexeme?.primary.trim()) {
      const prompt = card.promptLexeme;
      return (
        resolveRomanizationReading(prompt, 'pinyin') ??
        prompt.palladius?.trim() ??
        prompt.primary
      );
    }

    const lexeme =
      resolved.optionLexemes?.[resolved.correctIndex] ??
      resolveOptionLexeme(card, resolved.correctIndex);
    if (lexeme?.primary.trim()) {
      return lexeme.primary;
    }

    return resolved.options[resolved.correctIndex] ?? null;
  }

  if (card.kind === 'keyboard') {
    const direction = effectiveCardDirection(card.direction, sessionDirection);
    const accepted = resolveKeyboardAcceptedAnswers(card, direction);
    if (card.promptLexeme?.primary.trim()) {
      return accepted[0] ?? card.promptLexeme.primary;
    }

    return accepted[0] ?? null;
  }

  if (card.kind === 'tone') {
    const tone = card.toneOptions[card.correctIndex];
    return tone !== undefined ? String(tone) : null;
  }

  return null;
};

function resolveOptionLexeme(card: Card, index: number): PhoneticLexeme | undefined {
  if (
    card.kind === 'select' ||
    card.kind === 'timed' ||
    card.kind === 'sound' ||
    card.kind === 'reading'
  ) {
    return card.optionsLexemes?.[index];
  }

  if (card.kind === 'symbol') {
    return card.symbolLexemes?.[index];
  }

  return undefined;
}
