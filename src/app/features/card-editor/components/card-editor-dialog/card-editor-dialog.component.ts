import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';

import { CARD_KIND_LABELS, CONTENT_LANGUAGE_LABELS } from '../../../card-catalog-search';
import { contentLanguages } from '../../../../core/domain/language-pair/language-pair.utils';
import { CardsCatalogMockHandler } from '../../../../core/api/cards/cards-catalog.mock.handler';
import { UserStore } from '../../../../core/state';
import { CardEditorStore } from '../../services/card-editor.store';
import type { CardDraft, CardIndexMetaDraft, CardIndexMetaOverride } from '../../types';
import { loadEditorUxMode, type CardEditorUxMode } from '../../utils/card-editor-ux.utils';
import { CardFormComponent } from '../card-form/card-form.component';
import { applyLexemeFirstToDraft } from '../../utils/card-draft-lexeme-first.utils';
import { indexTagsForDraft } from '../../utils/card-kind-index-meta.utils';
import { CardEditorDiscardDialogComponent } from './card-editor-discard-dialog.component';
import type { CardEditorDialogData, CardEditorDialogResult } from './card-editor-dialog.types';

function serializeDraft(draft: CardDraft): string {
  return JSON.stringify(draft);
}

/**
 * Dialog component for creating and editing cards.
 *
 * @remarks
 * Wraps `CardFormComponent` with save/cancel actions and dirty-tracking.
 * Supports two modes: 'create' (new card) and 'edit' (existing card).
 * Shows a creation wizard in basic UX mode for card creation.
 *
 * @see CardFormComponent
 * @see CardEditorStore
 * @see CardEditorDialogData
 */
