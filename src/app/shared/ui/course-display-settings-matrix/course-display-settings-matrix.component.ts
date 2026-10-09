import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { RomanizationSystem } from '../../../core/models/phonetic-content.types';
import {
  type AnswerDisplayMode,
  toggleAnswerModes,
  toggleRomanizations,
} from './course-display-settings-matrix.util';

export type RomanizationOption = {
  value: RomanizationSystem;
  label: string;
};

/**
 * Course display settings matrix component. Provides a checkbox matrix for configuring
 * romanization display and answer modes for CJK and phonetic content.
 * @remarks Supports prompt and answer romanization toggles, IPA display, and custom IPA labels.
 */
@Component({
  selector: 'app-course-display-settings-matrix',
  imports: [FormsModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './course-display-settings-matrix.component.html',
  styleUrl: './course-display-settings-matrix.component.scss',
})
export class CourseDisplaySettingsMatrixComponent {
  /** Whether to show CJK-specific settings (Palladius, tone colors). */
  readonly showCjk = input(false);
  /** Whether to show phonetic settings (IPA, answer modes). */
  readonly showPhonetic = input(false);
  /** Available romanization system options. */
  readonly romanizationOptions = input<readonly RomanizationOption[]>([]);
  /** Optional course label for aria labels. */
  readonly courseLabel = input('');

  /** Currently enabled display romanization systems. */
  readonly displayRomanizations = input<readonly RomanizationSystem[]>([]);
  /** Currently enabled answer romanization systems. */
  readonly answerRomanizations = input<readonly RomanizationSystem[]>([]);
  /** Whether IPA is enabled for display. */
  readonly showIpa = input(false);
  /** Custom IPA variant label. */
  readonly ipaVariantLabel = input('');
  /** Currently enabled answer display modes. */
  readonly answerModes = input<readonly AnswerDisplayMode[]>([]);

  /** Emits updated display romanization systems. */
  readonly displayRomanizationsChange = output<readonly RomanizationSystem[]>();
  /** Emits updated answer romanization systems. */
  readonly answerRomanizationsChange = output<readonly RomanizationSystem[]>();
  /** Emits the updated IPA display preference. */
  readonly showIpaChange = output<boolean>();
  /** Emits the updated custom IPA variant label. */
  readonly ipaVariantLabelChange = output<string>();
  /** Emits updated answer display modes. */
  readonly answerModesChange = output<readonly AnswerDisplayMode[]>();

  /** Whether the IPA variant text field should be visible. */
  readonly showIpaVariantField = computed(
    () => this.showIpa() || this.answerModes().includes('ipa'),
  );

  isPromptRomanizationEnabled(system: RomanizationSystem): boolean {
    return this.displayRomanizations().includes(system);
  }

  isAnswerRomanizationEnabled(system: RomanizationSystem): boolean {
    return this.answerRomanizations().includes(system);
  }

  isAnswerModeEnabled(mode: AnswerDisplayMode): boolean {
    return this.answerModes().includes(mode);
  }

  onPromptRomanizationChange(system: RomanizationSystem, event: MatCheckboxChange): void {
    this.displayRomanizationsChange.emit(
      toggleRomanizations(this.displayRomanizations(), system, event.checked),
    );
  }

  onAnswerRomanizationChange(system: RomanizationSystem, event: MatCheckboxChange): void {
    this.answerRomanizationsChange.emit(
      toggleRomanizations(this.answerRomanizations(), system, event.checked),
    );
  }

  onShowIpaChange(event: MatCheckboxChange): void {
    this.showIpaChange.emit(event.checked);
  }

  onAnswerModeChange(mode: AnswerDisplayMode, event: MatCheckboxChange): void {
    this.answerModesChange.emit(toggleAnswerModes(this.answerModes(), mode, event.checked));
  }

  onIpaVariantLabelChange(value: string): void {
    this.ipaVariantLabelChange.emit(value);
  }

  promptRomanizationAriaLabel(option: RomanizationOption): string {
    return `${option.label} в задании${this.courseLabelSuffix()}`;
  }

  answerRomanizationAriaLabel(option: RomanizationOption): string {
    return `${option.label} в ответах${this.courseLabelSuffix()}`;
  }

  private courseLabelSuffix(): string {
    const label = this.courseLabel().trim();
    return label ? ` (${label})` : '';
  }
}
