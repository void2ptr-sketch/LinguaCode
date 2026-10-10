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

/**
 * A romanization system option for the display settings matrix.
 *
 * @property value - The romanization system identifier (e.g. 'pinyin', 'zhuyin', 'palladius').
 * @property label - Human-readable label displayed in the UI.
 */
export type RomanizationOption = {
  value: RomanizationSystem;
  label: string;
};

/**
 * Course display settings matrix component. Provides a checkbox matrix for configuring
 * romanization display and answer modes for CJK and phonetic content.
 *
 * @remarks
 * Supports prompt and answer romanization toggles, IPA display, custom IPA labels,
 * and answer mode selection (orthography/IPA). Toggles update via change output signals.
 */
@Component({
  selector: 'app-course-display-settings-matrix',
  imports: [FormsModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './course-display-settings-matrix.component.html',
  styleUrl: './course-display-settings-matrix.component.scss',
})
export class CourseDisplaySettingsMatrixComponent {
  /**
   * Whether to show CJK-specific settings (Palladius, tone colors).
   * @remarks When false, CJK-related checkboxes are hidden from the matrix.
   */
  readonly showCjk = input(false);

  /**
   * Whether to show phonetic settings (IPA, answer modes).
   * @remarks When false, IPA and answer mode checkboxes are hidden.
   */
  readonly showPhonetic = input(false);

  /**
   * Available romanization system options.
   * @remarks Each option provides a value (system ID) and a display label.
   */
  readonly romanizationOptions = input<readonly RomanizationOption[]>([]);

  /**
   * Optional course label for aria labels.
   * @remarks Appended to ARIA labels for accessibility context.
   */
  readonly courseLabel = input('');

  /**
   * Currently enabled display romanization systems.
   * @remarks Used for prompt/display romanization toggles.
   */
  readonly displayRomanizations = input<readonly RomanizationSystem[]>([]);

  /**
   * Currently enabled answer romanization systems.
   * @remarks Used for answer romanization toggles.
   */
  readonly answerRomanizations = input<readonly RomanizationSystem[]>([]);

  /**
   * Whether IPA is enabled for display.
   * @remarks Controls the IPA checkbox in the phonetic settings section.
   */
  readonly showIpa = input(false);

  /**
   * Custom IPA variant label.
   * @remarks
   * When set, filters IPA transcriptions to show only those matching this label.
   */
  readonly ipaVariantLabel = input('');

  /**
   * Currently enabled answer display modes.
   * @remarks Each mode controls whether a specific answer format is shown (e.g. orthography, IPA).
   */
  readonly answerModes = input<readonly AnswerDisplayMode[]>([]);

  /**
   * Emits updated display romanization systems.
   * @remarks
   * Emits the new list of enabled romanization systems for prompts/display.
   */
  readonly displayRomanizationsChange = output<readonly RomanizationSystem[]>();

  /**
   * Emits updated answer romanization systems.
   * @remarks
   * Emits the new list of enabled romanization systems for answers.
   */
  readonly answerRomanizationsChange = output<readonly RomanizationSystem[]>();

  /**
   * Emits the updated IPA display preference.
   * @remarks Payload is `true` when IPA is enabled, `false` when disabled.
   */
  readonly showIpaChange = output<boolean>();

  /**
   * Emits the updated custom IPA variant label.
   * @remarks Payload is the new label string.
   */
  readonly ipaVariantLabelChange = output<string>();

  /**
   * Emits updated answer display modes.
   * @remarks
   * Emits the new list of enabled answer display modes.
   */
  readonly answerModesChange = output<readonly AnswerDisplayMode[]>();

  /**
   * Whether the IPA variant text field should be visible.
   * @remarks
   * True when IPA display is enabled or when the 'ipa' answer mode is selected.
   */
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
