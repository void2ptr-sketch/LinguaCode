import type { CardDifficulty, CardKind } from '../../core/models';
import {
  CONTENT_LANGUAGE_LABELS,
  contentLanguages,
} from '../../core/data/language-pair.utils';

export { CONTENT_LANGUAGE_LABELS };

export const DIFFICULTY_LABELS: Record<CardDifficulty, string> = {
  beginner: 'Начальный',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

export const CARD_KIND_LABELS: Record<CardKind, string> = {
  select: 'Выбор ответа',
  memory: 'Запоминание',
  symbol: 'Символы',
  sound: 'Звук',
  timed: 'На время',
  keyboard: 'Клавиатура',
  draw: 'Рисование',
};

export const CARD_KINDS: readonly CardKind[] = [
  'select',
  'memory',
  'symbol',
  'sound',
  'timed',
  'keyboard',
  'draw',
];

export const CONTENT_LANGUAGES = contentLanguages();

export const DIFFICULTIES: readonly CardDifficulty[] = ['beginner', 'intermediate', 'advanced'];
