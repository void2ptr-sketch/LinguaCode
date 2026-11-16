import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { firstValueFrom } from 'rxjs';

import type { CardPaymentTier } from '../../../../entities/card/model';
import { LanguageService } from '../../../../entities/language-pair/services/language.service';
import { CardsCatalogMockHandler } from '../../../../entities/card/api/mock/cards-catalog.mock.handler';
import { UserStore } from '../../../../entities/user/model/user.store';
import { CardEditorStore } from '../../services/card-editor.store';
import { CatalogService } from '../../../../entities/card/api/catalog.service';
import type { CardDraft, CardIndexMetaDraft, CardIndexMetaOverride } from '../../types';
import {
  loadEditorUxMode,
  saveEditorUxMode,
  type CardEditorUxMode,
} from '../../utils/ux/card-editor-ux.utils';
import { CardFormComponent } from '../card-form/card-form.component';
import { applyLexemeFirstToDraft } from '../../utils/draft/card-draft-lexeme-first.utils';
import { indexTagsForDraft } from '../../utils/index-meta/card-kind-index-meta.utils';
import { CardEditorDiscardDialogComponent } from '../../../../shared/ui/dialogs';
import type { CardEditorDialogData, CardEditorDialogResult } from './card-editor-dialog.types';

/** Payment tier labels in Russian. */
const TIER_LABELS: Record<CardPaymentTier, string> = {
  FREE: 'Бесплатный',
  STARTER: 'Стартовый',
  GROWTH: 'Рост',
  PREMIUM: 'Премиум',
};

function serializeDraft(draft: CardDraft): string {
  return JSON.stringify(draft);
}

/**
 * Dialog component for creating and editing cards.
 *
 * @remarks
 * Wraps `CardFormComponent` with save/cancel actions and dirty-tracking.
 * Supports two modes: 'create' (new card) and 'edit' (existing card).
 * A slide toggle switches between basic and advanced editor UX modes and
 * persists the choice for subsequent dialog openings.
 *
 * @see CardFormComponent
 * @see CardEditorStore
 * @see CardEditorDialogData
 */
