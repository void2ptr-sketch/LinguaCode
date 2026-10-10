import type { Card } from '../../../models';
import type { PhoneticLexeme } from '../../../models/phonetic-content.types';
import { isLikelyIpa } from '../../../domain/ipa/ipa-normalize.utils';

/**
 * Извлекает все транскрипции МФА (IPA) из фонетической лексемы.
 * Поддерживает строковое и массивовое представление вариантов произношения.
 */
export function collectLexemeIpaReadings(lexeme?: PhoneticLexeme): readonly string[] {
  if (!lexeme?.ipa) {
    return [];
  }

  if (typeof lexeme.ipa === 'string') {
    const trimmed = lexeme.ipa.trim();
    return trimmed ? [trimmed] : [];
  }

  return lexeme.ipa
    .map((variant) => variant.transcription.trim())
    .filter((value) => value.length > 0);
}

/**
 * Собирает все уникальные транскрипции МФА (IPA) из карточки.
 * Извлекает данные из лексем опций, пар памяти и известных ответов клавиатурной карточки.
 */
export function collectCardIpaReadings(card: Card): readonly string[] {
  const readings = new Set<string>();

  const addLexeme = (lexeme?: PhoneticLexeme): void => {
    for (const reading of collectLexemeIpaReadings(lexeme)) {
      readings.add(reading);
    }
  };

  if ('promptLexeme' in card) {
    addLexeme(card.promptLexeme);
  }

  switch (card.kind) {
    case 'select':
    case 'timed':
    case 'sound':
      for (const lexeme of card.optionsLexemes ?? []) {
        addLexeme(lexeme);
      }
      break;
    case 'symbol':
      for (const lexeme of card.symbolLexemes ?? []) {
        addLexeme(lexeme);
      }
      break;
    case 'memory':
      for (const pair of card.pairs) {
        addLexeme(pair.learningLexeme);
      }
      break;
    case 'keyboard':
      for (const answer of card.acceptedAnswersKnown) {
        if (isLikelyIpa(answer)) {
          readings.add(answer.trim());
        }
      }
      break;
    case 'draw':
      break;
  }

  return [...readings];
}

/** Проверяет, содержит ли карточку какие-либо транскрипции МФА (IPA). */
export function cardHasIpaContent(card: Card): boolean {
  return collectCardIpaReadings(card).length > 0;
}
