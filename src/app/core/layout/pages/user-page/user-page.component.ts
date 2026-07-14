import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';
import type {
  AppColorScheme,
  CjkLearningPreferences,
  ContentLanguage,
  LearningProficiencyLevel,
  RomanizationSystem,
  UserLanguagePairEntry,
  UserLanguagePairSettings,
  UserPreferences,
} from '../../../models';
import type { ToneColorSchemeId } from '../../../models/tone-color.types';
import type { ToneMark } from '../../../models/phonetic-content.types';
import {
  resolveCjkLearningForPair,
  resolvePhoneticForPair,
} from '../../../data/user/user-language-pair.utils';
import { shouldShowPalladius } from '../../../data/phonetic/phonetic-preferences.utils';
import {
  ROMANIZATION_DISPLAY_ORDER,
  TRACING_STROKE_DURATION_BOUNDS,
} from '../../../models/phonetic-content.types';
import { TONE_COLOR_SCHEMES } from '../../../models/tone-color.types';
import { LEARNING_PROFICIENCY_LEVELS } from '../../../models/learning-proficiency.types';
import { UserStore } from '../../../state';
import {
  CONTENT_LANGUAGE_LABELS,
  contentLanguages,
} from '../../../data/language-pair/language-pair.utils';
import {
  CourseDisplaySettingsMatrixComponent,
  type RomanizationOption,
} from '../../../../shared/components/course-display-settings-matrix/course-display-settings-matrix.component';
import { type AnswerDisplayMode } from '../../../../shared/components/course-display-settings-matrix/course-display-settings-matrix.utils';

@Component({
  selector: 'app-user-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatSliderModule,
    CourseDisplaySettingsMatrixComponent,
  ],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.scss',
})
export class UserPageComponent implements OnInit {
  private readonly userStore = inject(UserStore);

  readonly displayName = this.userStore.displayName;
  readonly preferences = this.userStore.preferences;
  readonly languagePairs = this.userStore.languagePairs;
  readonly activeLanguagePairId = this.userStore.activeLanguagePairId;
  readonly languages = contentLanguages();
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  readonly nameDraft = signal(this.displayName());
  readonly learningProficiencyDraft = signal<LearningProficiencyLevel>(
    this.preferences().learningProficiencyLevel,
  );
  readonly learningProficiencyOptions = LEARNING_PROFICIENCY_LEVELS;
  readonly themeDraft = signal(this.preferences().theme);
  readonly fontSizeDraft = signal<UserPreferences['fontSize']>(this.preferences().fontSize);
  readonly colorSchemeDraft = signal<AppColorScheme>(this.preferences().colorScheme);
  readonly cardFocusFullscreenDraft = signal(this.preferences().cardFocusFullscreen);
  readonly knownLanguageDraft = signal<ContentLanguage>('ru');
  readonly learningLanguageDraft = signal<ContentLanguage>('en');
  readonly settingsPairIdDraft = signal(this.activeLanguagePairId());
  readonly displayRomanizationsDraft = signal<readonly RomanizationSystem[]>(['pinyin']);
  readonly answerRomanizationsDraft = signal<readonly RomanizationSystem[]>([
    'pinyin',
    'palladius',
  ]);
  readonly showIpaDraft = signal(false);
  readonly ipaVariantLabelDraft = signal('');
  readonly answerModesDraft = signal<readonly AnswerDisplayMode[]>(['orthography']);
  readonly toneColorEnabledDraft = signal(false);
  readonly toneColorSchemeDraft = signal<ToneColorSchemeId>('classic');
  readonly tracingStrokeDurationDraft = signal<number>(TRACING_STROKE_DURATION_BOUNDS.defaultSec);
  readonly tracingDurationMin = TRACING_STROKE_DURATION_BOUNDS.minSec;
  readonly tracingDurationMax = TRACING_STROKE_DURATION_BOUNDS.maxSec;
  readonly tracingDurationStep = TRACING_STROKE_DURATION_BOUNDS.stepSec;
  readonly toneColorSchemeOptions = TONE_COLOR_SCHEMES;
  readonly tonePreviewMarks: readonly ToneMark[] = [1, 2, 3, 4, 5];
  readonly selectedTabIndex = signal(0);

  private static readonly pairSettingsTabIndex = 2;

  constructor() {
    this.syncPairSettingsDrafts();
  }