@Component({
  selector: 'app-card-editor-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
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
  private readonly languageService = inject(LanguageService);
  private readonly catalogService = inject(CatalogService);

  /** Labels for all card kinds from backend catalog. */
  readonly kindLabels = computed<Record<string, string>>(() =>
    Object.fromEntries(this.catalogService.cardKinds().map((k) => [k.code, k.label])),
  );

  /** Available content languages. */
  readonly languages = () => this.languageService.getCodes();

  /** Labels for content languages. */
  readonly languageLabels = () => this.languageService.getLabels();

  /** Current card draft being edited or created. */
  readonly draft = signal<CardDraft>(this.store.emptyDraft('select'));

  /** Index metadata draft containing language pair and tags. */
  readonly indexMeta = signal<CardIndexMetaDraft>({
    knownLanguage: this.userStore.languagePair().known,
    learningLanguage: this.userStore.languagePair().learning,
  });

  /** Card index meta override (tags, difficulty, tier, publication, slug). */
  readonly cardMeta = signal<CardIndexMetaOverride | undefined>(undefined);

  /** Whether the current save operation is in progress. */
  readonly saving = signal(false);

  /** Save error displayed inside the dialog. */
  readonly saveError = signal<string | null>(null);

  /** Current editor UX mode ('basic' or 'advanced'). */
  readonly editorUxMode = signal<CardEditorUxMode>(loadEditorUxMode());

  /** Internal snapshot of the initial draft for dirty tracking. */
  private readonly initialSnapshot = signal('');

  /** Internal snapshot of the initial meta for dirty tracking. */
  private readonly initialMetaSnapshot = signal('');

  /** Internal snapshot of the initial card meta for dirty tracking. */
  private readonly initialCardMetaSnapshot = signal('');

  /** Computed default appearance from user preferences. */
  readonly defaultAppearance = computed(() => {
    const prefs = this.userStore.preferences();
    return { theme: prefs.theme, fontSize: prefs.fontSize };
  });

  /** Compact language-pair summary shown under the dialog title. */
  readonly languagePairSummary = computed(() => {
    const labels = this.languageLabels();
    const known = labels[this.indexMeta().knownLanguage] ?? this.indexMeta().knownLanguage;
    const learning = labels[this.indexMeta().learningLanguage] ?? this.indexMeta().learningLanguage;
    return `${known} → ${learning}`;
  });

  /** Human-readable access tier label for the header summary. */
  readonly tierLabel = computed(() => {
    const tier = this.cardMeta()?.requiredTier;
    return tier ? TIER_LABELS[tier] : '';
  });

  /** Publication status label for the header summary. */
  readonly publicationLabel = computed(() => {
    const published = this.cardMeta()?.published;
    if (published === undefined) {
      return '';
    }
    return published ? 'Опубликована' : 'Черновик';
  });

  /**
   * Whether the draft has unsaved changes compared to the initial snapshot.
   * @remarks
   * Used to prompt the user before closing the dialog with unsaved changes.
   */
  readonly dirty = computed(
    () =>
      serializeDraft(this.draft()) !== this.initialSnapshot() ||
      JSON.stringify(this.indexMeta()) !== this.initialMetaSnapshot() ||
      JSON.stringify(this.cardMeta()) !== this.initialCardMetaSnapshot(),
  );

  /**
   * Whether to show the creation wizard.
   *
   * @remarks
   * True when in 'create' mode with basic UX enabled. The current dialog template
   * renders `CardFormComponent` directly, so this computed remains an extension
   * point for a future wizard wiring task.
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
    const labels = this.kindLabels();
    if (this.data.mode === 'create') {
      return `Новая карточка · ${labels[this.data.kind]}`;
    }

    return `Редактирование · ${labels[this.draft().kind]}`;
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
    // Load catalog metadata (card kinds, difficulties) so the form selects
    // are populated even when the dialog is opened directly from the explorer.
    void this.catalogService.ensureLoaded();

    if (this.data.mode === 'create') {
      this.store.startCreate(this.data.kind);
      const context = this.data.context;
      const nextDraft: CardDraft = {
        ...this.store.emptyDraft(this.data.kind),
        courseId: context?.courseId ?? '',
        programId: context?.programId ?? '',
        lessonId: context?.lessonId ?? '',
        scenarioId: context?.scenarioId ?? '',
      };
      const nextMeta: CardIndexMetaDraft = {
        knownLanguage: this.userStore.languagePair().known,
        learningLanguage: this.userStore.languagePair().learning,
        languagePairId: context?.languagePairId,
      };
      const nextCardMeta: CardIndexMetaOverride = {
        knownLanguage: nextMeta.knownLanguage,
        learningLanguage: nextMeta.learningLanguage,
        languagePairId: nextMeta.languagePairId,
        tags: [...indexTagsForDraft(nextDraft)],
        difficulty: 'beginner',
        requiredTier: 'FREE',
        published: true,
      };

      this.draft.set(nextDraft);
      this.indexMeta.set(nextMeta);
      this.cardMeta.set(nextCardMeta);
      this.initialSnapshot.set(serializeDraft(nextDraft));
      this.initialMetaSnapshot.set(JSON.stringify(nextMeta));
      this.initialCardMetaSnapshot.set(JSON.stringify(nextCardMeta));
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

    // Initialize indexMeta from card meta or defaults
    const nextMeta: CardIndexMetaDraft = {
      knownLanguage: editing.meta?.knownLanguage ?? this.userStore.languagePair().known,
      learningLanguage: editing.meta?.learningLanguage ?? this.userStore.languagePair().learning,
      languagePairId: editing.languagePairId ?? editing.meta?.languagePairId,
    };
    const nextCardMeta: CardIndexMetaOverride = {
      ...editing.meta,
      knownLanguage: nextMeta.knownLanguage,
      learningLanguage: nextMeta.learningLanguage,
      languagePairId: nextMeta.languagePairId,
      tags: editing.tags ?? editing.meta?.tags ?? [],
      difficulty: editing.difficulty ?? editing.meta?.difficulty,
      requiredTier: editing.requiredTier ?? editing.meta?.requiredTier ?? 'FREE',
      published: editing.published ?? editing.meta?.published ?? true,
      slug: editing.slug ?? editing.meta?.slug,
      updatedAt: editing.updatedAt ?? editing.meta?.updatedAt,
    };
    this.indexMeta.set(nextMeta);
    this.cardMeta.set(nextCardMeta);
    this.initialSnapshot.set(serializeDraft(nextDraft));
    this.initialMetaSnapshot.set(JSON.stringify(nextMeta));
    this.initialCardMetaSnapshot.set(JSON.stringify(nextCardMeta));
  }

  /**
   * Updates the editor UX mode and persists the choice.
   *
   * @param mode - The new UX mode ('basic' or 'advanced').
   */
  setEditorUxMode(mode: CardEditorUxMode): void {
    this.editorUxMode.set(mode);
    saveEditorUxMode(mode);
  }

  /**
   * Handles the «Расширенный режим» toggle.
   *
   * @param advanced - Whether the toggle is checked.
   */
  onAdvancedModeToggle(advanced: boolean): void {
    this.setEditorUxMode(advanced ? 'advanced' : 'basic');
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
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    try {
      const draftToSave = this.prepareDraftForSave(this.draft());
      const meta: CardIndexMetaOverride = {
        ...this.cardMeta(),
        knownLanguage: this.indexMeta().knownLanguage,
        learningLanguage: this.indexMeta().learningLanguage,
        languagePairId: this.cardMeta()?.languagePairId ?? this.indexMeta().languagePairId,
        tags: this.cardMeta()?.tags ?? [...indexTagsForDraft(draftToSave)],
      };

      const saved =
        this.data.mode === 'create'
          ? await this.store.createCard(draftToSave, meta)
          : await this.store.updateCard(this.data.cardId, draftToSave, meta);

      if (saved) {
        const savedCard = this.store.lastSavedCard();
        this.dialogRef.close({
          saved: true,
          cardId: savedCard?.id,
          scenarioId: savedCard?.scenarioId,
        });
      }
    } catch {
      this.saveError.set(
        'Не удалось сохранить карточку. Проверьте соединение и повторите попытку.',
      );
    } finally {
      this.saving.set(false);
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
