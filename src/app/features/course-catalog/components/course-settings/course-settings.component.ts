import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';

import type {
  ToneColorSchemeId,
  RomanizationSystem,
  ToneMark,
} from '../../../../entities/phonetic/model';
import type { ContentLanguage } from '../../../../entities/card/model';
import type { UserLanguagePairEntry } from '../../../../entities/user/model';
import {
  TRACING_STROKE_DURATION_BOUNDS,
  TONE_COLOR_SCHEMES,
  ROMANIZATION_DISPLAY_ORDER,
} from '../../../../entities/phonetic/model';
import { CourseDisplaySettingsMatrixComponent } from '../../../../entities/course/ui/course-display-settings-matrix';
import type { AnswerDisplayMode } from '../../../../entities/course/ui/course-display-settings-matrix';
import { shouldShowPalladius } from '../../../../entities/phonetic/lib/phonetic-preferences.utils';
import type { RomanizationOption } from '../../../../entities/course/ui/course-display-settings-matrix';
import { UserStore } from '../../../../entities/user/model/user.store';
import { UserApiService } from '../../../../entities/user/api/user-api.service';
import type { UpdateUserPayload } from '../../../../entities/user/repository/user.port';
import { LanguageService } from '../../../../entities/language-pair/lib/language.service';
import { DraftsStore } from '../../services';
import { CourseCatalogLanguagePairManagerService } from '../../services/course-catalog-language-pair-manager.service';

