import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CardKind } from '../../../../core/models';
import { formatIndexLanguagePair } from '../../../../core/data/language-pair/language-pair.utils';
import {
  CARD_KIND_LABELS,
  CardCatalogFiltersComponent,
  CardCatalogSearchStore,
  CONTENT_LANGUAGE_LABELS,
  tagLabel,
} from '../../../card-catalog-search';
import { DIFFICULTY_LABELS } from '../../../../shared/constants/catalog-labels';
import { UiPaginationComponent } from '../../../../shared/utils/pagination';
import { UserStore } from '../../../../core/state';
import { CardEditorDialogService } from '../card-editor-dialog/card-editor-dialog.service';
import { CardTryDialogService } from '../card-try-dialog/card-try-dialog.service';
import { CardEditorStore } from '../../services/card-editor.store';
import {
  CARD_CREATE_GROUP_HINTS,
  CARD_CREATE_GROUP_LABELS,
  CARD_CREATE_GROUPS,
  KINDS_BY_CREATE_GROUP,
} from '../../utils/card-create-groups.utils';
import type { CardIndexEntry } from '../../../../core/models';

let lastKnownActiveLanguagePairId: string | null = null;

/**
 * Page component for the card editor catalog.
 *
 * @remarks
 * Displays a paginated list of cards with filters, supports creating, editing,
 * trying, and deleting cards. Reloads the catalog when the active language pair changes.
 *
 * @see CardEditorDialogService
 * @see CardTryDialogService
 * @see CardCatalogSearchStore
 */
@Component({
  selector: 'app-card-editor-page',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    UiPaginationComponent,
    CardCatalogFiltersComponent,
  ],
  providers: [CardCatalogSearchStore, CardEditorStore],
  templateUrl: './card-editor-page.component.html',
  styleUrl: './card-editor-page.component.scss',
})
export class CardEditorPageComponent implements OnInit {
  readonly store = inject(CardEditorStore);
  readonly catalogStore = inject(CardCatalogSearchStore);
  private readonly cardEditorDialog = inject(CardEditorDialogService);
  private readonly cardTryDialog = inject(CardTryDialogService);
  private readonly userStore = inject(UserStore);

  /** Available card creation groups (e.g., 'basic', 'chinese'). */
  readonly createGroups = CARD_CREATE_GROUPS;

  /** Labels for card creation groups. */
  readonly createGroupLabels = CARD_CREATE_GROUP_LABELS;

  /** Hint text for each card creation group. */
  readonly createGroupHints = CARD_CREATE_GROUP_HINTS;

  /** Available card kinds organized by creation group. */
  readonly kindsByGroup = KINDS_BY_CREATE_GROUP;

  /** Labels for all card kinds. */
  readonly kindLabels = CARD_KIND_LABELS;

  /** Labels for content languages. */
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  /** Labels for difficulty levels. */
  readonly difficultyLabels = DIFFICULTY_LABELS;

  /** Utility function to generate tag labels. */
  readonly tagLabel = tagLabel;

  /** Computed list of card index entries from the catalog store. */
  readonly entries = computed(() => this.catalogStore.entries() as CardIndexEntry[]);

  /**
   * Effect that reloads the catalog when the active language pair changes.
   * @remarks
   * Tracks the last known language pair ID and reinitializes the catalog
   * when the user switches language pairs.
   */
  private readonly reloadOnActivePairChange = effect(() => {
    const activeId = this.userStore.activeLanguagePairId();
    const pair = this.userStore.languagePair();

    if (lastKnownActiveLanguagePairId !== null && lastKnownActiveLanguagePairId !== activeId) {
      void this.catalogStore.initWithActivePair(pair.known, pair.learning);
    }

    lastKnownActiveLanguagePairId = activeId;
  });

  /**
   * Formats the language pair label for a card index entry.
   *
   * @param entry - The card index entry with language pair information.
   * @returns Formatted language pair string (e.g., "zh → en").
   */
  formatEntryLanguages(entry: {
    knownLanguage: keyof typeof CONTENT_LANGUAGE_LABELS;
    learningLanguage: keyof typeof CONTENT_LANGUAGE_LABELS;
  }): string {
    return formatIndexLanguagePair(entry, this.languageLabels);
  }

  /**
   * Initializes the component with the active language pair.
   *
   * @remarks
   * Loads the card catalog for the user's current language pair.
   */
  async ngOnInit(): Promise<void> {
    const pair = this.userStore.languagePair();
    await this.catalogStore.initWithActivePair(pair.known, pair.learning);
  }

  /**
   * Opens the card creation dialog for the given card kind.
   *
   * @param kind - The kind of card to create.
   * @remarks
   * Reloads the catalog if the card was successfully saved.
   */
  async startCreate(kind: CardKind): Promise<void> {
    const result = await this.cardEditorDialog.openCreate(kind);
    if (result?.saved) {
      await this.catalogStore.init();
    }
  }

  /**
   * Opens the card editing dialog for the given card ID.
   *
   * @param cardId - The ID of the card to edit.
   * @remarks
   * Reloads the catalog if the card was successfully saved.
   */
  async startEdit(cardId: string): Promise<void> {
    const result = await this.cardEditorDialog.openEdit(cardId);
    if (result?.saved) {
      await this.catalogStore.init();
    }
  }

  /**
   * Opens the card try dialog for preview/testing.
   *
   * @param cardId - The ID of the card to try.
   */
  tryCard(cardId: string): void {
    void this.cardTryDialog.open(cardId);
  }

  /**
   * Deletes the card after confirmation.
   *
   * @param cardId - The ID of the card to delete.
   * @returns `true` if the card was deleted, `false` if cancelled.
   * @remarks
   * Reloads the catalog if the card was successfully deleted.
   */
  async deleteCard(cardId: string): Promise<void> {
    if (await this.store.deleteCard(cardId)) {
      await this.catalogStore.init();
    }
  }
}
