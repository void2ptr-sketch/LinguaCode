import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import type {
  ContentLanguage,
  RomanizationSystem,
  UserLanguagePairEntry,
  UserLanguagePairSettings,
  UserPreferences,
} from '../../../models';
import {
  resolveCjkLearningForPair,
  resolvePhoneticForPair,
} from '../../../data/user-language-pair.utils';
import { shouldShowPalladius } from '../../../data/phonetic-preferences.utils';
import { ROMANIZATION_DISPLAY_ORDER } from '../../../models/phonetic-content.types';
import { UserStore } from '../../../state';
import { CONTENT_LANGUAGE_LABELS, contentLanguages } from '../../../data/language-pair.utils';

type RomanizationOption = {
  value: RomanizationSystem;
  label: string;
};

@Component({
  selector: 'app-user-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTabsModule,
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
  readonly settingsPairIdDraft = signal(this.activeLanguagePairId());
  readonly displayRomanizationsDraft = signal<readonly RomanizationSystem[]>(['pinyin']);
  readonly showIpaDraft = signal(false);
  readonly ipaVariantLabelDraft = signal('');

  constructor() {
    this.syncPairSettingsDrafts();
  }

  readonly languagePairInvalid = computed(
    () => this.knownLanguageDraft() === this.learningLanguageDraft(),
  );

  readonly canRemovePair = computed(() => this.languagePairs().length > 1);

  readonly settingsEntry = computed(() => {
    const id = this.settingsPairIdDraft();
    return this.languagePairs().find((entry) => entry.id === id) ?? this.languagePairs()[0] ?? null;
  });

  readonly showCjkPreferences = computed(() => {
    const entry = this.settingsEntry();
    return entry ? shouldShowPalladius(entry.pair.known, entry.pair.learning) : false;
  });

  readonly showPhoneticPreferences = computed(() => {
    const learning = this.settingsEntry()?.pair.learning;
    return learning === 'en' || learning === 'zh';
  });

  readonly romanizationOptions = computed((): readonly RomanizationOption[] => {
    const options: RomanizationOption[] = [
      { value: 'pinyin', label: 'Пиньинь' },
      { value: 'zhuyin', label: 'Жуинь (Bopomofo)' },
    ];

    if (this.showCjkPreferences()) {
      options.push({ value: 'palladius', label: 'Палладица' });
    }

    return ROMANIZATION_DISPLAY_ORDER.flatMap((system) => {
      const option = options.find((item) => item.value === system);
      return option ? [option] : [];
    });
  });

  entryLabel(entry: UserLanguagePairEntry): string {
    return this.userStore.formatEntryLabel(entry);
  }

  isActive(entry: UserLanguagePairEntry): boolean {
    return this.userStore.isActiveEntry(entry);
  }

  isSettingsTarget(entry: UserLanguagePairEntry): boolean {
    return entry.id === this.settingsPairIdDraft();
  }

  isRomanizationEnabled(system: RomanizationSystem): boolean {
    return this.displayRomanizationsDraft().includes(system);
  }

  setRomanizationEnabled(system: RomanizationSystem, enabled: boolean): void {
    const current = this.displayRomanizationsDraft();
    const next = enabled
      ? ROMANIZATION_DISPLAY_ORDER.filter((item) => current.includes(item) || item === system)
      : current.filter((item) => item !== system);

    this.displayRomanizationsDraft.set(next.length > 0 ? next : ['pinyin']);
  }

  selectPairForSettings(id: string): void {
    this.settingsPairIdDraft.set(id);
    this.syncPairSettingsDrafts();
  }

  setActive(id: string): void {
    this.userStore.setActiveLanguagePair(id);
    this.settingsPairIdDraft.set(id);
    this.syncPairSettingsDrafts();
  }

  removePair(id: string): void {
    const wasSettingsTarget = this.settingsPairIdDraft() === id;
    this.userStore.removeLanguagePair(id);

    if (wasSettingsTarget) {
      this.settingsPairIdDraft.set(this.activeLanguagePairId());
    }

    this.syncPairSettingsDrafts();
  }

  addPair(): void {
    if (this.languagePairInvalid()) {
      return;
    }

    this.userStore.addLanguagePair({
      known: this.knownLanguageDraft(),
      learning: this.learningLanguageDraft(),
    });
    this.settingsPairIdDraft.set(this.activeLanguagePairId());
    this.syncPairSettingsDrafts();
  }

  saveProfile(): void {
    this.userStore.updateDisplayName(this.nameDraft());
    this.userStore.updatePreferences({
      theme: this.themeDraft(),
      fontSize: this.fontSizeDraft(),
    });

    const entry = this.settingsEntry();
    if (!entry) {
      return;
    }

    const patch: Partial<UserLanguagePairSettings> = {};

    if (this.showCjkPreferences()) {
      patch.cjkLearning = {
        ...resolveCjkLearningForPair(entry),
        displayRomanizations: [...this.displayRomanizationsDraft()],
      };
    }

    if (this.showPhoneticPreferences()) {
      patch.phonetic = {
        ...resolvePhoneticForPair(entry),
        showIpa: this.showIpaDraft(),
        ipaVariantLabel: this.ipaVariantLabelDraft().trim() || undefined,
      };
    }

    if (patch.cjkLearning || patch.phonetic) {
      this.userStore.updateLanguagePairSettings(entry.id, patch);
    }
  }

  private syncPairSettingsDrafts(): void {
    const entry = this.settingsEntry();
    const cjk = resolveCjkLearningForPair(entry);
    const phonetic = resolvePhoneticForPair(entry);

    this.displayRomanizationsDraft.set([...cjk.displayRomanizations]);
    this.showIpaDraft.set(phonetic.showIpa);
    this.ipaVariantLabelDraft.set(phonetic.ipaVariantLabel ?? '');
  }
}
