import {
  Component,
  computed,
  input,
  model,
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
  readonly languagePairs = input.required<UserLanguagePairEntry[]>();
  readonly activeLanguagePairId = input.required<string>();

  // Two-way bindings (model)
  readonly nameDraft = model.required<string>();
  readonly learningProficiencyDraft = model.required<LearningProficiencyLevel>();
  readonly themeDraft = model.required<AppColorScheme>();
  readonly fontSizeDraft = model.required<UserPreferences['fontSize']>();
  readonly colorSchemeDraft = model.required<AppColorScheme>();
  readonly cardFocusFullscreenDraft = model.required<boolean>();

  // Course tab inputs (two-way)
  readonly knownLanguageDraft = model.required<ContentLanguage>();
  readonly learningLanguageDraft = model.required<ContentLanguage>();

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
