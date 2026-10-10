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

  /**
   * Current course catalog items.
   *
   * @remarks
   * Paginated subset of courses matching the active language pair criteria.
   * Updated by `setItems()` after a search response.
   */
  get items(): Signal<readonly CourseIndexEntry[]> {
    return computed(() => this.#state().items);
  }

  /**
   * Total number of course catalog items.
   *
   * @remarks
   * Represents the total count across all pages, not just the current page.
   * Updated by `setTotalItems()` after a search response.
   */
  get totalItems(): Signal<number> {
    return computed(() => this.#state().totalItems);
  }

  /**
   * Current zero-based page index.
   *
   * @remarks
   * Updated by `setPageIndex()` or `onPageChange()`. Defaults to `0`.
   */
  get pageIndex(): Signal<number> {
    return computed(() => this.#state().pageIndex);
  }

  /**
   * Number of items per page.
   *
   * @remarks
   * Updated by `setPageSize()` or `onPageChange()`. Defaults to the value from `initialState`.
   */
  get pageSize(): Signal<number> {
    return computed(() => this.#state().pageSize);
  }

  /**
   * Loading state for catalog data.
   *
   * @remarks
   * Set to `true` at the start of a search and reset to `false` when the response arrives.
   */
  get loading(): Signal<boolean> {
    return computed(() => this.#state().loading);
  }

  /**
   * Error message, if any.
   *
   * @remarks
   * Set when a catalog search or progress fetch fails. Reset to `null` at the start of each search.
   */
  get error(): Signal<string | null> {
    return computed(() => this.#state().error);
  }

  /**
   * Progress percentage by course ID.
   *
   * @remarks
   * Populated by `loadProgress()` in the catalog page component. Each key is a course ID,
   * and the value is a number between 0 and 100. Updated by `setProgressByCourseId()`.
   */
  get progressByCourseId(): Signal<Readonly<Record<string, number>>> {
    return computed(() => this.#state().progressByCourseId);
  }

  /**
   * Set of completed course IDs.
   *
   * @remarks
   * Populated by `loadProgress()` in the catalog page component. Updated by `setCompletedCourseIds()`.
   */
  get completedCourseIds(): Signal<ReadonlySet<string>> {
    return computed(() => this.#state().completedCourseIds);
  }

  // Profile drafts

  /**
   * Draft display name for the user profile.
   *
   * @remarks
   * Modified by the user in the settings form and persisted via `UserStore.updateDisplayName()`.
   */
  get nameDraft(): Signal<string> {
    return computed(() => this.#state().nameDraft);
  }

  /**
   * Draft learning proficiency level.
   *
   * @remarks
   * Modified by the user in the settings form and persisted via `UserStore.updatePreferences()`.
   */
  get learningProficiencyDraft(): Signal<LearningProficiencyLevel> {
    return computed(() => this.#state().learningProficiencyDraft);
  }

  /**
   * Draft theme name.
   *
   * @remarks
   * Modified by the user in the settings form and persisted via `UserStore.updatePreferences()`.
   */
  get themeDraft(): Signal<AppColorScheme> {
    return computed(() => this.#state().themeDraft);
  }

  /**
   * Draft font size ('sm', 'md', or 'lg').
   *
   * @remarks
   * Modified by the user in the settings form and persisted via `UserStore.updatePreferences()`.
   */
  get fontSizeDraft(): Signal<UserPreferences['fontSize']> {
    return computed(() => this.#state().fontSizeDraft);
  }

  /**
   * Draft color scheme ('light', 'dark', or 'system').
   *
   * @remarks
   * Modified by the user in the settings form and persisted via `UserStore.updatePreferences()`.
   */
  get colorSchemeDraft(): Signal<AppColorScheme> {
    return computed(() => this.#state().colorSchemeDraft);
  }

  /**
   * Draft card focus fullscreen preference.
   *
   * @remarks
   * Modified by the user in the settings form and persisted via `UserStore.updatePreferences()`.
   */
  get cardFocusFullscreenDraft(): Signal<boolean> {
    return computed(() => this.#state().cardFocusFullscreenDraft);
  }

  // Course tab

  /**
   * Draft known content language for course creation.
   *
   * @remarks
   * Modified by the user in the courses tab and persisted via `UserStore.addLanguagePair()`.
   */
  get knownLanguageDraft(): Signal<ContentLanguage> {
    return computed(() => this.#state().knownLanguageDraft);
  }

  /**
   * Draft learning content language for course creation.
   *
   * @remarks
   * Modified by the user in the courses tab and persisted via `UserStore.addLanguagePair()`.
   */
  get learningLanguageDraft(): Signal<ContentLanguage> {
    return computed(() => this.#state().learningLanguageDraft);
  }

  // Settings tab

  /**
   * Draft ID of the active language pair for settings.
   *
   * @remarks
   * Determines which language pair's display settings are shown in the settings tab.
   * Updated by `setSettingsPairIdDraft()` when the user switches pairs.
   */
  get settingsPairIdDraft(): Signal<string> {
    return computed(() => this.#state().settingsPairIdDraft);
  }

  /**
   * Draft display romanization systems.
   *
   * @remarks
   * Modified by the user in the settings tab and persisted via `UserStore.updateLanguagePairSettings()`.
   */
  get displayRomanizationsDraft(): Signal<readonly RomanizationSystem[]> {
    return computed(() => this.#state().displayRomanizationsDraft);
  }

  /**
   * Draft answer romanization systems.
   *
   * @remarks
   * Modified by the user in the settings tab and persisted via `UserStore.updateLanguagePairSettings()`.
   */
  get answerRomanizationsDraft(): Signal<readonly RomanizationSystem[]> {
    return computed(() => this.#state().answerRomanizationsDraft);
  }

  /**
   * Draft show IPA preference.
   *
   * @remarks
   * Modified by the user in the settings tab and persisted via `UserStore.updateLanguagePairSettings()`.
   */
  get showIpaDraft(): Signal<boolean> {
    return computed(() => this.#state().showIpaDraft);
  }

  /**
   * Draft IPA variant label.
   *
   * @remarks
   * A custom label for IPA display, modified by the user in the settings tab.
   * Persisted via `UserStore.updateLanguagePairSettings()`.
   */
  get ipaVariantLabelDraft(): Signal<string> {
    return computed(() => this.#state().ipaVariantLabelDraft);
  }

  /**
   * Draft answer display modes.
   *
   * @remarks
   * Modified by the user in the settings tab and persisted via `UserStore.updateLanguagePairSettings()`.
   */
  get answerModesDraft(): Signal<readonly AnswerDisplayMode[]> {
    return computed(() => this.#state().answerModesDraft);
  }

  /**
   * Draft tone color enabled preference.
   *
   * @remarks
   * Modified by the user in the settings tab and persisted via `UserStore.updateLanguagePairSettings()`.
   */
  get toneColorEnabledDraft(): Signal<boolean> {
    return computed(() => this.#state().toneColorEnabledDraft);
  }

  /**
   * Draft tone color scheme ID.
   *
   * @remarks
   * Modified by the user in the settings tab and persisted via `UserStore.updateLanguagePairSettings()`.
   */
  get toneColorSchemeDraft(): Signal<ToneColorSchemeId> {
    return computed(() => this.#state().toneColorSchemeDraft);
  }

  /**
   * Draft tracing stroke duration in milliseconds.
   *
   * @remarks
   * Applicable to CJK (Chinese) learning. Modified by the user in the settings tab
   * and persisted via `UserStore.updateLanguagePairSettings()`.
   */
  get tracingStrokeDurationDraft(): Signal<number> {
    return computed(() => this.#state().tracingStrokeDurationDraft);
  }

  // Tab control

  /**
   * Currently selected tab index.
   *
   * @remarks
   * Controls which sub-tab (Courses, Programs, Settings) is active in the catalog page.
   */
  get selectedTabIndex(): Signal<number> {
    return computed(() => this.#state().selectedTabIndex);
  }

  // --- Производные значения ---

  /**
   * Whether the known and learning language drafts are identical (invalid).
   *
   * @remarks
   * Used to disable the "Add Pair" button when both languages are the same.
   */
  readonly languagePairInvalid = computed(
    () => this.#state().knownLanguageDraft === this.#state().learningLanguageDraft,
  );

  readonly settingsEntryLabel = computed(() => {
    // Note: languagePairs should be injected or passed from UserStore
    // This will be resolved by the component
    return '';
  });

  /**
   * Available romanization options for display and answer settings.
   *
   * @remarks
   * Always includes Pinyin and Zhuyin. Palladius is added dynamically by the component
   * when the known language supports it (e.g., Russian → Chinese).
   */
  readonly romanizationOptions = computed((): readonly RomanizationOption[] => {
    const options: RomanizationOption[] = [
      { value: 'pinyin', label: 'Пиньинь' },
      { value: 'zhuyin', label: 'Жуинь (Bopomofo)' },
    ];
    return options;
  });

  // --- Мутации — Course catalog ---

  /**
   * Sets the course catalog items.
   *
   * @param items - The paginated course items from the search service.
   */
  setItems(items: readonly CourseIndexEntry[]): void {
    this.#state.update(s => ({ ...s, items }));
  }

  /**
   * Sets the total number of course catalog items.
   *
   * @param total - The total count across all pages.
   */
  setTotalItems(total: number): void {
    this.#state.update(s => ({ ...s, totalItems: total }));
  }

  /**
   * Sets the current page index.
   *
   * @param page - The zero-based page index.
   */
  setPageIndex(page: number): void {
    this.#state.update(s => ({ ...s, pageIndex: page }));
  }

  /**
   * Sets the page size.
   *
   * @param size - The number of items per page.
   */
  setPageSize(size: number): void {
    this.#state.update(s => ({ ...s, pageSize: size }));
  }

  /**
   * Sets the loading state.
   *
   * @param loading - Whether the catalog is currently loading data.
   */
  setLoading(loading: boolean): void {
    this.#state.update(s => ({ ...s, loading }));
  }

  /**
   * Sets the error message.
   *
   * @param error - The error message, or `null` to clear errors.
   */
  setError(error: string | null): void {
    this.#state.update(s => ({ ...s, error }));
  }

  /**
   * Sets progress by course ID.
   *
   * @param progress - A record mapping course IDs to their completion percentages (0-100).
   */
  setProgressByCourseId(progress: Record<string, number>): void {
    this.#state.update(s => ({ ...s, progressByCourseId: progress }));
  }

  /**
   * Sets the set of completed course IDs.
   *
   * @param completed - A set of course IDs that have been fully completed.
   */
  setCompletedCourseIds(completed: Set<string>): void {
    this.#state.update(s => ({ ...s, completedCourseIds: completed }));
  }

  // --- Мутации — Profile ---

  /**
   * Sets the profile name draft.
   *
   * @param name - The display name to set.
   */
  setNameDraft(name: string): void {
    this.#state.update(s => ({ ...s, nameDraft: name }));
  }

  /**
   * Sets the learning proficiency draft.
   *
   * @param level - The proficiency level to set.
   */
  setLearningProficiencyDraft(level: LearningProficiencyLevel): void {
    this.#state.update(s => ({ ...s, learningProficiencyDraft: level }));
  }

  /**
   * Sets the theme draft.
   *
   * @param theme - The theme name to set.
   */
  setThemeDraft(theme: AppColorScheme): void {
    this.#state.update(s => ({ ...s, themeDraft: theme }));
  }

  /**
   * Sets the font size draft.
   *
   * @param size - The font size to set ('sm', 'md', or 'lg').
   */
  setFontSizeDraft(size: UserPreferences['fontSize']): void {
    this.#state.update(s => ({ ...s, fontSizeDraft: size }));
  }

  /**
   * Sets the color scheme draft.
   *
   * @param scheme - The color scheme to set ('light', 'dark', or 'system').
   */
  setColorSchemeDraft(scheme: AppColorScheme): void {
    this.#state.update(s => ({ ...s, colorSchemeDraft: scheme }));
  }

  /**
   * Sets the card focus fullscreen draft.
   *
   * @param enabled - Whether card focus should use fullscreen mode.
   */
  setCardFocusFullscreenDraft(enabled: boolean): void {
    this.#state.update(s => ({ ...s, cardFocusFullscreenDraft: enabled }));
  }

  // --- Мутации — Course tab ---

  /**
   * Sets the known language draft.
   *
   * @param lang - The known content language to set.
   */
  setKnownLanguageDraft(lang: ContentLanguage): void {
    this.#state.update(s => ({ ...s, knownLanguageDraft: lang }));
  }

  /**
   * Sets the learning language draft.
   *
   * @param lang - The learning content language to set.
   */
  setLearningLanguageDraft(lang: ContentLanguage): void {
    this.#state.update(s => ({ ...s, learningLanguageDraft: lang }));
  }

  // --- Мутации — Settings tab ---

  /**
   * Sets the settings language pair ID draft.
   *
   * @param id - The language pair ID to use for settings.
   */
  setSettingsPairIdDraft(id: string): void {
    this.#state.update(s => ({ ...s, settingsPairIdDraft: id }));
  }

  /**
   * Sets the display romanizations draft.
   *
   * @param romanizations - The display romanization systems to set.
   */
  setDisplayRomanizationsDraft(romanizations: readonly RomanizationSystem[]): void {
    this.#state.update(s => ({ ...s, displayRomanizationsDraft: romanizations }));
  }

  /**
   * Sets the answer romanizations draft.
   *
   * @param romanizations - The answer romanization systems to set.
   */
  setAnswerRomanizationsDraft(romanizations: readonly RomanizationSystem[]): void {
    this.#state.update(s => ({ ...s, answerRomanizationsDraft: romanizations }));
  }

  /**
   * Sets the show IPA draft.
   *
   * @param show - Whether to display IPA notation.
   */
  setShowIpaDraft(show: boolean): void {
    this.#state.update(s => ({ ...s, showIpaDraft: show }));
  }

  /**
   * Sets the IPA variant label draft.
   *
   * @param label - The custom IPA variant label.
   */
  setIpaVariantLabelDraft(label: string): void {
    this.#state.update(s => ({ ...s, ipaVariantLabelDraft: label }));
  }

  /**
   * Sets the answer modes draft.
   *
   * @param modes - The answer display modes to set.
   */
  setAnswerModesDraft(modes: readonly AnswerDisplayMode[]): void {
    this.#state.update(s => ({ ...s, answerModesDraft: modes }));
  }

  /**
   * Sets the tone color enabled draft.
   *
   * @param enabled - Whether tone coloring is enabled.
   */
  setToneColorEnabledDraft(enabled: boolean): void {
    this.#state.update(s => ({ ...s, toneColorEnabledDraft: enabled }));
  }

  /**
   * Sets the tone color scheme draft.
   *
   * @param scheme - The tone color scheme ID to set.
   */
  setToneColorSchemeDraft(scheme: ToneColorSchemeId): void {
    this.#state.update(s => ({ ...s, toneColorSchemeDraft: scheme }));
  }

  /**
   * Sets the tracing stroke duration draft.
   *
   * @param duration - The tracing stroke duration in milliseconds.
   */
  setTracingStrokeDurationDraft(duration: number): void {
    this.#state.update(s => ({ ...s, tracingStrokeDurationDraft: duration }));
  }

  // --- Мутации — Tab control ---

  /**
   * Sets the selected tab index.
   *
   * @param index - The zero-based index of the selected tab.
   */
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
