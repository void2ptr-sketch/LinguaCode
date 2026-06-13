import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type {
  ContentLanguage,
  RomanizationSystem,
  UserLanguagePairEntry,
  UserPreferences,
} from '../../../models';
import { shouldShowPalladius } from '../../../data/phonetic-preferences.utils';
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
    MatSlideToggleModule,
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
  readonly languagePair = this.userStore.languagePair;
  readonly languages = contentLanguages();
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  readonly nameDraft = signal(this.displayName());
  readonly themeDraft = signal(this.preferences().theme);
  readonly fontSizeDraft = signal<UserPreferences['fontSize']>(this.preferences().fontSize);
  readonly knownLanguageDraft = signal<ContentLanguage>('ru');
  readonly learningLanguageDraft = signal<ContentLanguage>('en');
  readonly displayRomanizationDraft = signal<RomanizationSystem>(
    this.preferences().cjkLearning.displayRomanization,
  );
  readonly showIpaDraft = signal(this.preferences().phonetic.showIpa);
  readonly ipaVariantLabelDraft = signal(this.preferences().phonetic.ipaVariantLabel ?? '');

  readonly languagePairInvalid = computed(
    () => this.knownLanguageDraft() === this.learningLanguageDraft(),
  );

  readonly canRemovePair = computed(() => this.languagePairs().length > 1);

  readonly showCjkPreferences = computed(() => {
    const pair = this.languagePair();
    return shouldShowPalladius(pair.known, pair.learning);
  });

  readonly showPhoneticPreferences = computed(() => this.languagePair().learning === 'en');

  readonly romanizationOptions = computed((): readonly { value: RomanizationSystem; label: string }[] => {
    const options: { value: RomanizationSystem; label: string }[] = [
      { value: 'pinyin', label: 'Пиньинь' },
      { value: 'zhuyin', label: 'Жуинь (Bopomofo)' },
    ];

    if (this.showCjkPreferences()) {
      options.push({ value: 'palladius', label: 'Палладица' });
    }

    return options;
  });

  entryLabel(entry: UserLanguagePairEntry): string {
    return this.userStore.formatEntryLabel(entry);
  }

  isActive(entry: UserLanguagePairEntry): boolean {
    return this.userStore.isActiveEntry(entry);
  }

  setActive(id: string): void {
    this.userStore.setActiveLanguagePair(id);
    this.syncPreferenceDrafts();
  }

  removePair(id: string): void {
    this.userStore.removeLanguagePair(id);
    this.syncPreferenceDrafts();
  }

  addPair(): void {
    if (this.languagePairInvalid()) {
      return;
    }

    this.userStore.addLanguagePair({
      known: this.knownLanguageDraft(),
      learning: this.learningLanguageDraft(),
    });
    this.syncPreferenceDrafts();
  }

  saveProfile(): void {
    this.userStore.updateDisplayName(this.nameDraft());
    this.userStore.updatePreferences({
      theme: this.themeDraft(),
      fontSize: this.fontSizeDraft(),
      cjkLearning: {
        ...this.preferences().cjkLearning,
        displayRomanization: this.displayRomanizationDraft(),
      },
      phonetic: {
        ...this.preferences().phonetic,
        showIpa: this.showIpaDraft(),
        ipaVariantLabel: this.ipaVariantLabelDraft().trim() || undefined,
      },
    });
  }

  private syncPreferenceDrafts(): void {
    this.displayRomanizationDraft.set(this.preferences().cjkLearning.displayRomanization);
    this.showIpaDraft.set(this.preferences().phonetic.showIpa);
    this.ipaVariantLabelDraft.set(this.preferences().phonetic.ipaVariantLabel ?? '');
  }
}