  ngOnInit(): void {
    this.learningProficiencyDraft.set(this.preferences().learningProficiencyLevel);
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

  readonly settingsCourseLabel = computed(() => {
    const entry = this.settingsEntry();
    return entry ? this.entryLabel(entry) : '';
  });

  readonly showCjkPreferences = computed(() => {
    const entry = this.settingsEntry();
    return entry ? shouldShowPalladius(entry.pair.known, entry.pair.learning) : false;
  });

  readonly showPhoneticPreferences = computed(() => {
    const learning = this.settingsEntry()?.pair.learning;
    return learning === 'en' || learning === 'zh';
  });

  readonly showTracingSettings = computed(() => this.settingsEntry()?.pair.learning === 'zh');

  readonly showDisplaySettings = computed(
    () => this.showCjkPreferences() || this.showPhoneticPreferences(),
  );

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

  toneColorSchemeHint(): string {
    const scheme = this.toneColorSchemeOptions.find(
      (item) => item.id === this.toneColorSchemeDraft(),
    );
    return scheme?.description ?? '';
  }

  tonePreviewColor(tone: ToneMark): string {
    const scheme = this.toneColorSchemeOptions.find(
      (item) => item.id === this.toneColorSchemeDraft(),
    );
    return scheme?.colors[tone] ?? '#757575';
  }

  formatTracingDurationSec(value: number): string {
    return `${value.toFixed(1)} с`;
  }

  isActive(entry: UserLanguagePairEntry): boolean {
    return this.userStore.isActiveEntry(entry);
  }

  onSettingsPairChange(id: string): void {
    this.settingsPairIdDraft.set(id);
    this.syncPairSettingsDrafts();
  }

  openPairSettings(id: string): void {
    this.settingsPairIdDraft.set(id);
    this.syncPairSettingsDrafts();
    this.selectedTabIndex.set(UserPageComponent.pairSettingsTabIndex);
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
      colorScheme: this.colorSchemeDraft(),
      cardFocusFullscreen: this.cardFocusFullscreenDraft(),
      learningProficiencyLevel: this.learningProficiencyDraft(),
    });

    const entry = this.settingsEntry();
    if (!entry) {
      return;
    }

    const patch: Partial<UserLanguagePairSettings> = {};

    if (this.showCjkPreferences() || this.showTracingSettings()) {
      const cjkPatch: Partial<CjkLearningPreferences> = {};

      if (this.showCjkPreferences()) {
        cjkPatch.displayRomanizations = [...this.displayRomanizationsDraft()];
        cjkPatch.answerRomanization = [...this.answerRomanizationsDraft()];
        cjkPatch.showTones = this.toneColorEnabledDraft();
        cjkPatch.toneColorScheme = this.toneColorSchemeDraft();
      }

      if (this.showTracingSettings()) {
        cjkPatch.tracingStrokeDurationSec = this.tracingStrokeDurationDraft();
      }

      patch.cjkLearning = cjkPatch as CjkLearningPreferences;
    }

    if (this.showPhoneticPreferences()) {
      const phonetic = resolvePhoneticForPair(entry);
      patch.phonetic = {
        showIpa: this.showIpaDraft(),
        ipaVariantLabel: this.ipaVariantLabelDraft().trim() || undefined,
        answerModes: [...this.answerModesDraft()],
        displayOrthography: phonetic.displayOrthography,
      };
    }

    if (patch.cjkLearning || patch.phonetic) {
      this.userStore.updateLanguagePairSettings(entry.id, patch);
      this.syncPairSettingsDrafts();
    }
  }

  private syncPairSettingsDrafts(): void {
    const entry = this.settingsEntry();
    const cjk = resolveCjkLearningForPair(entry);
    const phonetic = resolvePhoneticForPair(entry);

    this.displayRomanizationsDraft.set([...cjk.displayRomanizations]);
    this.answerRomanizationsDraft.set([...cjk.answerRomanization]);
    this.toneColorEnabledDraft.set(cjk.showTones);
    this.toneColorSchemeDraft.set(cjk.toneColorScheme);
    this.tracingStrokeDurationDraft.set(cjk.tracingStrokeDurationSec);
    this.showIpaDraft.set(phonetic.showIpa);
    this.ipaVariantLabelDraft.set(phonetic.ipaVariantLabel ?? '');
    this.answerModesDraft.set([...phonetic.answerModes]);
  }
}
