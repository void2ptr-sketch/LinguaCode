import {
  Component,
  computed,
  input,
  output,
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
import type { RomanizationOption } from '../../../../shared/components/course-display-settings-matrix/course-display-settings-matrix.component';
import {
  CourseDisplaySettingsMatrixComponent,
} from '../../../../shared/components/course-display-settings-matrix/course-display-settings-matrix.component';
import type { AnswerDisplayMode } from '../../../../shared/components/course-display-settings-matrix/course-display-settings-matrix.utils';

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
  // Inputs (read-only)
  readonly languagePairs = input.required<readonly UserLanguagePairEntry[]>();
  readonly activeLanguagePairId = input.required<string>();

  // Settings inputs
  readonly displayRomanizationsDraft = input.required<readonly RomanizationSystem[]>();
  readonly answerRomanizationsDraft = input.required<readonly RomanizationSystem[]>();
  readonly showIpaDraft = input.required<boolean>();
  readonly ipaVariantLabelDraft = input.required<string>();
  readonly answerModesDraft = input.required<readonly AnswerDisplayMode[]>();
  readonly toneColorEnabledDraft = input.required<boolean>();
  readonly toneColorSchemeDraft = input.required<ToneColorSchemeId>();
  readonly tracingStrokeDurationDraft = input.required<number>();
  readonly romanizationOptions = input.required<readonly RomanizationOption[]>();
  readonly showCjkPreferences = input.required<boolean>();
  readonly showPhoneticPreferences = input.required<boolean>();
  readonly showTracingSettings = input.required<boolean>();

  // Outputs
  readonly displayRomanizationsChange = output<readonly RomanizationSystem[]>();
  readonly answerRomanizationsChange = output<readonly RomanizationSystem[]>();
  readonly showIpaChange = output<boolean>();
  readonly ipaVariantLabelChange = output<string>();
  readonly answerModesChange = output<readonly AnswerDisplayMode[]>();
  readonly toneColorEnabledChange = output<boolean>();
  readonly toneColorSchemeChange = output<ToneColorSchemeId>();
  readonly tracingStrokeDurationChange = output<number>();

  // Constants
  readonly toneColorSchemeOptions = TONE_COLOR_SCHEMES;
  readonly tonePreviewMarks: readonly ToneMark[] = [1, 2, 3, 4, 5];
  readonly tracingDurationMin = TRACING_STROKE_DURATION_BOUNDS.minSec;
  readonly tracingDurationMax = TRACING_STROKE_DURATION_BOUNDS.maxSec;
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

  readonly showDisplaySettings = computed(
    () => this.showCjkPreferences() || this.showPhoneticPreferences(),
  );

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
}
