import { Injectable, inject, signal } from '@angular/core';
import { Card, CardKind } from '../../../core/models';
import { CardsCatalogMockHandler } from '../../../core/api/cards/cards-catalog.mock.handler';
import { CardRepository, CardSearchService, ScenarioSearchService } from '../../../core/repositories';
import type { CardIndexMetaOverride } from '../../../core/repositories/cards/mapping/card-index.mapper';
import { upsertCardIndexMetaOverride } from '../../../core/repositories/cards/storage/card-index-meta.storage';
import { LearningResultsStore, UserStore } from '../../../core/state';
import { CardDraft, CardEditorMode } from '../types';
import { cardToDraft, emptyCardDraft } from '../utils/card-draft.utils';
import { cardValidationErrorMessage, normalizeCardDraft } from '../utils/card-validation.utils';

/**
 * Store for the card editor feature.
 *
 * @remarks
 * Manages card creation, editing, and deletion. Validates constraints (card not used in scenarios,
 * no learning results) before deletion. Persists changes via `CardRepository` and refreshes the
 * catalog cache.
 */
@Injectable()
export class CardEditorStore {
  private readonly cardRepository = inject(CardRepository);
  private readonly cardSearchService = inject(CardSearchService);
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly learningResultsStore = inject(LearningResultsStore);
  private readonly userStore = inject(UserStore);
  private readonly catalogMockHandler = inject(CardsCatalogMockHandler);

  /**
   * The card currently being edited (or null when creating a new card).
   * @remarks
   * Set by `startEdit()` after loading from the API; cleared by `cancelEdit()`.
   */
  readonly editingCard = signal<Card | null>(null);

  /**
   * Whether the editor is loading a card for editing.
   * @remarks
   * Used to show a loading spinner while `startEdit()` fetches the card.
   */
  readonly editorLoading = signal(false);

  /**
   * Error message, if any.
   * @remarks
   * Set on failures (card not found, validation errors, deletion blocked).
   */
  readonly error = signal<string | null>(null);

  /**
   * Current editor mode ('list', 'create', or 'edit').
   * @remarks
   * Controls which UI is shown: catalog list, creation form, or editing form.
   */
  readonly editorMode = signal<CardEditorMode>('list');

  /**
   * ID of the card currently being edited (null when creating).
   * @remarks
   * Used to track which card is being edited for cancellation and UI state.
   */
  readonly editingCardId = signal<string | null>(null);

  /**
   * The kind of card being created.
   * @remarks
   * Set by `startCreate()`; used to initialize the draft.
   */
  readonly creatingKind = signal<CardKind>('select');

  /**
   * Enters create mode for a new card.
   *
   * @param kind - The kind of card to create.
   */
  startCreate(kind: CardKind): void {
    this.editorMode.set('create');
    this.editingCardId.set(null);
    this.editingCard.set(null);
    this.creatingKind.set(kind);
    this.error.set(null);
  }

  /**
   * Enters edit mode and loads the card by ID.
   *
   * @param cardId - The card ID to edit.
   * @returns A promise that resolves when the card is loaded.
   */
  async startEdit(cardId: string): Promise<void> {
    this.editorMode.set('edit');
    this.editingCardId.set(cardId);
    this.error.set(null);
    this.editorLoading.set(true);

    try {
      const card = await this.cardSearchService.getCardById(cardId);
      this.editingCard.set(card);
      this.creatingKind.set(card.kind);
    } catch {
      this.error.set('Card not found');
      this.cancelEdit();
    } finally {
      this.editorLoading.set(false);
    }
  }

  /**
   * Exits edit mode and returns to list view.
   */
  cancelEdit(): void {
    this.editorMode.set('list');
    this.editingCardId.set(null);
    this.editingCard.set(null);
    this.error.set(null);
  }