@Component({
  selector: 'app-card-editor-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    CardFormComponent,
  ],
  providers: [CardEditorStore],
  templateUrl: './card-editor-dialog.component.html',
  styleUrl: './card-editor-dialog.component.scss',
})
export class CardEditorDialogComponent implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<CardEditorDialogComponent, CardEditorDialogResult>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  readonly data = inject<CardEditorDialogData>(MAT_DIALOG_DATA);
  readonly store = inject(CardEditorStore);
  private readonly userStore = inject(UserStore);
  private readonly catalogHandler = inject(CardsCatalogMockHandler);

  /** Labels for all card kinds. */
  readonly kindLabels = CARD_KIND_LABELS;

  /** Available content languages. */
  readonly languages = contentLanguages();

  /** Labels for content languages. */
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  /** Current card draft being edited or created. */
  readonly draft = signal<CardDraft>(this.store.emptyDraft('select'));

  /** Index metadata draft containing language pair and tags. */
  readonly indexMeta = signal<CardIndexMetaDraft>({
    knownLanguage: this.userStore.languagePair().known,
    learningLanguage: this.userStore.languagePair().learning,
  });

  /** Card index meta override (tags, hierarchy references). */
  readonly cardMeta = signal<CardIndexMetaOverride | undefined>(undefined);

  /** Current editor UX mode ('basic' or 'advanced'). */
  readonly editorUxMode = signal<CardEditorUxMode>(loadEditorUxMode());

  /** Internal snapshot of the initial draft for dirty tracking. */
  private readonly initialSnapshot = signal('');

  /** Internal snapshot of the initial meta for dirty tracking. */
  private readonly initialMetaSnapshot = signal('');

  /** Computed default appearance from user preferences. */
  readonly defaultAppearance = computed(() => {
    const prefs = this.userStore.preferences();
    return { theme: prefs.theme, fontSize: prefs.fontSize };
  });

  /**
   * Whether the draft has unsaved changes compared to the initial snapshot.
   * @remarks
   * Used to prompt the user before closing the dialog with unsaved changes.
   */
  readonly dirty = computed(
    () =>
      serializeDraft(this.draft()) !== this.initialSnapshot() ||
      JSON.stringify(this.indexMeta()) !== this.initialMetaSnapshot(),
  );

  /**
   * Whether to show the creation wizard.
   * @remarks
   * True when in 'create' mode with basic UX enabled.
   */
  readonly showWizard = computed(
    () => this.data.mode === 'create' && this.editorUxMode() === 'basic',
  );

  /**
   * Computed dialog title based on mode (create vs edit) and card kind.
   * @remarks
   * Shows "Новая карточка · [kind]" for create mode,
   * or "Редактирование · [kind]" for edit mode.
   */
  readonly title = computed(() => {
    if (this.data.mode === 'create') {
      return `Новая карточка · ${this.kindLabels[this.data.kind]}`;
    }

    return `Редактирование · ${this.kindLabels[this.draft().kind]}`;
  });

  /**
   * Initializes the dialog from the stored state or creates a new draft.
   *
   * @remarks
   * In 'create' mode: initializes an empty draft and index meta from defaults.
   * In 'edit' mode: loads the existing card from the store and converts to draft.
   * Stores initial snapshots for dirty tracking.
   */
  async ngOnInit(): Promise<void> {
    if (this.data.mode === 'create') {
      this.store.startCreate(this.data.kind);
      const nextDraft = this.store.emptyDraft(this.data.kind);
      const nextMeta = {
        knownLanguage: this.userStore.languagePair().known,
        learningLanguage: this.userStore.languagePair().learning,
      };
      this.draft.set(nextDraft);
      this.indexMeta.set(nextMeta);
      this.cardMeta.set(undefined);
      this.initialSnapshot.set(serializeDraft(nextDraft));
      this.initialMetaSnapshot.set(JSON.stringify(nextMeta));
      return;
    }

    await this.store.startEdit(this.data.cardId);
    const editing = this.store.editingCard();

    if (!editing) {
      this.dialogRef.close(undefined);
      return;
    }

    const nextDraft = this.store.cardToDraft(editing);
    this.draft.set(nextDraft);
    this.cardMeta.set(editing.meta);

    // Initialize indexMeta from card meta or defaults
    const nextMeta = {
      knownLanguage: editing.meta?.knownLanguage ?? this.userStore.languagePair().known,
      learningLanguage: editing.meta?.learningLanguage ?? this.userStore.languagePair().learning,
    };
    this.indexMeta.set(nextMeta);
    this.initialSnapshot.set(serializeDraft(nextDraft));
    this.initialMetaSnapshot.set(JSON.stringify(nextMeta));
  }

  /**
   * Updates the editor UX mode.
   *
   * @param mode - The new UX mode ('basic' or 'advanced').
   */
  setEditorUxMode(mode: CardEditorUxMode): void {
    this.editorUxMode.set(mode);
  }

  /** Placeholder for future full-editor expansion. Currently a no-op. */
  expandToFullEditor(): void {
    // Этот метод больше не используется, но оставляем для совместимости
  }

  /**
   * Updates the current card draft.
   *
   * @param nextDraft - The new draft state.
   */
  updateDraft(nextDraft: CardDraft): void {
    this.draft.set(nextDraft);
  }

  /**
   * Updates the index metadata draft.
   *
   * @param nextMeta - The new index meta draft.
   */
  updateIndexMeta(nextMeta: CardIndexMetaDraft): void {
    this.indexMeta.set(nextMeta);
  }

  /**
   * Handles known language changes.
   *
   * @param knownLanguage - The new known language.
   */
  onKnownLanguageChange(knownLanguage: CardIndexMetaDraft['knownLanguage']): void {
    this.updateIndexMeta({ ...this.indexMeta(), knownLanguage });
    // Update cardMeta with the new language
    this.cardMeta.update((meta) => ({
      ...meta,
      knownLanguage,
    }));
  }

  /**
   * Handles learning language changes.
   *
   * @param learningLanguage - The new learning language.
   */
  onLearningLanguageChange(learningLanguage: CardIndexMetaDraft['learningLanguage']): void {
    this.updateIndexMeta({ ...this.indexMeta(), learningLanguage });
    // Update cardMeta with the new language
    this.cardMeta.update((meta) => ({
      ...meta,
      learningLanguage,
    }));
  }

  /**
   * Saves the current card (creates or updates).
   *
   * @remarks
   * Applies lexeme-first transformation, constructs meta, and delegates to the store.
   * Closes the dialog with `{ saved: true }` on success.
   */
  async saveCard(): Promise<void> {
    const draftToSave = this.prepareDraftForSave(this.draft());
    // Use cardMeta if available, otherwise construct meta from indexMeta and draft tags
    const meta = this.cardMeta() || {
      knownLanguage: this.indexMeta().knownLanguage,
      learningLanguage: this.indexMeta().learningLanguage,
      tags: [...indexTagsForDraft(draftToSave)],
    };

    const saved =
      this.data.mode === 'create'
        ? await this.store.createCard(draftToSave, meta)
        : await this.store.updateCard(this.data.cardId, draftToSave, meta);

    if (saved) {
      this.dialogRef.close({ saved: true });
    }
  }

  /**
   * Cancels the editor and closes the dialog.
   *
   * @remarks
   * Prompts for confirmation if there are unsaved changes.
   * Closes with `{ saved: false }` after confirmation or if no changes.
   */
  async cancel(): Promise<void> {
    if (!(await this.confirmClose())) {
      return;
    }

    this.store.cancelEdit();
    this.dialogRef.close({ saved: false });
  }

  /**
   * Applies lexeme-first transformation to the draft before saving.
   *
   * @param draft - The draft to transform.
   * @returns The transformed draft with lexeme-first ordering.
   */
  private prepareDraftForSave(draft: CardDraft): CardDraft {
    const next = applyLexemeFirstToDraft(draft);
    return next;
  }

  /**
   * Prompts the user to confirm closing with unsaved changes.
   *
   * @returns `true` if safe to close (no changes or user confirmed), `false` otherwise.
   */
  private async confirmClose(): Promise<boolean> {
    if (!this.dirty()) {
      return true;
    }

    const ref = this.dialog.open(CardEditorDiscardDialogComponent, {
      width: 'min(24rem, 96vw)',
      autoFocus: 'first-titled-element',
    });

    return (await firstValueFrom(ref.afterClosed())) === true;
  }
}
