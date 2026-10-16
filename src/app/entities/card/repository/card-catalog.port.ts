import type { Card, CardSearchCriteria, CardSearchPage } from '../model';

/**
 * Data-access contract for the card catalog.
 *
 * @remarks
 * Implemented by `CardsApiService` (HTTP). Mock handlers implement the same
 * contract server-side. Consumers should depend on this port, not on a concrete
 * implementation, so the data source can be swapped without changing callers.
 */
export type CardCatalogPort = {
  /**
   * Searches the card catalog with the given criteria.
   *
   * @param criteria - Search criteria including filters, pagination, and language scope.
   * @returns Promise resolving to the paginated search results with facets.
   */
  search(criteria: CardSearchCriteria): Promise<CardSearchPage>;

  /**
   * Retrieves a single card by ID.
   *
   * @param cardId - The card's unique identifier.
   * @returns Promise resolving to the card.
   */
  getById(cardId: string): Promise<Card>;

  /**
   * Retrieves multiple cards by their IDs in a single batch request.
   *
   * @param cardIds - Array of card IDs.
   * @returns Promise resolving to the array of cards (empty if `cardIds` is empty).
   */
  getByIds(cardIds: readonly string[]): Promise<readonly Card[]>;

  /**
   * Creates a new card.
   *
   * @param card - The card to create.
   * @returns Promise resolving to the created card.
   */
  create(card: Card): Promise<Card>;

  /**
   * Updates an existing card.
   *
   * @param cardId - The card ID.
   * @param card - The updated card.
   * @returns Promise resolving to the updated card.
   */
  update(cardId: string, card: Card): Promise<Card>;

  /**
   * Deletes a card by ID.
   *
   * @param cardId - The card ID.
   */
  delete(cardId: string): Promise<void>;
};
