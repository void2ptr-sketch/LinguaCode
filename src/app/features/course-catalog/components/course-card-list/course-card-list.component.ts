import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import type {
  ContentLanguage,
  UserLanguagePairEntry,
} from '../../../../core/models';
import {
  CONTENT_LANGUAGE_LABELS,
  contentLanguages,
} from '../../../../core/repositories/language-pair/language-pair.utils';
import { UserStore } from '../../../../core/state';
import { CourseCatalogStore } from '../../services/course-catalog.store';

/**
 * Course card list component. Displays the courses tab of the course catalog,
 * including user profile settings and language pair management.
 * @remarks Delegates state to `CourseCatalogStore` and `UserStore`.
 */
@Component({
  selector: 'app-course-catalog-courses',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
  ],
  standalone: true,
  templateUrl: './course-card-list.component.html',
  styleUrl: './course-card-list.component.scss',
})
export class CourseCatalogCoursesComponent {
  private readonly userStore = inject(UserStore);
  private readonly catalogStore = inject(CourseCatalogStore);

  /** Current user's display name from the store. */
  readonly displayName = this.userStore.displayName;
  /** User preferences signal from the store. */
  readonly preferences = this.userStore.preferences;
  /** Available language pairs from the store. */
  readonly languagePairs = this.userStore.languagePairs;
  /** Active language pair ID from the store. */
  readonly activeLanguagePairId = this.userStore.activeLanguagePairId;

  /** Draft value for the user's display name. */
  readonly nameDraft = this.catalogStore.nameDraft;
  /** Draft value for the learning proficiency level. */
  readonly learningProficiencyDraft = this.catalogStore.learningProficiencyDraft;
  /** Draft value for the application theme. */
  readonly themeDraft = this.catalogStore.themeDraft;
  /** Draft value for the font size preference. */
  readonly fontSizeDraft = this.catalogStore.fontSizeDraft;
  /** Draft value for the color scheme. */
  readonly colorSchemeDraft = this.catalogStore.colorSchemeDraft;
  /** Draft value for the card focus fullscreen preference. */
  readonly cardFocusFullscreenDraft = this.catalogStore.cardFocusFullscreenDraft;

  /** Draft value for the known (source) language. */
  readonly knownLanguageDraft = this.catalogStore.knownLanguageDraft;
  /** Draft value for the learning (target) language. */
  readonly learningLanguageDraft = this.catalogStore.learningLanguageDraft;

  /** Available content languages. */
  readonly languages = contentLanguages();
  /** Labels for content languages. */
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  /** Whether the current language pair draft is invalid. */
  readonly languagePairInvalid = this.catalogStore.languagePairInvalid;

  /**
   * Whether there is more than one language pair (enables removal).
   *
   * @remarks
   * When `true`, the "Remove" button is shown for each language pair entry.
   * Prevents the user from removing the last remaining pair.
   */
  readonly canRemovePair = computed(() => this.languagePairs().length > 1);

  // ---- Methods ----

  /**
   * Formats a language pair entry as a human-readable label.
   *
   * @param entry - The language pair entry to format.
   * @returns A string in the format "KnownLanguage → LearningLanguage".
   */
  entryLabel(entry: UserLanguagePairEntry): string {
    return `${entry.pair.known} → ${entry.pair.learning}`;
  }

  /**
   * Checks whether the given entry is the active language pair.
   *
   * @param entry - The language pair entry to check.
   * @returns `true` if the entry's ID matches the active language pair ID.
   */
  isActive(entry: UserLanguagePairEntry): boolean {
    return entry.id === this.activeLanguagePairId();
  }

  /**
   * Adds a new language pair from the draft values.
   *
   * @remarks
   * Only adds the pair if the known and learning languages are different
   * (checked via `languagePairInvalid`). Sets the settings pair ID draft
   * to the newly added pair's ID.
   */
  onAddPair(): void {
    if (!this.languagePairInvalid()) {
      this.userStore.addLanguagePair({
        known: this.knownLanguageDraft(),
        learning: this.learningLanguageDraft(),
      });
      this.catalogStore.setSettingsPairIdDraft(this.activeLanguagePairId());
    }
  }

  /**
   * Updates the known language draft.
   *
   * @param lang - The selected known content language.
   */
  onChangeKnownLanguage(lang: ContentLanguage): void {
    this.catalogStore.setKnownLanguageDraft(lang);
  }

  /**
   * Updates the learning language draft.
   *
   * @param lang - The selected learning content language.
   */
  onChangeLearningLanguage(lang: ContentLanguage): void {
    this.catalogStore.setLearningLanguageDraft(lang);
  }

  /**
   * Sets the active language pair and updates the settings target.
   *
   * @param id - The ID of the language pair to activate.
   *
   * @remarks
   * Updates both the user store's active pair and the catalog store's settings
   * pair ID draft to ensure the settings tab reflects the newly active pair.
   */
  onSetActive(id: string): void {
    this.userStore.setActiveLanguagePair(id);
    this.catalogStore.setSettingsPairIdDraft(id);
  }

  /**
   * Removes a language pair and updates the settings target if needed.
   *
   * @param id - The ID of the language pair to remove.
   *
   * @remarks
   * If the removed pair was the active settings target, the settings draft
   * is updated to the current active language pair ID.
   */
  onRemovePair(id: string): void {
    const wasSettingsTarget = this.catalogStore.settingsPairIdDraft() === id;
    this.userStore.removeLanguagePair(id);

    if (wasSettingsTarget) {
      this.catalogStore.setSettingsPairIdDraft(this.activeLanguagePairId());
    }
  }

  /**
   * Saves the user profile by persisting all draft values.
   *
   * @remarks
   * Writes `nameDraft` to the display name and all preference drafts
   * (theme, fontSize, colorScheme, cardFocusFullscreen, learningProficiency)
   * to the user preferences via `UserStore`.
   */
  onSaveProfile(): void {
    this.userStore.updateDisplayName(this.nameDraft());
    this.userStore.updatePreferences({
      theme: this.themeDraft(),
      fontSize: this.fontSizeDraft(),
      colorScheme: this.colorSchemeDraft(),
      cardFocusFullscreen: this.cardFocusFullscreenDraft(),
      learningProficiencyLevel: this.learningProficiencyDraft(),
    });
  }
}
