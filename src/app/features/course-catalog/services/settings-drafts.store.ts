import { Injectable, computed, signal, type Signal } from '@angular/core';
import type { RomanizationSystem, ToneColorSchemeId } from '../../../entities/phonetic/model';
import type { AnswerDisplayMode } from '../../../entities/course/ui/course-display-settings-matrix/course-display-settings-matrix.util';
import {
  initialSettingsDraftsState,
  type SettingsDraftsState,
} from '../models/settings-drafts-store';

/**
 * Store черновиков вкладки «Настройки» (отображение курса).
 *
 * Черновики инициализируются из `UserLanguagePairSettings` активной пары
 * и персистятся обратно через `UserStore.updateLanguagePairSettings()`.
 */
@Injectable({ providedIn: 'root' })
export class SettingsDraftsStore {
  #state = signal<SettingsDraftsState>({ ...initialSettingsDraftsState });

  /** Черновик ID активной пары для настроек. */
  get settingsPairIdDraft(): Signal<string> {
    return computed(() => this.#state().settingsPairIdDraft);
  }

  /** Черновик систем романизации для отображения. */
  get displayRomanizationsDraft(): Signal<readonly RomanizationSystem[]> {
    return computed(() => this.#state().displayRomanizationsDraft);
  }

  /** Черновик систем романизации для ответов. */
  get answerRomanizationsDraft(): Signal<readonly RomanizationSystem[]> {
    return computed(() => this.#state().answerRomanizationsDraft);
  }

  /** Черновик показа IPA. */
  get showIpaDraft(): Signal<boolean> {
    return computed(() => this.#state().showIpaDraft);
  }

  /** Черновик подписи варианта IPA. */
  get ipaVariantLabelDraft(): Signal<string> {
    return computed(() => this.#state().ipaVariantLabelDraft);
  }

  /** Черновик режимов отображения ответов. */
  get answerModesDraft(): Signal<readonly AnswerDisplayMode[]> {
    return computed(() => this.#state().answerModesDraft);
  }

  /** Черновик включения цветовой маркировки тонов. */
  get toneColorEnabledDraft(): Signal<boolean> {
    return computed(() => this.#state().toneColorEnabledDraft);
  }

  /** Черновик схемы цветов тонов. */
  get toneColorSchemeDraft(): Signal<ToneColorSchemeId> {
    return computed(() => this.#state().toneColorSchemeDraft);
  }

  /** Черновик длительности штриха (мс). */
  get tracingStrokeDurationDraft(): Signal<number> {
    return computed(() => this.#state().tracingStrokeDurationDraft);
  }

  setSettingsPairIdDraft(id: string): void {
    this.#state.update((s) => ({ ...s, settingsPairIdDraft: id }));
  }

  setDisplayRomanizationsDraft(romanizations: readonly RomanizationSystem[]): void {
    this.#state.update((s) => ({ ...s, displayRomanizationsDraft: romanizations }));
  }

  setAnswerRomanizationsDraft(romanizations: readonly RomanizationSystem[]): void {
    this.#state.update((s) => ({ ...s, answerRomanizationsDraft: romanizations }));
  }

  setShowIpaDraft(show: boolean): void {
    this.#state.update((s) => ({ ...s, showIpaDraft: show }));
  }

  setIpaVariantLabelDraft(label: string): void {
    this.#state.update((s) => ({ ...s, ipaVariantLabelDraft: label }));
  }

  setAnswerModesDraft(modes: readonly AnswerDisplayMode[]): void {
    this.#state.update((s) => ({ ...s, answerModesDraft: modes }));
  }

  setToneColorEnabledDraft(enabled: boolean): void {
    this.#state.update((s) => ({ ...s, toneColorEnabledDraft: enabled }));
  }

  setToneColorSchemeDraft(scheme: ToneColorSchemeId): void {
    this.#state.update((s) => ({ ...s, toneColorSchemeDraft: scheme }));
  }

  setTracingStrokeDurationDraft(duration: number): void {
    this.#state.update((s) => ({ ...s, tracingStrokeDurationDraft: duration }));
  }

  /**
   * Инициализирует все черновики настроек из настроек языковой пары.
   */
  initializeFromPreferences(
    settingsPairId: string,
    displayRomanizations: readonly RomanizationSystem[],
    answerRomanizations: readonly RomanizationSystem[],
    showIpaValue: boolean,
    ipaVariantLabel: string,
    answerModes: readonly AnswerDisplayMode[],
    toneColorEnabled: boolean,
    toneColorScheme: ToneColorSchemeId,
    tracingStrokeDuration: number,
  ): void {
    this.#state.update((s) => ({
      ...s,
      settingsPairIdDraft: settingsPairId,
      displayRomanizationsDraft: [...displayRomanizations],
      answerRomanizationsDraft: [...answerRomanizations],
      showIpaDraft: showIpaValue,
      ipaVariantLabelDraft: ipaVariantLabel,
      answerModesDraft: [...answerModes],
      toneColorEnabledDraft: toneColorEnabled,
      toneColorSchemeDraft: toneColorScheme,
      tracingStrokeDurationDraft: tracingStrokeDuration,
    }));
  }
}