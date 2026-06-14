import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { RomanizationSystem } from '../../../core/models/phonetic-content.types';
import {
  DEFAULT_ANSWER_ROMANIZATIONS,
  DEFAULT_DISPLAY_ROMANIZATIONS,
  type AnswerDisplayMode,
  isOnlyAnswerModeEnabled,
  isOnlyRomanizationEnabled,
  toggleAnswerModes,
  toggleRomanizations,
} from './course-display-settings-matrix.utils';

export type RomanizationOption = {
  value: RomanizationSystem;
  label: string;
};

@Component({
  selector: 'app-course-display-settings-matrix',
  imports: [FormsModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './course-display-settings-matrix.component.html',
  styleUrl: './course-display-settings-matrix.component.scss',
})
export class CourseDisplaySettingsMatrixComponent {
  readonly showCjk = input(false);
  readonly showPhonetic = input(false);
  readonly romanizationOptions = input<readonly RomanizationOption[]>([]);
  readonly courseLabel = input('');

  readonly displayRomanizations = input<readonly RomanizationSystem[]>([]);
  readonly answerRomanizations = input<readonly RomanizationSystem[]>([]);
  readonly showIpa = input(false);
  readonly ipaVariantLabel = input('');
  readonly answerModes = input<readonly AnswerDisplayMode[]>([]);

  readonly displayRomanizationsChange = output<readonly RomanizationSystem[]>();
  readonly answerRomanizationsChange = output<readonly RomanizationSystem[]>();
  readonly showIpaChange = output<boolean>();
  readonly ipaVariantLabelChange = output<string>();
  readonly answerModesChange = output<readonly AnswerDisplayMode[]>();

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

  isPromptRomanizationDisabled(system: RomanizationSystem): boolean {
    return isOnlyRomanizationEnabled(this.displayRomanizations(), system);
  }

  isAnswerRomanizationDisabled(system: RomanizationSystem): boolean {
    return isOnlyRomanizationEnabled(this.answerRomanizations(), system);
  }

  isAnswerModeDisabled(mode: AnswerDisplayMode): boolean {
    return isOnlyAnswerModeEnabled(this.answerModes(), mode);
  }

  onPromptRomanizationChange(system: RomanizationSystem, enabled: boolean): void {
    this.displayRomanizationsChange.emit(
      toggleRomanizations(
        this.displayRomanizations(),
        system,
        enabled,
        DEFAULT_DISPLAY_ROMANIZATIONS,
      ),
    );
  }

  onAnswerRomanizationChange(system: RomanizationSystem, enabled: boolean): void {
    this.answerRomanizationsChange.emit(
      toggleRomanizations(
        this.answerRomanizations(),
        system,
        enabled,
        DEFAULT_ANSWER_ROMANIZATIONS,
      ),
    );
  }

  onAnswerModeChange(mode: AnswerDisplayMode, enabled: boolean): void {
    this.answerModesChange.emit(toggleAnswerModes(this.answerModes(), mode, enabled));
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
