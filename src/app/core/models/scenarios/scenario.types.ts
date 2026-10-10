import type { LanguagePair } from '../common/language-pair.types';
import type { ScenarioCardSource } from './scenario-card-source.types';

/**
 * A scenario is a collection of cards organized for a learning exercise.
 *
 * @remarks
 * Scenarios reference card sources (fixed, snapshot, or criteria-based) to assemble card sets dynamically.
 */
export type Scenario = {
  id: string;
  title: string;
  description: string;
  authorId: string;
  cardSource: ScenarioCardSource;
  published: boolean;
  updatedAt: string;
  languagePair?: LanguagePair;
  courseId?: string;
};

/**
 * Legacy scenario type with optional fields for backward compatibility.
 *
 * @remarks
 * Used during migration from the old card-based scenario model to the new card-source model.
 */
export type LegacyScenario = {
  id: string;
  title: string;
  description: string;
  authorId: string;
  cardSource?: ScenarioCardSource;
  cardIds?: readonly string[];
  published?: boolean;
  updatedAt?: string;
  languagePair?: LanguagePair;
  courseId?: string;
};