/**
 * Course catalog settings component. Manages language pair settings including
 * romanization display, IPA, tone coloring, and tracing preferences.
 * @remarks Settings are scoped to the active language pair and persisted via `UserStore`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-course-catalog-settings',
  imports: [
    CourseDisplaySettingsMatrixComponent,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
  ],
  standalone: true,
  templateUrl: './course-settings.component.html',
  styleUrl: './course-settings.component.scss',
})
export class CourseCatalogSettingsComponent {
  private readonly userStore = inject(UserStore);
  private readonly drafts = inject(DraftsStore);
  private readonly pairManager = inject(CourseCatalogLanguagePairManagerService);
  private readonly userApi = inject(UserApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly languageService = inject(LanguageService);

  /** Available language pairs from the store. */
  readonly languagePairs = this.userStore.languagePairs;
  /** Active language pair ID from the store. */
  readonly activeLanguagePairId = this.userStore.activeLanguagePairId;

  /** Draft value for the known (source) language. */
  readonly knownLanguageDraft = this.drafts.courseTabKnownLanguageDraft;
  /** Draft value for the learning (target) language. */
  readonly learningLanguageDraft = this.drafts.courseTabLearningLanguageDraft;

  /** Available content languages. */
  readonly languages = () => this.languageService.getCodes();
  /** Labels for content languages. */
  readonly languageLabels = () => this.languageService.getLabels();

  /** Whether the current language pair draft is invalid. */
  readonly languagePairInvalid = this.drafts.courseTabLanguagePairInvalid;

  /** Draft display romanization systems. */
  readonly displayRomanizationsDraft = this.drafts.settingsDisplayRomanizationsDraft;
  /** Draft answer romanization systems. */
  readonly answerRomanizationsDraft = this.drafts.settingsAnswerRomanizationsDraft;
  /** Draft IPA display preference. */
  readonly showIpaDraft = this.drafts.settingsShowIpaDraft;
  /** Draft custom IPA variant label. */
  readonly ipaVariantLabelDraft = this.drafts.settingsIpaVariantLabelDraft;
  /** Draft answer display modes. */
  readonly answerModesDraft = this.drafts.settingsAnswerModesDraft;
  /** Draft tone color enabled preference. */
  readonly toneColorEnabledDraft = this.drafts.settingsToneColorEnabledDraft;
  /** Draft tone color scheme preference. */
  readonly toneColorSchemeDraft = this.drafts.settingsToneColorSchemeDraft;
  /** Draft tracing stroke duration preference. */
  readonly tracingStrokeDurationDraft = this.drafts.settingsTracingStrokeDurationDraft;

  /** Available tone color scheme options. */
  readonly toneColorSchemeOptions = TONE_COLOR_SCHEMES;
  /** Tone marks for preview display. */
  readonly tonePreviewMarks: readonly ToneMark[] = [1, 2, 3, 4, 5];
  /** Minimum tracing stroke duration in seconds. */
  readonly tracingDurationMin = TRACING_STROKE_DURATION_BOUNDS.minSec;
  /** Maximum tracing stroke duration in seconds. */
  readonly tracingDurationMax = TRACING_STROKE_DURATION_BOUNDS.maxSec;
  /** Tracing stroke duration step in seconds. */
  readonly tracingDurationStep = TRACING_STROKE_DURATION_BOUNDS.stepSec;

  // ---- Computed ----

  /**
   * The settings language pair entry.
   *
   * @remarks
   * Resolves the entry matching the settings pair ID draft, falling back to the first
   * available pair or `null` if none exist.
   */
  readonly settingsEntry = computed(() => {
    const id = this.drafts.settingsPairIdDraft();
    const pairs = this.languagePairs();
    return pairs.find((entry) => entry.id === id) ?? pairs[0] ?? null;
  });

  /**
   * Label for the settings course entry (known → learning).
   *
   * @remarks
   * Derived from `settingsEntry` via `entryLabel`. Returns an empty string when
   * no settings entry is available.
   */
  readonly settingsCourseLabel = computed(() => {
    const entry = this.settingsEntry();
    return entry ? this.entryLabel(entry) : '';
  });

  /**
   * Whether CJK-specific preferences (romanization, tone coloring) should be shown.
   *
   * @remarks
   * Returns `true` when the known language supports Palladius romanization
   * (e.g., Russian) and the learning language is CJK (e.g., Chinese).
   */
  readonly showCjkPreferences = computed(() => {
    const entry = this.settingsEntry();
    return entry ? shouldShowPalladius(entry.pair.known, entry.pair.learning) : false;
  });

  /** Whether phonetic preferences (IPA, answer modes) should be shown. */
  readonly showPhoneticPreferences = computed(() => {
    const learning = this.settingsEntry()?.pair.learning;
    return learning === 'en' || learning === 'zh';
  });

  /**
   * Whether tracing stroke duration settings should be shown.
   *
   * @remarks
   * Returns `true` only when the learning language is Chinese ('zh').
   */
  readonly showTracingSettings = computed(() => this.settingsEntry()?.pair.learning === 'zh');

  /**
   * Whether any display settings should be shown.
   *
   * @remarks
   * Returns `true` when either CJK preferences or phonetic preferences are visible.
   * Used to conditionally render the `CourseDisplaySettingsMatrixComponent`.
   */
  readonly showDisplaySettings = computed(
    () => this.showCjkPreferences() || this.showPhoneticPreferences(),
  );

  /**
   * Available romanization options for display and answer settings.
   *
   * @remarks
   * Always includes Pinyin and Zhuyin. Palladius is added when `showCjkPreferences` is `true`.
   * Options are ordered by `ROMANIZATION_DISPLAY_ORDER`.
   */
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
      this.drafts.setSettingsPairIdDraft(this.activeLanguagePairId());
    }
  }

  /**
   * Updates the known language draft.
   *
   * @param lang - The selected known content language.
   */
  onChangeKnownLanguage(lang: ContentLanguage): void {
    this.drafts.setCourseTabKnownLanguageDraft(lang);
  }

  /**
   * Updates the learning language draft.
   *
   * @param lang - The selected learning content language.
   */
  onChangeLearningLanguage(lang: ContentLanguage): void {
    this.drafts.setCourseTabLearningLanguageDraft(lang);
  }

  /**
   * Sets the active language pair and updates the settings target.
   *
   * @param id - The ID of the language pair to activate.
   */
  onSetActive(id: string): void {
    this.pairManager.setActive(id);
  }

  /**
   * Removes a language pair and updates the settings target if needed.
   *
   * @param id - The ID of the language pair to remove.
   */
  onRemovePair(id: string): void {
    const wasSettingsTarget = this.drafts.settingsPairIdDraft() === id;
    this.userStore.removeLanguagePair(id);

    if (wasSettingsTarget) {
      this.drafts.setSettingsPairIdDraft(this.activeLanguagePairId());
    }
  }

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
   * Returns a human-readable hint for the current tone color scheme.
   *
   * @returns The description of the currently selected tone color scheme, or an empty string.
   */
  toneColorSchemeHint(): string {
    const scheme = this.toneColorSchemeOptions.find(
      (item) => item.id === this.toneColorSchemeDraft(),
    );
    return scheme?.description ?? '';
  }

  /**
   * Returns the color for a given tone mark under the current scheme.
   *
   * @param tone - The tone mark (1-5).
   * @returns The hex color string for the tone, or a gray placeholder if not found.
   */
  tonePreviewColor(tone: ToneMark): string {
    const scheme = this.toneColorSchemeOptions.find(
      (item) => item.id === this.toneColorSchemeDraft(),
    );
    return scheme?.colors[tone] ?? '#757575';
  }

  /**
   * Formats a tracing duration value in seconds with one decimal place.
   *
   * @param value - The duration in seconds.
   * @returns A formatted string with one decimal place and a Cyrillic 'с' suffix.
   */
  formatTracingDurationSec(value: number): string {
    return `${value.toFixed(1)} с`;
  }

  /**
   * Handles language pair selection changes from the combo-box.
   *
   * @param pairId - The ID of the selected language pair.
   */
  onSettingsPairChange(pairId: string): void {
    this.drafts.setSettingsPairIdDraft(pairId);
    this.pairManager.syncPairSettingsDrafts();
  }

  /**
   * Saves the current settings to the store and persists to the backend.
   */
  async saveSettings(): Promise<void> {
    const entry = this.settingsEntry();
    if (!entry) {
      return;
    }

    // Save to local store (updates localStorage)
    this.pairManager.savePairSettings(entry);

    // Persist to backend (PUT /users/me with full preferences)
    try {
      const payload: UpdateUserPayload = {
        preferences: {
          learningPairs: this.languagePairs().map((p) => ({
            known: p.pair.known,
            learning: p.pair.learning,
            settings: p.settings,
          })),
        },
      };
      await this.userApi.updateMe(payload);
      this.snackBar.open('Настройки сохранены', 'Закрыть', { duration: 3000 });
    } catch {
      this.snackBar.open('Не удалось сохранить настройки', 'Закрыть', { duration: 5000 });
    }
  }

  // ---- Settings change handlers ----

  /**
   * Handles changes to the display romanizations setting.
   *
   * @param romanizations - The updated display romanization systems.
   */
  onDisplayRomanizationsChange(romanizations: readonly RomanizationSystem[]): void {
    this.drafts.setSettingsDisplayRomanizationsDraft(romanizations);
  }

  /**
   * Handles changes to the answer romanizations setting.
   *
   * @param romanizations - The updated answer romanization systems.
   */
  onAnswerRomanizationsChange(romanizations: readonly RomanizationSystem[]): void {
    this.drafts.setSettingsAnswerRomanizationsDraft(romanizations);
  }

  /**
   * Handles changes to the show IPA setting.
   *
   * @param show - Whether IPA notation should be displayed.
   */
  onShowIpaChange(show: boolean): void {
    this.drafts.setSettingsShowIpaDraft(show);
  }

  /**
   * Handles changes to the IPA variant label.
   *
   * @param label - The custom IPA variant label.
   */
  onIpaVariantLabelChange(label: string): void {
    this.drafts.setSettingsIpaVariantLabelDraft(label);
  }

  /**
   * Handles changes to the answer display modes setting.
   *
   * @param modes - The updated answer display modes.
   */
  onAnswerModesChange(modes: readonly AnswerDisplayMode[]): void {
    this.drafts.setSettingsAnswerModesDraft(modes);
  }

  /**
   * Handles changes to the tone color enabled setting.
   *
   * @param enabled - Whether tone coloring is enabled.
   */
  onToneColorEnabledChange(enabled: boolean): void {
    this.drafts.setSettingsToneColorEnabledDraft(enabled);
  }

  /**
   * Handles changes to the tone color scheme setting.
   *
   * @param scheme - The selected tone color scheme ID.
   */
  onToneColorSchemeChange(scheme: ToneColorSchemeId): void {
    this.drafts.setSettingsToneColorSchemeDraft(scheme);
  }

  /**
   * Handles changes to the tracing stroke duration setting.
   *
   * @param duration - The tracing stroke duration in milliseconds.
   */
  onTracingStrokeDurationChange(duration: number): void {
    this.drafts.setSettingsTracingStrokeDurationDraft(duration);
  }
}
