import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { RomanizationSystem } from '../../../core/models/phonetic-content.types';
import {
  type AnswerDisplayMode,
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

  readonly displayRomanizations = model<readonly RomanizationSystem[]>([]);
  readonly answerRomanizations = model<readonly RomanizationSystem[]>([]);
  readonly showIpa = model(false);
  readonly ipaVariantLabel = model('');
  readonly answerModes = model<readonly AnswerDisplayMode[]>([]);

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

  onPromptRomanizationClick(system: RomanizationSystem, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.displayRomanizations.set(
      toggleRomanizations(this.displayRomanizations(), system, !this.isPromptRomanizationEnabled(system)),
    );
  }

  onAnswerRomanizationClick(system: RomanizationSystem, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.answerRomanizations.set(
      toggleRomanizations(this.answerRomanizations(), system, !this.isAnswerRomanizationEnabled(system)),
    );
  }

  onShowIpaClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.showIpa.set(!this.showIpa());
  }

  onAnswerModeClick(mode: AnswerDisplayMode, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.answerModes.set(
      toggleAnswerModes(this.answerModes(), mode, !this.isAnswerModeEnabled(mode)),
    );
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
