import { Injectable, computed, signal, type Signal } from '@angular/core';
import type { AppColorScheme, UserPreferences } from '../../../entities/user/model';
import type { LearningProficiencyLevel } from '../../../entities/learning/model';
import type { ContentLanguage } from '../../../entities/card/model';
import type { RomanizationSystem, ToneColorSchemeId } from '../../../entities/phonetic/model';
import { TRACING_STROKE_DURATION_BOUNDS } from '../../../entities/phonetic/model';
import type { AnswerDisplayMode } from '../../../entities/course/ui/course-display-settings-matrix/course-display-settings-matrix.util';

// ===== Types =====

/** Состояние черновиков профиля пользователя (форма настроек). */
export type ProfileDraftsState = {
  nameDraft: string;
  learningProficiencyDraft: LearningProficiencyLevel;
  themeDraft: AppColorScheme;
  fontSizeDraft: UserPreferences['fontSize'];
  colorSchemeDraft: AppColorScheme;
  cardFocusFullscreenDraft: boolean;
};

export const initialProfileDraftsState: ProfileDraftsState = {
  nameDraft: '',
  learningProficiencyDraft: 'beginner',
  themeDraft: 'light',
  fontSizeDraft: 'md',
  colorSchemeDraft: 'light',
  cardFocusFullscreenDraft: false,
};

/** Состояние черновиков вкладки «Курсы» (пара языков known → learning). */
export type CourseTabDraftsState = {
  knownLanguageDraft: ContentLanguage;
  learningLanguageDraft: ContentLanguage;
};

export const initialCourseTabDraftsState: CourseTabDraftsState = {
  knownLanguageDraft: 'ru',
  learningLanguageDraft: 'en',
};

/** Состояние черновиков вкладки «Настройки» (отображение курса). */
export type SettingsDraftsState = {
  settingsPairIdDraft: string;
  displayRomanizationsDraft: readonly RomanizationSystem[];
  answerRomanizationsDraft: readonly RomanizationSystem[];
  showIpaDraft: boolean;
  ipaVariantLabelDraft: string;
  answerModesDraft: readonly AnswerDisplayMode[];
  toneColorEnabledDraft: boolean;
  toneColorSchemeDraft: ToneColorSchemeId;
  tracingStrokeDurationDraft: number;
};

export const initialSettingsDraftsState: SettingsDraftsState = {
  settingsPairIdDraft: '',
  displayRomanizationsDraft: ['pinyin'],
  answerRomanizationsDraft: ['pinyin', 'palladius'],
  showIpaDraft: false,
  ipaVariantLabelDraft: '',
  answerModesDraft: ['orthography'],
  toneColorEnabledDraft: false,
  toneColorSchemeDraft: 'classic',
  tracingStrokeDurationDraft: TRACING_STROKE_DURATION_BOUNDS.defaultSec,
};

// ===== Store =====

/**
 * Единый store черновиков для course-catalog.
 *
 * Объединяет три области черновиков в один сервис с scoped методами:
 * - `profile` — черновики профиля;
 * - `courseTab` — черновики вкладки «Курсы»;
 * - `settings` — черновики вкладки «Настройки».
 */
@Injectable({ providedIn: 'root' })
export class DraftsStore {
  #profile = signal<ProfileDraftsState>({ ...initialProfileDraftsState });
  #courseTab = signal<CourseTabDraftsState>({ ...initialCourseTabDraftsState });
  #settings = signal<SettingsDraftsState>({ ...initialSettingsDraftsState });

  // ===== Profile section =====

