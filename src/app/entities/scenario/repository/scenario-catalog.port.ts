import type { LanguagePair } from '../../language-pair/model/language-pair.types';
import type {
  Scenario,
  ScenarioIndexEntry,
  ScenarioSearchCriteria,
  ScenarioSearchPage,
} from '../model';

/**
 * Payload for creating or updating a scenario via the scenarios API.
 *
 * @remarks
 * Used by `ScenarioCatalogPort` methods to send scenario data to the backend.
 */
export type ScenarioWritePayload = {
  /** Display title of the scenario. */
  title: string;
  /** Detailed description of the scenario content. */
  description: string;
  /** How cards are sourced for this scenario (manual list or automatic filtering). */
  cardSource: Scenario['cardSource'];
  /** Whether the scenario is published and visible to learners. */
  published: boolean;
  /** Optional language pair for the scenario (e.g., { source: 'zh', target: 'en' }). */
  languagePair?: LanguagePair;
};

/**
 * Data-access contract for the scenario catalog.
 *
 * @remarks
 * Implemented by `ScenariosApiService` (HTTP). Mock handlers implement the same
 * contract server-side. Consumers should depend on this port, not on a concrete
 * implementation, so the data source can be swapped without changing callers.
 */
export type ScenarioCatalogPort = {
  /**
   * Searches scenarios by criteria.
   *
   * @param criteria - The search criteria.
   * @returns A page of scenario index entries.
   */
  search(criteria: ScenarioSearchCriteria): Promise<ScenarioSearchPage>;

  /**
   * Retrieves a scenario by ID.
   *
   * @param scenarioId - The scenario ID.
   * @returns The scenario.
   */
  getById(scenarioId: string): Promise<Scenario>;

  /**
   * Creates a new scenario.
   *
   * @param payload - The scenario write payload.
   * @returns The created scenario.
   */
  create(payload: ScenarioWritePayload): Promise<Scenario>;

  /**
   * Updates an existing scenario.
   *
   * @param scenarioId - The scenario ID.
   * @param payload - The scenario write payload.
   * @returns The updated scenario.
   */
  update(scenarioId: string, payload: ScenarioWritePayload): Promise<Scenario>;

  /**
   * Deletes a scenario by ID.
   *
   * @param scenarioId - The scenario ID.
   */
  delete(scenarioId: string): Promise<void>;

  /**
   * Finds all scenarios that reference a given card.
   *
   * @param cardId - The card ID.
   * @returns Array of scenario index entries that use this card.
   */
  findUsingCard(cardId: string): Promise<readonly ScenarioIndexEntry[]>;
};
