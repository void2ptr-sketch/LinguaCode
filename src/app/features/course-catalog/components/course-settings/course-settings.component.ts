import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';

import type { ToneColorSchemeId, RomanizationSystem, ToneMark, UserLanguagePairEntry } from '../../../../core/models';
import { TRACING_STROKE_DURATION_BOUNDS, TONE_COLOR_SCHEMES, ROMANIZATION_DISPLAY_ORDER } from '../../../../core/models';
import { CourseDisplaySettingsMatrixComponent } from '../../../../shared/ui/course-display-settings-matrix';
import type { AnswerDisplayMode } from '../../../../shared/ui/course-display-settings-matrix';
import { shouldShowPalladius } from '../../../../core/domain/phonetic/phonetic-preferences.utils';
import type { RomanizationOption } from '../../../../shared/ui/course-display-settings-matrix';
import { UserStore } from '../../../../core/state';
import { CourseCatalogStore } from '../../services/course-catalog.store';

/**
 * Course catalog settings component. Manages language pair settings including
 * romanization display, IPA, tone coloring, and tracing preferences.
 * @remarks Settings are scoped to the active language pair and persisted via `UserStore`.
 */
@Component({
  selector: 'app-course-catalog-settings',
  imports: [
    CourseDisplaySettingsMatrixComponent,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
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
  private readonly catalogStore = inject(CourseCatalogStore);

  /** Available language pairs from the store. */
  readonly languagePairs = this.userStore.languagePairs;
  /** Active language pair ID from the store. */
  readonly activeLanguagePairId = this.userStore.activeLanguagePairId;

  /** Draft display romanization systems. */
  readonly displayRomanizationsDraft = this.catalogStore.displayRomanizationsDraft;
  /** Draft answer romanization systems. */
  readonly answerRomanizationsDraft = this.catalogStore.answerRomanizationsDraft;
  /** Draft IPA display preference. */
  readonly showIpaDraft = this.catalogStore.showIpaDraft;
  /** Draft custom IPA variant label. */
  readonly ipaVariantLabelDraft = this.catalogStore.ipaVariantLabelDraft;
  /** Draft answer display modes. */
  readonly answerModesDraft = this.catalogStore.answerModesDraft;
  /** Draft tone color enabled preference. */
  readonly toneColorEnabledDraft = this.catalogStore.toneColorEnabledDraft;
  /** Draft tone color scheme preference. */
  readonly toneColorSchemeDraft = this.catalogStore.toneColorSchemeDraft;
  /** Draft tracing stroke duration preference. */
  readonly tracingStrokeDurationDraft = this.catalogStore.tracingStrokeDurationDraft;

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
   * Resolves the entry matching the active language pair ID, falling back to the first
   * available pair or `null` if none exist.
   */
  readonly settingsEntry = computed(() => {
    const id = this.activeLanguagePairId();
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

  // ---- Methods ----

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

  // ---- Settings change handlers ----

  /**
   * Handles changes to the display romanizations setting.
   *
   * @param romanizations - The updated display romanization systems.
   */
  onDisplayRomanizationsChange(romanizations: readonly RomanizationSystem[]): void {
    this.catalogStore.setDisplayRomanizationsDraft(romanizations);
  }

  /**
   * Handles changes to the answer romanizations setting.
   *
   * @param romanizations - The updated answer romanization systems.
   */
  onAnswerRomanizationsChange(romanizations: readonly RomanizationSystem[]): void {
    this.catalogStore.setAnswerRomanizationsDraft(romanizations);
  }

  /**
   * Handles changes to the show IPA setting.
   *
   * @param show - Whether IPA notation should be displayed.
   */
  onShowIpaChange(show: boolean): void {
    this.catalogStore.setShowIpaDraft(show);
  }

  /**
   * Handles changes to the IPA variant label.
   *
   * @param label - The custom IPA variant label.
   */
  onIpaVariantLabelChange(label: string): void {
    this.catalogStore.setIpaVariantLabelDraft(label);
  }

  /**
   * Handles changes to the answer display modes setting.
   *
   * @param modes - The updated answer display modes.
   */
  onAnswerModesChange(modes: readonly AnswerDisplayMode[]): void {
    this.catalogStore.setAnswerModesDraft(modes);
  }

  /**
   * Handles changes to the tone color enabled setting.
   *
   * @param enabled - Whether tone coloring is enabled.
   */
  onToneColorEnabledChange(enabled: boolean): void {
    this.catalogStore.setToneColorEnabledDraft(enabled);
  }

  /**
   * Handles changes to the tone color scheme setting.
   *
   * @param scheme - The selected tone color scheme ID.
   */
  onToneColorSchemeChange(scheme: ToneColorSchemeId): void {
    this.catalogStore.setToneColorSchemeDraft(scheme);
  }

  /**
   * Handles changes to the tracing stroke duration setting.
   *
   * @param duration - The tracing stroke duration in milliseconds.
   */
  onTracingStrokeDurationChange(duration: number): void {
    this.catalogStore.setTracingStrokeDurationDraft(duration);
  }
}
