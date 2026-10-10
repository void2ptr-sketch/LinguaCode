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
} from '../../../../core/data/language-pair/language-pair.utils';
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

  /** Whether there is more than one language pair (enables removal). */
  readonly canRemovePair = computed(() => this.languagePairs().length > 1);

  // ---- Methods ----

  entryLabel(entry: UserLanguagePairEntry): string {
    return `${entry.pair.known} → ${entry.pair.learning}`;
  }

  isActive(entry: UserLanguagePairEntry): boolean {
    return entry.id === this.activeLanguagePairId();
  }

  onAddPair(): void {
    if (!this.languagePairInvalid()) {
      this.userStore.addLanguagePair({
        known: this.knownLanguageDraft(),
        learning: this.learningLanguageDraft(),
      });
      this.catalogStore.setSettingsPairIdDraft(this.activeLanguagePairId());
    }
  }

  onChangeKnownLanguage(lang: ContentLanguage): void {
    this.catalogStore.setKnownLanguageDraft(lang);
  }

  onChangeLearningLanguage(lang: ContentLanguage): void {
    this.catalogStore.setLearningLanguageDraft(lang);
  }

  /**
   * Sets the active language pair and updates the settings target.
   *
   * @param id - The ID of the language pair to activate.
   */
  onSetActive(id: string): void {
    this.userStore.setActiveLanguagePair(id);
    this.catalogStore.setSettingsPairIdDraft(id);
  }

  onRemovePair(id: string): void {
    const wasSettingsTarget = this.catalogStore.settingsPairIdDraft() === id;
    this.userStore.removeLanguagePair(id);

    if (wasSettingsTarget) {
      this.catalogStore.setSettingsPairIdDraft(this.activeLanguagePairId());
    }
  }

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
