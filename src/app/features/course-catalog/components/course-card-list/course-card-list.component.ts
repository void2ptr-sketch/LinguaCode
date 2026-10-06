import {
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import type {
  AppColorScheme,
  ContentLanguage,
  LearningProficiencyLevel,
  UserLanguagePairEntry,
  UserPreferences,
} from '../../../../core/models';
import {
  CONTENT_LANGUAGE_LABELS,
  contentLanguages,
} from '../../../../core/data/language-pair/language-pair.utils';

export type RomanizationOption = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-course-catalog-courses',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  standalone: true,
  templateUrl: './course-card-list.component.html',
  styleUrl: './course-card-list.component.scss',
})
export class CourseCatalogCoursesComponent {
  // Inputs (read-only)
  readonly displayName = input.required<string>();
  readonly preferences = input.required<UserPreferences>();
  readonly languagePairs = input.required<readonly UserLanguagePairEntry[]>();
  readonly activeLanguagePairId = input.required<string>();

  // Profile draft inputs
  readonly nameDraft = input.required<string>();
  readonly learningProficiencyDraft = input.required<LearningProficiencyLevel>();
  readonly themeDraft = input.required<AppColorScheme>();
  readonly fontSizeDraft = input.required<UserPreferences['fontSize']>();
  readonly colorSchemeDraft = input.required<AppColorScheme>();
  readonly cardFocusFullscreenDraft = input.required<boolean>();

  // Course tab inputs
  readonly knownLanguageDraft = input.required<ContentLanguage>();
  readonly learningLanguageDraft = input.required<ContentLanguage>();

  // Outputs for two-way binding
  readonly knownLanguageChange = output<ContentLanguage>();
  readonly learningLanguageChange = output<ContentLanguage>();

  // Outputs
  readonly addPair = output<void>();
  readonly setActive = output<string>();
  readonly removePair = output<string>();

  // Derived data
  readonly languages = contentLanguages();
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  // ---- Computed ----

  readonly languagePairInvalid = computed(
    () => this.knownLanguageDraft() === this.learningLanguageDraft(),
  );

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
      this.addPair.emit();
    }
  }
}