  /** Черновик отображаемого имени. */
  get profileNameDraft(): Signal<string> {
    return computed(() => this.#profile().nameDraft);
  }

  /** Черновик уровня подготовки. */
  get profileLearningProficiencyDraft(): Signal<LearningProficiencyLevel> {
    return computed(() => this.#profile().learningProficiencyDraft);
  }

  /** Черновик темы оформления. */
  get profileThemeDraft(): Signal<AppColorScheme> {
    return computed(() => this.#profile().themeDraft);
  }

  /** Черновик размера шрифта. */
  get profileFontSizeDraft(): Signal<UserPreferences['fontSize']> {
    return computed(() => this.#profile().fontSizeDraft);
  }

  /** Черновик цветовой схемы. */
  get profileColorSchemeDraft(): Signal<AppColorScheme> {
    return computed(() => this.#profile().colorSchemeDraft);
  }

  /** Черновик полноэкранного режима карточки. */
  get profileCardFocusFullscreenDraft(): Signal<boolean> {
    return computed(() => this.#profile().cardFocusFullscreenDraft);
  }

  setProfileNameDraft(name: string): void {
    this.#profile.update((s) => ({ ...s, nameDraft: name }));
  }

  setProfileLearningProficiencyDraft(level: LearningProficiencyLevel): void {
    this.#profile.update((s) => ({ ...s, learningProficiencyDraft: level }));
  }

  setProfileThemeDraft(theme: AppColorScheme): void {
    this.#profile.update((s) => ({ ...s, themeDraft: theme }));
  }

  setProfileFontSizeDraft(size: UserPreferences['fontSize']): void {
    this.#profile.update((s) => ({ ...s, fontSizeDraft: size }));
  }

  setProfileColorSchemeDraft(scheme: AppColorScheme): void {
    this.#profile.update((s) => ({ ...s, colorSchemeDraft: scheme }));
  }

  setProfileCardFocusFullscreenDraft(enabled: boolean): void {
    this.#profile.update((s) => ({ ...s, cardFocusFullscreenDraft: enabled }));
  }

  /**
   * Инициализирует все черновики профиля из пользовательских настроек.
   */
  initializeProfile(
    name: string,
    proficiency: LearningProficiencyLevel,
    theme: AppColorScheme,
    fontSize: UserPreferences['fontSize'],
    colorScheme: AppColorScheme,
    cardFocusFullscreen: boolean,
  ): void {
    this.#profile.update((s) => ({
      ...s,
      nameDraft: name,
      learningProficiencyDraft: proficiency,
      themeDraft: theme,
      fontSizeDraft: fontSize,
      colorSchemeDraft: colorScheme,
      cardFocusFullscreenDraft: cardFocusFullscreen,
    }));
  }

  // ===== Course Tab section =====

  /** Черновик известного языка. */
  get courseTabKnownLanguageDraft(): Signal<ContentLanguage> {
    return computed(() => this.#courseTab().knownLanguageDraft);
  }

  /** Черновик изучаемого языка. */
  get courseTabLearningLanguageDraft(): Signal<ContentLanguage> {
    return computed(() => this.#courseTab().learningLanguageDraft);
  }

  /** Одинаковы ли языки (невалидная пара). */
  readonly courseTabLanguagePairInvalid = computed(
    () => this.#courseTab().knownLanguageDraft === this.#courseTab().learningLanguageDraft,
  );

  setCourseTabKnownLanguageDraft(lang: ContentLanguage): void {
    this.#courseTab.update((s) => ({ ...s, knownLanguageDraft: lang }));
  }

  setCourseTabLearningLanguageDraft(lang: ContentLanguage): void {
    this.#courseTab.update((s) => ({ ...s, learningLanguageDraft: lang }));
  }

  // ===== Settings section =====

  /** Черновик ID активной пары для настроек. */
  get settingsPairIdDraft(): Signal<string> {
    return computed(() => this.#settings().settingsPairIdDraft);
  }

  /** Черновик систем романизации для отображения. */
  get settingsDisplayRomanizationsDraft(): Signal<readonly RomanizationSystem[]> {
    return computed(() => this.#settings().displayRomanizationsDraft);
  }

  /** Черновик систем романизации для ответов. */
  get settingsAnswerRomanizationsDraft(): Signal<readonly RomanizationSystem[]> {
    return computed(() => this.#settings().answerRomanizationsDraft);
  }

  /** Черновик показа IPA. */
  get settingsShowIpaDraft(): Signal<boolean> {
    return computed(() => this.#settings().showIpaDraft);
  }

  /** Черновик подписи варианта IPA. */
  get settingsIpaVariantLabelDraft(): Signal<string> {
    return computed(() => this.#settings().ipaVariantLabelDraft);
  }

  /** Черновик режимов отображения ответов. */
  get settingsAnswerModesDraft(): Signal<readonly AnswerDisplayMode[]> {
    return computed(() => this.#settings().answerModesDraft);
  }

  /** Черновик включения цветовой маркировки тонов. */
  get settingsToneColorEnabledDraft(): Signal<boolean> {
    return computed(() => this.#settings().toneColorEnabledDraft);
  }

  /** Черновик схемы цветов тонов. */
  get settingsToneColorSchemeDraft(): Signal<ToneColorSchemeId> {
    return computed(() => this.#settings().toneColorSchemeDraft);
  }

  /** Черновик длительности штриха (мс). */
  get settingsTracingStrokeDurationDraft(): Signal<number> {
    return computed(() => this.#settings().tracingStrokeDurationDraft);
  }

  setSettingsPairIdDraft(id: string): void {
    this.#settings.update((s) => ({ ...s, settingsPairIdDraft: id }));
  }

  setSettingsDisplayRomanizationsDraft(romanizations: readonly RomanizationSystem[]): void {
    this.#settings.update((s) => ({ ...s, displayRomanizationsDraft: romanizations }));
  }

  setSettingsAnswerRomanizationsDraft(romanizations: readonly RomanizationSystem[]): void {
    this.#settings.update((s) => ({ ...s, answerRomanizationsDraft: romanizations }));
  }

  setSettingsShowIpaDraft(show: boolean): void {
    this.#settings.update((s) => ({ ...s, showIpaDraft: show }));
  }

  setSettingsIpaVariantLabelDraft(label: string): void {
    this.#settings.update((s) => ({ ...s, ipaVariantLabelDraft: label }));
  }

  setSettingsAnswerModesDraft(modes: readonly AnswerDisplayMode[]): void {
    this.#settings.update((s) => ({ ...s, answerModesDraft: modes }));
  }

  setSettingsToneColorEnabledDraft(enabled: boolean): void {
    this.#settings.update((s) => ({ ...s, toneColorEnabledDraft: enabled }));
  }

  setSettingsToneColorSchemeDraft(scheme: ToneColorSchemeId): void {
    this.#settings.update((s) => ({ ...s, toneColorSchemeDraft: scheme }));
  }

  setSettingsTracingStrokeDurationDraft(duration: number): void {
    this.#settings.update((s) => ({ ...s, tracingStrokeDurationDraft: duration }));
  }

  /**
   * Инициализирует все черновики настроек из настроек языковой пары.
   */
  initializeSettings(
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
    this.#settings.update((s) => ({
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