  /**
   * Creates a new card from a draft.
   *
   * @param draft - The card draft.
   * @param indexMeta - Optional card index metadata override.
   * @returns `true` if created successfully, `false` on validation error.
   */
  async createCard(draft: CardDraft, indexMeta?: CardIndexMetaOverride): Promise<boolean> {
    const card = normalizeCardDraft(draft, crypto.randomUUID());
    if (!card) {
      this.error.set(cardValidationErrorMessage(draft.kind));
      return false;
    }

    const cards = await this.cardRepository.ensureLoaded();
    await this.persist([...cards, card], card.id, indexMeta);
    this.cancelEdit();
    return true;
  }

  /**
   * Updates an existing card from a draft.
   *
   * @param cardId - The card ID to update.
   * @param draft - The card draft.
   * @param indexMeta - Optional card index metadata override.
   * @returns `true` if updated successfully, `false` on validation error.
   */
  async updateCard(
    cardId: string,
    draft: CardDraft,
    indexMeta?: CardIndexMetaOverride,
  ): Promise<boolean> {
    const card = normalizeCardDraft(draft, cardId);
    if (!card) {
      this.error.set(cardValidationErrorMessage(draft.kind));
      return false;
    }

    const cards = await this.cardRepository.ensureLoaded();
    const nextCards = cards.map((item) => (item.id === cardId ? card : item));
    await this.persist(nextCards, cardId, indexMeta);
    this.cancelEdit();
    return true;
  }

  /**
   * Deletes a card by ID.
   *
   * @param cardId - The card ID to delete.
   * @returns `true` if deleted successfully, `false` if the card is in use or has results.
   * @remarks Fails if the card is referenced by scenarios or has learning results.
   */
  async deleteCard(cardId: string): Promise<boolean> {
    const cards = await this.cardRepository.ensureLoaded();
    const card = this.cardRepository.getById(cards, cardId);
    if (!card) {
      return false;
    }

    const scenariosUsingCard = await this.scenarioSearchService.findUsingCard(cardId);
    if (scenariosUsingCard.length > 0) {
      this.error.set(
        `Cannot delete: card is used in scenarios (${scenariosUsingCard.map((item) => item.title).join(', ')})`,
      );
      return false;
    }

    if (this.learningResultsStore.hasResultsForCard(cardId)) {
      this.error.set('Cannot delete: there are saved results for this card');
      return false;
    }

    const nextCards = cards.filter((item) => item.id !== cardId);
    await this.persist(nextCards);
    this.error.set(null);

    if (this.editingCardId() === cardId) {
      this.cancelEdit();
    }

    return true;
  }

  /**
   * Returns default appearance settings from user preferences.
   *
   * @returns The default appearance settings for new cards.
   */
  defaultAppearance(): CardDraft['appearance'] {
    return { ...this.userStore.preferences() };
  }

  /**
   * Creates an empty draft for a given card kind.
   *
   * @param kind - The card kind.
   * @returns An empty card draft with default appearance.
   */
  emptyDraft(kind: CardKind): CardDraft {
    return emptyCardDraft(kind, this.defaultAppearance());
  }

  /**
   * Converts a card to a draft for editing.
   *
   * @param card - The card to convert.
   * @returns The card as a draft.
   */
  cardToDraft(card: Card): CardDraft {
    return cardToDraft(card);
  }

  /**
   * Persists cards and refreshes the catalog.
   *
   * @param cards - The full cards array to save.
   * @param cardId - Optional card ID for index meta override.
   * @param indexMeta - Optional card index metadata override.
   * @private
   */
  private async persist(
    cards: readonly Card[],
    cardId?: string,
    indexMeta?: CardIndexMetaOverride,
  ): Promise<void> {
    this.cardRepository.save(cards);

    if (cardId && indexMeta) {
      upsertCardIndexMetaOverride(cardId, indexMeta);
    }

    this.catalogMockHandler.resetCache();
    this.cardSearchService.refreshCatalog();
  }
}
