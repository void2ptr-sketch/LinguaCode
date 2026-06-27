import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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

import { CARD_KIND_LABELS, CONTENT_LANGUAGE_LABELS } from '../../../../shared/card-catalog-search';
import { contentLanguages } from '../../../../core/data/language-pair.utils';
import { CardsCatalogMockHandler } from '../../../../core/api/cards-catalog.mock.handler';
import { UserStore } from '../../../../core/state';
import { CardEditorStore } from '../../services/card-editor.store';
import type { CardDraft, CardIndexMetaDraft } from '../../types';
import {
  loadEditorUxMode,
  saveEditorUxMode,
  type CardEditorUxMode,
} from '../../utils/card-editor-ux.utils';
import { CardCreateWizardComponent } from '../card-create-wizard/card-create-wizard.component';
import { CardFormComponent } from '../card-form/card-form.component';
import { applyLexemeFirstToDraft } from '../../utils/card-draft-lexeme-first.utils';
import { indexTagsForDraft } from '../../utils/card-kind-index-meta.utils';
import { CardEditorDiscardDialogComponent } from './card-editor-discard-dialog.component';
import type { CardEditorDialogData, CardEditorDialogResult } from './card-editor-dialog.types';

function serializeDraft(draft: CardDraft): string {
  return JSON.stringify(draft);
}

@Component({
  selector: 'app-card-editor-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    CardFormComponent,
    CardCreateWizardComponent,
  ],
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

  readonly kindLabels = CARD_KIND_LABELS;
  readonly languages = contentLanguages();
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;
  readonly draft = signal<CardDraft>(this.store.emptyDraft('select'));
  readonly indexMeta = signal<CardIndexMetaDraft>({
    knownLanguage: this.userStore.languagePair().known,
    learningLanguage: this.userStore.languagePair().learning,
  });
  readonly editorUxMode = signal<CardEditorUxMode>(loadEditorUxMode());
  readonly useFullEditor = signal(false);
  private readonly initialSnapshot = signal('');
  private readonly initialMetaSnapshot = signal('');

  readonly defaultAppearance = computed(() => {
    const prefs = this.userStore.preferences();
    return { theme: prefs.theme, fontSize: prefs.fontSize };
  });

  readonly dirty = computed(
    () =>
      serializeDraft(this.draft()) !== this.initialSnapshot() ||
      JSON.stringify(this.indexMeta()) !== this.initialMetaSnapshot(),
  );

  readonly showWizard = computed(
    () => this.data.mode === 'create' && this.editorUxMode() === 'basic' && !this.useFullEditor(),
  );

  readonly title = computed(() => {
    if (this.data.mode === 'create') {
      return `Новая карточка · ${this.kindLabels[this.data.kind]}`;
    }

    return `Редактирование · ${this.kindLabels[this.draft().kind]}`;
  });

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
    const entry = await this.catalogHandler.getIndexEntry(this.data.cardId);
    const nextMeta = {
      knownLanguage: entry?.knownLanguage ?? this.userStore.languagePair().known,
      learningLanguage: entry?.learningLanguage ?? this.userStore.languagePair().learning,
    };
    this.draft.set(nextDraft);
    this.indexMeta.set(nextMeta);
    this.initialSnapshot.set(serializeDraft(nextDraft));
    this.initialMetaSnapshot.set(JSON.stringify(nextMeta));
  }

  setEditorUxMode(mode: CardEditorUxMode): void {
    this.editorUxMode.set(mode);
    saveEditorUxMode(mode);
    if (mode === 'advanced') {
      this.useFullEditor.set(true);
    }
  }

  expandToFullEditor(): void {
    this.useFullEditor.set(true);
  }

  updateDraft(nextDraft: CardDraft): void {
    this.draft.set(nextDraft);
  }

  updateIndexMeta(nextMeta: CardIndexMetaDraft): void {
    this.indexMeta.set(nextMeta);
  }

  onKnownLanguageChange(knownLanguage: CardIndexMetaDraft['knownLanguage']): void {
    this.updateIndexMeta({ ...this.indexMeta(), knownLanguage });
  }

  onLearningLanguageChange(learningLanguage: CardIndexMetaDraft['learningLanguage']): void {
    this.updateIndexMeta({ ...this.indexMeta(), learningLanguage });
  }

  async saveCard(): Promise<void> {
    let saved = false;
    const draftToSave = this.prepareDraftForSave(this.draft());
    const meta = {
      knownLanguage: this.indexMeta().knownLanguage,
      learningLanguage: this.indexMeta().learningLanguage,
      tags: [...indexTagsForDraft(draftToSave)],
    };

    if (this.data.mode === 'create') {
      saved = await this.store.createCard(draftToSave, meta);
    } else {
      saved = await this.store.updateCard(this.data.cardId, draftToSave, meta);
    }

    if (saved) {
      this.dialogRef.close({ saved: true });
    }
  }

  async cancel(): Promise<void> {
    if (!(await this.confirmClose())) {
      return;
    }

    this.store.cancelEdit();
    this.dialogRef.close({ saved: false });
  }

  private prepareDraftForSave(draft: CardDraft): CardDraft {
    let next = applyLexemeFirstToDraft(draft);

    if (this.editorUxMode() === 'basic') {
      next = {
        ...next,
        appearance: { ...this.defaultAppearance() },
      };
    }

    return next;
  }

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
