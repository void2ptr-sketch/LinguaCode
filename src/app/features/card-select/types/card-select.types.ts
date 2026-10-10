import { Card } from '../../../core/models';
import { CardFeedback } from '../../../shared/types';

/**
 * A fixture for card selection testing.
 *
 * @remarks
 * Bundles a scenario ID with its associated cards for use in tests and demos.
 */
export type CardSelectFixture = {
  scenarioId: string;
  cards: readonly Card[];
};

/**
 * Re-export of `CardFeedback` with a feature-specific name.
 *
 * @remarks
 * Represents the feedback state after checking a card answer:
 * `null` (not yet checked), `'correct'`, or `'incorrect'`.
 * Provided under an alias to clarify its scope within card selection.
 */
export type { CardFeedback as CardSelectFeedback };
