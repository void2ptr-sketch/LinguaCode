import { Injectable, computed, inject, signal } from '@angular/core';
import { Card, CardKind } from '../../../core/models';
import { CardRepository } from '../../../core/data';
import { LearningResultsStore, UserStore } from '../../../core/state';
import { ScenarioBuilderService } from '../../scenario-builder/services/scenario-builder.service';
import { Scenario } from '../../../core/models';
import { CardDraft, CardEditorMode } from '../types';
import { cardToDraft, emptyCardDraft } from '../utils/card-draft.utils';
import { cardValidationErrorMessage, normalizeCardDraft } from '../utils/card-validation.utils';

@Injectable({ providedIn: 'root' })
export class CardEditorStore {
  private readonly cardRepository = inject(CardRepository);
  private readonly scenarioBuilderService = inject(ScenarioBuilderService);
  private readonly learningResultsStore = inject(LearningResultsStore);
  private readonly userStore = inject(UserStore);

  readonly cards = signal<readonly Card[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editorMode = signal<CardEditorMode>('list');
  readonly editingCardId = signal<string | null>(null);
  readonly creatingKind = signal<CardKind>('select');

  readonly editingCard = computed(() => {
    const id = this.editingCardId();
    if (!id) {
      return null;
    }

    return this.cardRepository.getById(this.cards(), id);
  });

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const cards = await this.cardRepository.ensureLoaded();
      this.cards.set(cards);
    } catch {
      this.error.set('Не удалось загрузить карточки');
    } finally {
      this.loading.set(false);
    }
  }

  startCreate(kind: CardKind): void {
    this.editorMode.set('create');
    this.editingCardId.set(null);
    this.creatingKind.set(kind);
    this.error.set(null);
  }

  startEdit(cardId: string): void {
    const card = this.cardRepository.getById(this.cards(), cardId);
    if (!card) {
      return;
    }

    this.editorMode.set('edit');
    this.editingCardId.set(cardId);
    this.creatingKind.set(card.kind);
    this.error.set(null);
  }

  cancelEdit(): void {
    this.editorMode.set('list');
    this.editingCardId.set(null);
    this.error.set(null);
  }

  createCard(draft: CardDraft): boolean {
    const card = normalizeCardDraft(draft, crypto.randomUUID());
    if (!card) {
      this.error.set(cardValidationErrorMessage(draft.kind));
      return false;
    }

    const nextCards = [...this.cards(), card];
    this.persist(nextCards);
    this.cancelEdit();
    return true;
  }

  updateCard(cardId: string, draft: CardDraft): boolean {
    const card = normalizeCardDraft(draft, cardId);
    if (!card) {
      this.error.set(cardValidationErrorMessage(draft.kind));
      return false;
    }

    const nextCards = this.cards().map((item) => (item.id === cardId ? card : item));
    this.persist(nextCards);
    this.cancelEdit();
    return true;
  }

  deleteCard(cardId: string): boolean {
    const card = this.cardRepository.getById(this.cards(), cardId);
    if (!card) {
      return false;
    }

    const scenariosUsingCard = this.scenariosUsingCard(cardId);
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

    const nextCards = this.cards().filter((item) => item.id !== cardId);
    this.persist(nextCards);
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

  private scenariosUsingCard(cardId: string): readonly Scenario[] {
    return this.scenarioBuilderService.loadScenarios().filter((scenario) =>
      scenario.cardIds.includes(cardId),
    );
  }

  private persist(cards: readonly Card[]): void {
    this.cards.set(cards);
    this.cardRepository.save(cards);
  }
}
