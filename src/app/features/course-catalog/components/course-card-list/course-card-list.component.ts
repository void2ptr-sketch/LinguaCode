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
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-course-catalog-courses',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
  ],
  standalone: true,
  templateUrl: './course-card-list.component.html',
  styleUrl: './course-card-list.component.scss',
})
export class CourseCatalogCoursesComponent {
  private readonly userStore = inject(UserStore);
  private readonly catalogStore = inject(CourseCatalogStore);

  // --- State from stores ---
  readonly displayName = this.userStore.displayName;
  readonly preferences = this.userStore.preferences;
  readonly languagePairs = this.userStore.languagePairs;
  readonly activeLanguagePairId = this.userStore.activeLanguagePairId;

  // Profile drafts from store
  readonly nameDraft = this.catalogStore.nameDraft;
  readonly learningProficiencyDraft = this.catalogStore.learningProficiencyDraft;
  readonly themeDraft = this.catalogStore.themeDraft;
  readonly fontSizeDraft = this.catalogStore.fontSizeDraft;
  readonly colorSchemeDraft = this.catalogStore.colorSchemeDraft;
  readonly cardFocusFullscreenDraft = this.catalogStore.cardFocusFullscreenDraft;

  // Course tab from store
  readonly knownLanguageDraft = this.catalogStore.knownLanguageDraft;
  readonly learningLanguageDraft = this.catalogStore.learningLanguageDraft;

  // Derived data
  readonly languages = contentLanguages();
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  // ---- Computed ----

  readonly languagePairInvalid = this.catalogStore.languagePairInvalid;

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
