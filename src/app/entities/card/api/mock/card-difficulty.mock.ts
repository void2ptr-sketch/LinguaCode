import type { CardDifficulty } from '../../model';

/**
 * Mock difficulty options for the cards API interceptor.
 *
 * @remarks
 * Production values come from the backend reference endpoint
 * `GET /api/v1/cards/difficulties`, which reads
 * `content_difficulty_levels`. This constant is used only when
 * `environment.useCardsApiMock` is enabled.
 */
export const CARD_DIFFICULTY_MOCK_OPTIONS: readonly {
  code: CardDifficulty;
  label: string;
}[] = [
  { code: 'beginner', label: 'Начальный уровень' },
  { code: 'intermediate', label: 'Средний уровень' },
  { code: 'advanced', label: 'Продвинутый уровень' },
  { code: 'expert', label: 'Экспертный уровень' },
];
