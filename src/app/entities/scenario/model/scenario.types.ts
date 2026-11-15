import type { LanguagePair } from '../../language-pair/model/language-pair.types';
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
  /** Numeric language pair ID (from `language_pairs.id`). Resolved to `languagePair` by the API service. */
  languagePairId?: number;
  /** Resolved from `languagePairId` via `LanguagePairsApiService` cache (read-only, derived). */
  languagePair?: LanguagePair;
  courseId?: string;
  programId?: string;
  lessonId?: string;
  requiredTier?: 'FREE' | 'STARTER' | 'GROWTH' | 'PREMIUM';
  /** Количество карточек в сценарии (от бэкенда, может быть undefined для legacy-данных). */
  cardCount?: number;
  /** Позиция сценария внутри урока (education_scenarios.scenario_order). */
  order?: number;
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
  programId?: string;
  lessonId?: string;
  languagePairId?: number;
  order?: number;
};
