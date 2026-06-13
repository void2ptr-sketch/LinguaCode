import type { CardDifficulty, CardKind, ContentLanguage } from '../../core/models';

export const CONTENT_LANGUAGE_LABELS: Record<ContentLanguage, string> = {
  en: 'English',
  zh: '中文',
  ru: 'Русский',
};

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

export const CONTENT_LANGUAGES: readonly ContentLanguage[] = ['en', 'zh', 'ru'];

export const DIFFICULTIES: readonly CardDifficulty[] = ['beginner', 'intermediate', 'advanced'];
