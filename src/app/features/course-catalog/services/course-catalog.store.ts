import { Injectable, computed, signal, Signal } from '@angular/core';
import type {
  AppColorScheme,
  ContentLanguage,
  CourseIndexEntry,
  LearningProficiencyLevel,
  RomanizationSystem,
  ToneColorSchemeId,
  UserPreferences,
} from '../../../core/models';

import type { AnswerDisplayMode } from '../../../shared/ui/course-display-settings-matrix/course-display-settings-matrix.util';
import type { RomanizationOption } from '../../../shared/ui/course-display-settings-matrix/course-display-settings-matrix.component';
import type { PageEvent } from '@angular/material/paginator';
import { CourseCatalogState, initialState } from '../models/course-catalog-store';

/**
 * Store for the course catalog feature.
 *
 * @remarks
 * Manages course catalog search state (pagination, filtering), user profile drafts
 * (name, proficiency, theme), and course display settings (romanizations, IPA, tone colors).
 * Uses a single internal signal with computed getters for reactivity.
 */
@Injectable({ providedIn: 'root' })
export class CourseCatalogStore {
  #state = signal<CourseCatalogState>({ ...initialState });

  // --- Селекторы (read-only) ---

  /** Current course catalog items. */
  get items(): Signal<readonly CourseIndexEntry[]> {
    return computed(() => this.#state().items);
  }

  /** Total number of course catalog items. */
  get totalItems(): Signal<number> {
    return computed(() => this.#state().totalItems);
  }

  /** Current zero-based page index. */
  get pageIndex(): Signal<number> {
    return computed(() => this.#state().pageIndex);
  }

  /** Number of items per page. */
  get pageSize(): Signal<number> {
    return computed(() => this.#state().pageSize);
  }

  /** Loading state for catalog data. */
  get loading(): Signal<boolean> {
    return computed(() => this.#state().loading);
  }

  /** Error message, if any. */
  get error(): Signal<string | null> {
    return computed(() => this.#state().error);
  }

  /** Progress percentage by course ID. */
  get progressByCourseId(): Signal<Readonly<Record<string, number>>> {
    return computed(() => this.#state().progressByCourseId);
  }

  /** Set of completed course IDs. */
  get completedCourseIds(): Signal<ReadonlySet<string>> {
    return computed(() => this.#state().completedCourseIds);
  }

  // Profile drafts

  /** Draft display name for the user profile. */
  get nameDraft(): Signal<string> {
    return computed(() => this.#state().nameDraft);
  }

  /** Draft learning proficiency level. */
  get learningProficiencyDraft(): Signal<LearningProficiencyLevel> {
    return computed(() => this.#state().learningProficiencyDraft);
  }

  /** Draft theme name. */
  get themeDraft(): Signal<AppColorScheme> {
    return computed(() => this.#state().themeDraft);
  }

  /** Draft font size ('sm', 'md', or 'lg'). */
  get fontSizeDraft(): Signal<UserPreferences['fontSize']> {
    return computed(() => this.#state().fontSizeDraft);
  }

  /** Draft color scheme ('light', 'dark', or 'system'). */
  get colorSchemeDraft(): Signal<AppColorScheme> {
    return computed(() => this.#state().colorSchemeDraft);
  }

  /** Draft card focus fullscreen preference. */
  get cardFocusFullscreenDraft(): Signal<boolean> {
    return computed(() => this.#state().cardFocusFullscreenDraft);
  }

  // Course tab

  /** Draft known content language for course creation. */
  get knownLanguageDraft(): Signal<ContentLanguage> {
    return computed(() => this.#state().knownLanguageDraft);
  }

  /** Draft learning content language for course creation. */
  get learningLanguageDraft(): Signal<ContentLanguage> {
    return computed(() => this.#state().learningLanguageDraft);
  }

  // Settings tab

  /** Draft ID of the active language pair for settings. */
  get settingsPairIdDraft(): Signal<string> {
    return computed(() => this.#state().settingsPairIdDraft);
  }

  /** Draft display romanization systems. */
  get displayRomanizationsDraft(): Signal<readonly RomanizationSystem[]> {
    return computed(() => this.#state().displayRomanizationsDraft);
  }

  /** Draft answer romanization systems. */
  get answerRomanizationsDraft(): Signal<readonly RomanizationSystem[]> {
    return computed(() => this.#state().answerRomanizationsDraft);
  }

  /** Draft show IPA preference. */
  get showIpaDraft(): Signal<boolean> {
    return computed(() => this.#state().showIpaDraft);
  }

  /** Draft IPA variant label. */
  get ipaVariantLabelDraft(): Signal<string> {
    return computed(() => this.#state().ipaVariantLabelDraft);
  }

  /** Draft answer display modes. */
  get answerModesDraft(): Signal<readonly AnswerDisplayMode[]> {
    return computed(() => this.#state().answerModesDraft);
  }

  /** Draft tone color enabled preference. */
  get toneColorEnabledDraft(): Signal<boolean> {
    return computed(() => this.#state().toneColorEnabledDraft);
  }

  /** Draft tone color scheme ID. */
  get toneColorSchemeDraft(): Signal<ToneColorSchemeId> {
    return computed(() => this.#state().toneColorSchemeDraft);
  }

  /** Draft tracing stroke duration in milliseconds. */
  get tracingStrokeDurationDraft(): Signal<number> {
    return computed(() => this.#state().tracingStrokeDurationDraft);
  }

  // Tab control

  /** Currently selected tab index. */
  get selectedTabIndex(): Signal<number> {
    return computed(() => this.#state().selectedTabIndex);
  }

  // --- Производные значения ---

  /** Whether the known and learning language drafts are identical (invalid). */
  readonly languagePairInvalid = computed(
    () => this.#state().knownLanguageDraft === this.#state().learningLanguageDraft,
  );

  readonly settingsEntryLabel = computed(() => {
    // Note: languagePairs should be injected or passed from UserStore
    // This will be resolved by the component
    return '';
  });

  /** Available romanization options for display and answer settings. */
  readonly romanizationOptions = computed((): readonly RomanizationOption[] => {
    const options: RomanizationOption[] = [
      { value: 'pinyin', label: 'Пиньинь' },
      { value: 'zhuyin', label: 'Жуинь (Bopomofo)' },
    ];
    return options;
  });

  // --- Мутации — Course catalog ---

  /** Sets the course catalog items. */
  setItems(items: readonly CourseIndexEntry[]): void {
    this.#state.update(s => ({ ...s, items }));
  }

  /** Sets the total number of course catalog items. */
  setTotalItems(total: number): void {
    this.#state.update(s => ({ ...s, totalItems: total }));
  }

  /** Sets the current page index. */
  setPageIndex(page: number): void {
    this.#state.update(s => ({ ...s, pageIndex: page }));
  }

  /** Sets the page size. */
  setPageSize(size: number): void {
    this.#state.update(s => ({ ...s, pageSize: size }));
  }

  /** Sets the loading state. */
  setLoading(loading: boolean): void {
    this.#state.update(s => ({ ...s, loading }));
  }

  /** Sets the error message. */
  setError(error: string | null): void {
    this.#state.update(s => ({ ...s, error }));
  }

  /** Sets progress by course ID. */
  setProgressByCourseId(progress: Record<string, number>): void {
    this.#state.update(s => ({ ...s, progressByCourseId: progress }));
  }

  /** Sets the set of completed course IDs. */
  setCompletedCourseIds(completed: Set<string>): void {
    this.#state.update(s => ({ ...s, completedCourseIds: completed }));
  }

  // --- Мутации — Profile ---

  /** Sets the profile name draft. */
  setNameDraft(name: string): void {
    this.#state.update(s => ({ ...s, nameDraft: name }));
  }

  /** Sets the learning proficiency draft. */
  setLearningProficiencyDraft(level: LearningProficiencyLevel): void {
    this.#state.update(s => ({ ...s, learningProficiencyDraft: level }));
  }

  /** Sets the theme draft. */
  setThemeDraft(theme: AppColorScheme): void {
    this.#state.update(s => ({ ...s, themeDraft: theme }));
  }

  /** Sets the font size draft. */
  setFontSizeDraft(size: UserPreferences['fontSize']): void {
    this.#state.update(s => ({ ...s, fontSizeDraft: size }));
  }

  /** Sets the color scheme draft. */
  setColorSchemeDraft(scheme: AppColorScheme): void {
    this.#state.update(s => ({ ...s, colorSchemeDraft: scheme }));
  }

  /** Sets the card focus fullscreen draft. */
  setCardFocusFullscreenDraft(enabled: boolean): void {
    this.#state.update(s => ({ ...s, cardFocusFullscreenDraft: enabled }));
  }

  // --- Мутации — Course tab ---

  /** Sets the known language draft. */
  setKnownLanguageDraft(lang: ContentLanguage): void {
    this.#state.update(s => ({ ...s, knownLanguageDraft: lang }));
  }

  /** Sets the learning language draft. */
  setLearningLanguageDraft(lang: ContentLanguage): void {
    this.#state.update(s => ({ ...s, learningLanguageDraft: lang }));
  }

  // --- Мутации — Settings tab ---

  /** Sets the settings language pair ID draft. */
  setSettingsPairIdDraft(id: string): void {
    this.#state.update(s => ({ ...s, settingsPairIdDraft: id }));
  }

  /** Sets the display romanizations draft. */
  setDisplayRomanizationsDraft(romanizations: readonly RomanizationSystem[]): void {
    this.#state.update(s => ({ ...s, displayRomanizationsDraft: romanizations }));
  }

  /** Sets the answer romanizations draft. */
  setAnswerRomanizationsDraft(romanizations: readonly RomanizationSystem[]): void {
    this.#state.update(s => ({ ...s, answerRomanizationsDraft: romanizations }));
  }

  /** Sets the show IPA draft. */
  setShowIpaDraft(show: boolean): void {
    this.#state.update(s => ({ ...s, showIpaDraft: show }));
  }

  /** Sets the IPA variant label draft. */
  setIpaVariantLabelDraft(label: string): void {
    this.#state.update(s => ({ ...s, ipaVariantLabelDraft: label }));
  }

  /** Sets the answer modes draft. */
  setAnswerModesDraft(modes: readonly AnswerDisplayMode[]): void {
    this.#state.update(s => ({ ...s, answerModesDraft: modes }));
  }

  /** Sets the tone color enabled draft. */
  setToneColorEnabledDraft(enabled: boolean): void {
    this.#state.update(s => ({ ...s, toneColorEnabledDraft: enabled }));
  }

  /** Sets the tone color scheme draft. */
  setToneColorSchemeDraft(scheme: ToneColorSchemeId): void {
    this.#state.update(s => ({ ...s, toneColorSchemeDraft: scheme }));
  }

  /** Sets the tracing stroke duration draft. */
  setTracingStrokeDurationDraft(duration: number): void {
    this.#state.update(s => ({ ...s, tracingStrokeDurationDraft: duration }));
  }

  // --- Мутации — Tab control ---

  /** Sets the selected tab index. */
  setSelectedTabIndex(index: number): void {
    this.#state.update(s => ({ ...s, selectedTabIndex: index }));
  }

  // --- Batch mutations ---

  /**
   * Initializes all draft preferences from user settings.
   *
   * @param name - Display name.
   * @param proficiency - Learning proficiency level.
   * @param theme - Theme name.
   * @param fontSize - Font size ('sm', 'md', or 'lg').
   * @param colorScheme - Color scheme ('light', 'dark', or 'system').
   * @param cardFocusFullscreen - Card focus fullscreen preference.
   * @param settingsPairId - Active language pair ID.
   * @param displayRomanizations - Display romanization systems.
   * @param answerRomanizations - Answer romanization systems.
   * @param showIpaValue - Show IPA preference.
   * @param ipaVariantLabel - IPA variant label.
   * @param answerModes - Answer display modes.
   * @param toneColorEnabled - Tone color enabled preference.
   * @param toneColorScheme - Tone color scheme ID.
   * @param tracingStrokeDuration - Tracing stroke duration in ms.
   */
  initializeFromPreferences(
    name: string,
    proficiency: LearningProficiencyLevel,
    theme: AppColorScheme,
    fontSize: UserPreferences['fontSize'],
    colorScheme: AppColorScheme,
    cardFocusFullscreen: boolean,
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
    this.#state.update(s => ({
      ...s,
      nameDraft: name,
      learningProficiencyDraft: proficiency,
      themeDraft: theme,
      fontSizeDraft: fontSize,
      colorSchemeDraft: colorScheme,
      cardFocusFullscreenDraft: cardFocusFullscreen,
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

  // --- Page events ---

  /**
   * Handles paginator page changes.
   *
   * @param event - The page event from Angular Material paginator.
   */
  onPageChange(event: PageEvent): void {
    this.#state.update(s => ({
      ...s,
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
    }));
  }
}
