import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { ContentLanguage, UserPreferences } from '../../../models';
import { UserStore } from '../../../state';
import { CONTENT_LANGUAGE_LABELS, contentLanguages } from '../../../data/language-pair.utils';

@Component({
  selector: 'app-user-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.scss',
})
export class UserPageComponent {
  private readonly userStore = inject(UserStore);

  readonly displayName = this.userStore.displayName;
  readonly preferences = this.userStore.preferences;
  readonly languages = contentLanguages();
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  readonly nameDraft = signal(this.displayName());
  readonly themeDraft = signal(this.preferences().theme);
  readonly fontSizeDraft = signal<UserPreferences['fontSize']>(this.preferences().fontSize);
  readonly knownLanguageDraft = signal<ContentLanguage>(this.preferences().languagePair.known);
  readonly learningLanguageDraft = signal<ContentLanguage>(this.preferences().languagePair.learning);

  readonly languagePairInvalid = computed(
    () => this.knownLanguageDraft() === this.learningLanguageDraft(),
  );

  saveProfile(): void {
    if (this.languagePairInvalid()) {
      return;
    }

    this.userStore.updateDisplayName(this.nameDraft());
    this.userStore.updatePreferences({
      theme: this.themeDraft(),
      fontSize: this.fontSizeDraft(),
      languagePair: {
        known: this.knownLanguageDraft(),
        learning: this.learningLanguageDraft(),
      },
    });
  }
}
