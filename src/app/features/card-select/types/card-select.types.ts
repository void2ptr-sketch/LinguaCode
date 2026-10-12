import { Card } from '../../../entities/card/model';
import { CardFeedback } from '../../../entities/card/model/card-interaction.types';

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
