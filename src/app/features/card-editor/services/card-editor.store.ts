import { Injectable, inject, signal } from '@angular/core';
import { Card, CardKind } from '../../../entities/card/model';
import { CardsApiService, CardSearchService } from '../../../entities/card';
import { ScenarioSearchService } from '../../../entities/scenario';
import type { CardIndexMetaOverride } from '../../../entities/card/model';
import { upsertCardIndexMetaOverride } from '../../../entities/card/storage/card-index-meta.storage';
import { LearningResultsStore } from '../../../entities/learning/model/learning-results.store';
import { UserStore } from '../../../entities/user/model/user.store';
import { executeWithOfflineFallback } from '../../../shared/api/offline-operation.util';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { SyncQueueService } from '../../../shared/sync';
import { CardDraft, CardEditorMode } from '../types';
import { cardToDraft, emptyCardDraft } from '../utils/draft/card-draft.utils';
import {
  cardValidationErrorMessage,
  normalizeCardDraft,
} from '../utils/validation/card-validation.utils';

/**
 * Store for the card editor feature.
 *
 * @remarks
 * Manages card creation, editing, and deletion. Validates constraints (card not used in scenarios,
 * no learning results) before deletion. Persists changes via `CardRepository` and refreshes the
 * catalog cache.
 */
@Injectable({ providedIn: 'root' })
export class CardEditorStore {
  private readonly cardsApi = inject(CardsApiService);
  private readonly cardSearchService = inject(CardSearchService);
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly learningResultsStore = inject(LearningResultsStore);
  private readonly userStore = inject(UserStore);
  private readonly syncQueue = inject(SyncQueueService);
  private readonly logger = inject(AppLoggerService);

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
   * The card returned by the last successful create/update operation.
   *
   * @remarks
   * The dialog reads this after `createCard()` / `updateCard()` to return the
   * persisted card ID and scenario binding to the caller.
   */
  readonly lastSavedCard = signal<Card | null>(null);

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
    this.lastSavedCard.set(null);
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
    this.lastSavedCard.set(null);
    this.error.set(null);
    this.editorLoading.set(true);

    try {
      const card = await this.cardSearchService.getCardById(cardId);
      this.editingCard.set(card);
      this.creatingKind.set(card.kind);
    } catch (error) {
      this.logger.error('CardEditor: failed to load card for edit', error);
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
    const normalized = normalizeCardDraft(draft, crypto.randomUUID());
    if (!normalized) {
      this.error.set(cardValidationErrorMessage(draft.kind));
      return false;
    }

    const card = applyMetaToCard(normalized, indexMeta);
    let saved: Card | null = null;

    const offlineHandler = async () => {
      await this.syncQueue.enqueue('card.create', { card });
      if (indexMeta) {
        upsertCardIndexMetaOverride(card.id, indexMeta);
      }
      this.refreshCatalog();
      this.cancelEdit();
    };

    const success = await executeWithOfflineFallback(async () => {
      saved = await this.cardsApi.create(card);
    }, offlineHandler);

    if (success) {
      this.lastSavedCard.set(saved ?? card);
      this.refreshCatalog();
      this.cancelEdit();
    }

    return success;
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
    const normalized = normalizeCardDraft(draft, cardId);
    if (!normalized) {
      this.error.set(cardValidationErrorMessage(draft.kind));
      return false;
    }

    const card = applyMetaToCard(normalized, indexMeta);
    let saved: Card | null = null;

    const offlineHandler = async () => {
      await this.syncQueue.enqueue('card.update', { cardId, card });
      if (indexMeta) {
        upsertCardIndexMetaOverride(cardId, indexMeta);
      }
      this.refreshCatalog();
      this.cancelEdit();
    };

    const success = await executeWithOfflineFallback(async () => {
      saved = await this.cardsApi.update(cardId, card);
    }, offlineHandler);

    if (success) {
      this.lastSavedCard.set(saved ?? card);
      this.refreshCatalog();
      this.cancelEdit();
    }

    return success;
  }

  /**
   * Deletes a card by ID.
   *
   * @param cardId - The card ID to delete.
   * @returns `true` if deleted successfully, `false` if the card is in use or has results.
   * @remarks Fails if the card is referenced by scenarios or has learning results.
   */
  async deleteCard(cardId: string): Promise<boolean> {
    try {
      await this.cardsApi.getById(cardId);
    } catch (error) {
      this.logger.warn('CardEditor: card not found for delete', error);
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

    const offlineHandler = async () => {
      await this.syncQueue.enqueue('card.delete', { cardId });
      this.refreshCatalog();
      this.error.set(null);

      if (this.editingCardId() === cardId) {
        this.cancelEdit();
      }
    };

    const success = await executeWithOfflineFallback(
      () => this.cardsApi.delete(cardId),
      offlineHandler,
    );

    if (success) {
      this.error.set(null);

      if (this.editingCardId() === cardId) {
        this.cancelEdit();
      }
    }

    return success;
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
   * Refreshes the catalog cache after a card mutation.
   *
   * @private
   */
  private refreshCatalog(): void {
    this.cardSearchService.refreshCatalog();
  }
}

/**
 * Merges dialog metadata into the normalized card before it is sent to the API.
 *
 * @remarks
 * `normalizeCardDraft` only validates kind-specific content and hierarchy IDs;
 * tags, difficulty, requiredTier, publication status, slug and language pair
 * live in the dialog metadata and must be copied onto the API payload.
 */
function applyMetaToCard(card: Card, meta?: CardIndexMetaOverride): Card {
  if (!meta) {
    return card;
  }

  return {
    ...card,
    ...(meta.tags !== undefined ? { tags: meta.tags } : {}),
    ...(meta.difficulty !== undefined ? { difficulty: meta.difficulty } : {}),
    ...(meta.requiredTier !== undefined ? { requiredTier: meta.requiredTier } : {}),
    ...(meta.published !== undefined ? { published: meta.published } : {}),
    ...(meta.slug !== undefined ? { slug: meta.slug } : {}),
    ...(meta.languagePairId !== undefined ? { languagePairId: meta.languagePairId } : {}),
  };
}
