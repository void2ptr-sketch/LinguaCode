import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { ContentLanguage, UserLanguagePairEntry, UserPreferences } from '../../../models';
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
    MatIconModule,
  ],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.scss',
})
export class UserPageComponent {
  private readonly userStore = inject(UserStore);

  readonly displayName = this.userStore.displayName;
  readonly preferences = this.userStore.preferences;
  readonly languagePairs = this.userStore.languagePairs;
  readonly activeLanguagePairId = this.userStore.activeLanguagePairId;
  readonly languages = contentLanguages();
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  readonly nameDraft = signal(this.displayName());
  readonly themeDraft = signal(this.preferences().theme);
  readonly fontSizeDraft = signal<UserPreferences['fontSize']>(this.preferences().fontSize);
  readonly knownLanguageDraft = signal<ContentLanguage>('ru');
  readonly learningLanguageDraft = signal<ContentLanguage>('en');

  readonly languagePairInvalid = computed(
    () => this.knownLanguageDraft() === this.learningLanguageDraft(),
  );

  readonly canRemovePair = computed(() => this.languagePairs().length > 1);

  entryLabel(entry: UserLanguagePairEntry): string {
    return this.userStore.formatEntryLabel(entry);
  }

  isActive(entry: UserLanguagePairEntry): boolean {
    return this.userStore.isActiveEntry(entry);
  }

  setActive(id: string): void {
    this.userStore.setActiveLanguagePair(id);
  }

  removePair(id: string): void {
    this.userStore.removeLanguagePair(id);
  }

  addPair(): void {
    if (this.languagePairInvalid()) {
      return;
    }

    this.userStore.addLanguagePair({
      known: this.knownLanguageDraft(),
      learning: this.learningLanguageDraft(),
    });
  }

  saveProfile(): void {
    this.userStore.updateDisplayName(this.nameDraft());
    this.userStore.updatePreferences({
      theme: this.themeDraft(),
      fontSize: this.fontSizeDraft(),
    });
  }
}
