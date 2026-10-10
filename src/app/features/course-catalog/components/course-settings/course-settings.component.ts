import {
  Component,
  computed,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';

import type { ToneColorSchemeId } from '../../../../core/models/tone-color.types';
import type { RomanizationSystem, ToneMark } from '../../../../core/models/phonetic-content.types';
import { TRACING_STROKE_DURATION_BOUNDS } from '../../../../core/models/phonetic-content.types';
import { TONE_COLOR_SCHEMES } from '../../../../core/models/tone-color.types';
import type { UserLanguagePairEntry } from '../../../../core/models/user-language-pair.types';
import {
  CourseDisplaySettingsMatrixComponent,
} from '../../../../shared/ui/course-display-settings-matrix';
import type { AnswerDisplayMode } from '../../../../shared/ui/course-display-settings-matrix';
import { shouldShowPalladius } from '../../../../core/data/phonetic/phonetic-preferences.utils';
import {
  ROMANIZATION_DISPLAY_ORDER,
} from '../../../../core/models/phonetic-content.types';
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

  readonly settingsEntry = computed(() => {
    const id = this.activeLanguagePairId();
    const pairs = this.languagePairs();
    return pairs.find((entry) => entry.id === id) ?? pairs[0] ?? null;
  });

  readonly settingsCourseLabel = computed(() => {
    const entry = this.settingsEntry();
    return entry ? this.entryLabel(entry) : '';
  });

  readonly showCjkPreferences = computed(() => {
    const entry = this.settingsEntry();
    return entry ? shouldShowPalladius(entry.pair.known, entry.pair.learning) : false;
  });

  /** Whether phonetic preferences (IPA, answer modes) should be shown. */
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

  // ---- Methods ----

  entryLabel(entry: UserLanguagePairEntry): string {
    return `${entry.pair.known} → ${entry.pair.learning}`;
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

  // ---- Settings change handlers ----

  onDisplayRomanizationsChange(romanizations: readonly RomanizationSystem[]): void {
    this.catalogStore.setDisplayRomanizationsDraft(romanizations);
  }

  onAnswerRomanizationsChange(romanizations: readonly RomanizationSystem[]): void {
    this.catalogStore.setAnswerRomanizationsDraft(romanizations);
  }

  onShowIpaChange(show: boolean): void {
    this.catalogStore.setShowIpaDraft(show);
  }

  onIpaVariantLabelChange(label: string): void {
    this.catalogStore.setIpaVariantLabelDraft(label);
  }

  onAnswerModesChange(modes: readonly AnswerDisplayMode[]): void {
    this.catalogStore.setAnswerModesDraft(modes);
  }

  onToneColorEnabledChange(enabled: boolean): void {
    this.catalogStore.setToneColorEnabledDraft(enabled);
  }

  onToneColorSchemeChange(scheme: ToneColorSchemeId): void {
    this.catalogStore.setToneColorSchemeDraft(scheme);
  }

  onTracingStrokeDurationChange(duration: number): void {
    this.catalogStore.setTracingStrokeDurationDraft(duration);
  }
}
