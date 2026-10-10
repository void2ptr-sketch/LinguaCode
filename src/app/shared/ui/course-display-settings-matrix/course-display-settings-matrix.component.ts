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

  /**
   * Checks if a romanization system is enabled for prompts.
   *
   * @param system - The romanization system to check.
   * @returns `true` if the system is in the display romanizations list.
   */
  isPromptRomanizationEnabled(system: RomanizationSystem): boolean {
    return this.displayRomanizations().includes(system);
  }

  /**
   * Checks if a romanization system is enabled for answers.
   *
   * @param system - The romanization system to check.
   * @returns `true` if the system is in the answer romanizations list.
   */
  isAnswerRomanizationEnabled(system: RomanizationSystem): boolean {
    return this.answerRomanizations().includes(system);
  }

  /**
   * Checks if an answer mode is enabled.
   *
   * @param mode - The answer display mode to check.
   * @returns `true` if the mode is in the answer modes list.
   */
  isAnswerModeEnabled(mode: AnswerDisplayMode): boolean {
    return this.answerModes().includes(mode);
  }

  /**
   * Handles prompt romanization checkbox changes.
   *
   * @param system - The romanization system being toggled.
   * @param event - The checkbox change event.
   */
  onPromptRomanizationChange(system: RomanizationSystem, event: MatCheckboxChange): void {
    this.displayRomanizationsChange.emit(
      toggleRomanizations(this.displayRomanizations(), system, event.checked),
    );
  }

  /**
   * Handles answer romanization checkbox changes.
   *
   * @param system - The romanization system being toggled.
   * @param event - The checkbox change event.
   */
  onAnswerRomanizationChange(system: RomanizationSystem, event: MatCheckboxChange): void {
    this.answerRomanizationsChange.emit(
      toggleRomanizations(this.answerRomanizations(), system, event.checked),
    );
  }

  /**
   * Handles IPA display checkbox changes.
   *
   * @param event - The checkbox change event.
   */
  onShowIpaChange(event: MatCheckboxChange): void {
    this.showIpaChange.emit(event.checked);
  }

  /**
   * Handles answer mode checkbox changes.
   *
   * @param mode - The answer display mode being toggled.
   * @param event - The checkbox change event.
   */
  onAnswerModeChange(mode: AnswerDisplayMode, event: MatCheckboxChange): void {
    this.answerModesChange.emit(toggleAnswerModes(this.answerModes(), mode, event.checked));
  }

  /**
   * Handles IPA variant label changes.
   *
   * @param value - The new IPA variant label.
   */
  onIpaVariantLabelChange(value: string): void {
    this.ipaVariantLabelChange.emit(value);
  }

  /**
   * Returns the ARIA label for a prompt romanization option.
   *
   * @param option - The romanization option.
   * @returns An accessible label describing the checkbox purpose.
   */
  promptRomanizationAriaLabel(option: RomanizationOption): string {
    return `${option.label} в задании${this.courseLabelSuffix()}`;
  }

  /**
   * Returns the ARIA label for an answer romanization option.
   *
   * @param option - The romanization option.
   * @returns An accessible label describing the checkbox purpose.
   */
  answerRomanizationAriaLabel(option: RomanizationOption): string {
    return `${option.label} в ответах${this.courseLabelSuffix()}`;
  }

  private courseLabelSuffix(): string {
    const label = this.courseLabel().trim();
    return label ? ` (${label})` : '';
  }
}
