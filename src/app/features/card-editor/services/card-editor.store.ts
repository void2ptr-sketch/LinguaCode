import { Injectable, inject, signal } from '@angular/core';
import { Card, CardKind } from '../../../core/models';
import { CardsCatalogMockHandler } from '../../../core/api/cards-catalog.mock.handler';
import { CardRepository, CardSearchService, ScenarioSearchService } from '../../../core/data';
import type { CardIndexMetaOverride } from '../../../core/data/card-index.mapper';
import { upsertCardIndexMetaOverride } from '../../../core/data/card-index-meta.storage';
import { LearningResultsStore, UserStore } from '../../../core/state';
import { CardDraft, CardEditorMode } from '../types';
import { cardToDraft, emptyCardDraft } from '../utils/card-draft.utils';
import { cardValidationErrorMessage, normalizeCardDraft } from '../utils/card-validation.utils';

@Injectable({ providedIn: 'root' })
export class CardEditorStore {
  private readonly cardRepository = inject(CardRepository);
  private readonly cardSearchService = inject(CardSearchService);
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly learningResultsStore = inject(LearningResultsStore);
  private readonly userStore = inject(UserStore);
  private readonly catalogMockHandler = inject(CardsCatalogMockHandler);

  readonly editingCard = signal<Card | null>(null);
  readonly editorLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editorMode = signal<CardEditorMode>('list');
  readonly editingCardId = signal<string | null>(null);
  readonly creatingKind = signal<CardKind>('select');

  startCreate(kind: CardKind): void {
    this.editorMode.set('create');
    this.editingCardId.set(null);
    this.editingCard.set(null);
    this.creatingKind.set(kind);
    this.error.set(null);
  }

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
      this.error.set('Не удалось загрузить карточку');
      this.cancelEdit();
    } finally {
      this.editorLoading.set(false);
    }
  }

  cancelEdit(): void {
    this.editorMode.set('list');
    this.editingCardId.set(null);
    this.editingCard.set(null);
    this.error.set(null);
  }

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

  async deleteCard(cardId: string): Promise<boolean> {
    const cards = await this.cardRepository.ensureLoaded();
    const card = this.cardRepository.getById(cards, cardId);
    if (!card) {
      return false;
    }

    const scenariosUsingCard = await this.scenarioSearchService.findUsingCard(cardId);
    if (scenariosUsingCard.length > 0) {
      this.error.set(
        `Нельзя удалить: карточка используется в сценариях (${scenariosUsingCard.map((item) => item.title).join(', ')})`,
      );
      return false;
    }

    if (this.learningResultsStore.hasResultsForCard(cardId)) {
      this.error.set('Нельзя удалить: есть сохранённые результаты по этой карточке');
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

  defaultAppearance(): CardDraft['appearance'] {
    return { ...this.userStore.preferences() };
  }

  emptyDraft(kind: CardKind): CardDraft {
    return emptyCardDraft(kind, this.defaultAppearance());
  }

  cardToDraft(card: Card): CardDraft {
    return cardToDraft(card);
  }

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
