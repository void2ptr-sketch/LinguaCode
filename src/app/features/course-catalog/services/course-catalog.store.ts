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

import type { AnswerDisplayMode } from '../../../shared/components/course-display-settings-matrix/course-display-settings-matrix.utils';
import type { RomanizationOption } from '../../../shared/components/course-display-settings-matrix/course-display-settings-matrix.component';
import type { PageEvent } from '@angular/material/paginator';
import { CourseCatalogState, initialState } from '../models/course-catalog-store';


@Injectable({ providedIn: 'root' })
export class CourseCatalogStore {
  #state = signal<CourseCatalogState>({ ...initialState });

  // --- Селекторы (read-only) ---
  get items(): Signal<readonly CourseIndexEntry[]> {
    return computed(() => this.#state().items);
  }
  get totalItems(): Signal<number> {
    return computed(() => this.#state().totalItems);
  }
  get pageIndex(): Signal<number> {
    return computed(() => this.#state().pageIndex);
  }
  get pageSize(): Signal<number> {
    return computed(() => this.#state().pageSize);
  }
  get loading(): Signal<boolean> {
    return computed(() => this.#state().loading);
  }
  get error(): Signal<string | null> {
    return computed(() => this.#state().error);
  }
  get progressByCourseId(): Signal<Readonly<Record<string, number>>> {
    return computed(() => this.#state().progressByCourseId);
  }
  get completedCourseIds(): Signal<ReadonlySet<string>> {
    return computed(() => this.#state().completedCourseIds);
  }

  // Profile drafts
  get nameDraft(): Signal<string> {
    return computed(() => this.#state().nameDraft);
  }
  get learningProficiencyDraft(): Signal<LearningProficiencyLevel> {
    return computed(() => this.#state().learningProficiencyDraft);
  }
  get themeDraft(): Signal<AppColorScheme> {
    return computed(() => this.#state().themeDraft);
  }
  get fontSizeDraft(): Signal<UserPreferences['fontSize']> {
    return computed(() => this.#state().fontSizeDraft);
  }
  get colorSchemeDraft(): Signal<AppColorScheme> {
    return computed(() => this.#state().colorSchemeDraft);
  }
  get cardFocusFullscreenDraft(): Signal<boolean> {
    return computed(() => this.#state().cardFocusFullscreenDraft);
  }

  // Course tab
  get knownLanguageDraft(): Signal<ContentLanguage> {
    return computed(() => this.#state().knownLanguageDraft);
  }
  get learningLanguageDraft(): Signal<ContentLanguage> {
    return computed(() => this.#state().learningLanguageDraft);
  }

  // Settings tab
  get settingsPairIdDraft(): Signal<string> {
    return computed(() => this.#state().settingsPairIdDraft);
  }
  get displayRomanizationsDraft(): Signal<readonly RomanizationSystem[]> {
    return computed(() => this.#state().displayRomanizationsDraft);
  }
  get answerRomanizationsDraft(): Signal<readonly RomanizationSystem[]> {
    return computed(() => this.#state().answerRomanizationsDraft);
  }
  get showIpaDraft(): Signal<boolean> {
    return computed(() => this.#state().showIpaDraft);
  }
  get ipaVariantLabelDraft(): Signal<string> {
    return computed(() => this.#state().ipaVariantLabelDraft);
  }
  get answerModesDraft(): Signal<readonly AnswerDisplayMode[]> {
    return computed(() => this.#state().answerModesDraft);
  }
  get toneColorEnabledDraft(): Signal<boolean> {
    return computed(() => this.#state().toneColorEnabledDraft);
  }
  get toneColorSchemeDraft(): Signal<ToneColorSchemeId> {
    return computed(() => this.#state().toneColorSchemeDraft);
  }
  get tracingStrokeDurationDraft(): Signal<number> {
    return computed(() => this.#state().tracingStrokeDurationDraft);
  }

  // Tab control
  get selectedTabIndex(): Signal<number> {
    return computed(() => this.#state().selectedTabIndex);
  }

  // --- Производные значения ---
  readonly languagePairInvalid = computed(
    () => this.#state().knownLanguageDraft === this.#state().learningLanguageDraft,
  );

  readonly settingsEntryLabel = computed(() => {
    const id = this.#state().settingsPairIdDraft;
    // Note: languagePairs should be injected or passed from UserStore
    // This will be resolved by the component
    return '';
  });

  readonly romanizationOptions = computed((): readonly RomanizationOption[] => {
    const options: RomanizationOption[] = [
      { value: 'pinyin', label: 'Пиньинь' },
      { value: 'zhuyin', label: 'Жуинь (Bopomofo)' },
    ];
    return options;
  });

  // --- Мутации — Course catalog ---
  setItems(items: readonly CourseIndexEntry[]): void {
    this.#state.update(s => ({ ...s, items }));
  }

  setTotalItems(total: number): void {
    this.#state.update(s => ({ ...s, totalItems: total }));
  }

  setPageIndex(page: number): void {
    this.#state.update(s => ({ ...s, pageIndex: page }));
  }

  setPageSize(size: number): void {
    this.#state.update(s => ({ ...s, pageSize: size }));
  }

  setLoading(loading: boolean): void {
    this.#state.update(s => ({ ...s, loading }));
  }

  setError(error: string | null): void {
    this.#state.update(s => ({ ...s, error }));
  }

  setProgressByCourseId(progress: Record<string, number>): void {
    this.#state.update(s => ({ ...s, progressByCourseId: progress }));
  }

  setCompletedCourseIds(completed: Set<string>): void {
    this.#state.update(s => ({ ...s, completedCourseIds: completed }));
  }

  // --- Мутации — Profile ---
  setNameDraft(name: string): void {
    this.#state.update(s => ({ ...s, nameDraft: name }));
  }

  setLearningProficiencyDraft(level: LearningProficiencyLevel): void {
    this.#state.update(s => ({ ...s, learningProficiencyDraft: level }));
  }

  setThemeDraft(theme: AppColorScheme): void {
    this.#state.update(s => ({ ...s, themeDraft: theme }));
  }

  setFontSizeDraft(size: UserPreferences['fontSize']): void {
    this.#state.update(s => ({ ...s, fontSizeDraft: size }));
  }

  setColorSchemeDraft(scheme: AppColorScheme): void {
    this.#state.update(s => ({ ...s, colorSchemeDraft: scheme }));
  }

  setCardFocusFullscreenDraft(enabled: boolean): void {
    this.#state.update(s => ({ ...s, cardFocusFullscreenDraft: enabled }));
  }

  // --- Мутации — Course tab ---
  setKnownLanguageDraft(lang: ContentLanguage): void {
    this.#state.update(s => ({ ...s, knownLanguageDraft: lang }));
  }

  setLearningLanguageDraft(lang: ContentLanguage): void {
    this.#state.update(s => ({ ...s, learningLanguageDraft: lang }));
  }

  // --- Мутации — Settings tab ---
  setSettingsPairIdDraft(id: string): void {
    this.#state.update(s => ({ ...s, settingsPairIdDraft: id }));
  }

  setDisplayRomanizationsDraft(romanizations: readonly RomanizationSystem[]): void {
    this.#state.update(s => ({ ...s, displayRomanizationsDraft: romanizations }));
  }

  setAnswerRomanizationsDraft(romanizations: readonly RomanizationSystem[]): void {
    this.#state.update(s => ({ ...s, answerRomanizationsDraft: romanizations }));
  }

  setShowIpaDraft(show: boolean): void {
    this.#state.update(s => ({ ...s, showIpaDraft: show }));
  }

  setIpaVariantLabelDraft(label: string): void {
    this.#state.update(s => ({ ...s, ipaVariantLabelDraft: label }));
  }

  setAnswerModesDraft(modes: readonly AnswerDisplayMode[]): void {
    this.#state.update(s => ({ ...s, answerModesDraft: modes }));
  }

  setToneColorEnabledDraft(enabled: boolean): void {
    this.#state.update(s => ({ ...s, toneColorEnabledDraft: enabled }));
  }

  setToneColorSchemeDraft(scheme: ToneColorSchemeId): void {
    this.#state.update(s => ({ ...s, toneColorSchemeDraft: scheme }));
  }

  setTracingStrokeDurationDraft(duration: number): void {
    this.#state.update(s => ({ ...s, tracingStrokeDurationDraft: duration }));
  }

  // --- Мутации — Tab control ---
  setSelectedTabIndex(index: number): void {
    this.#state.update(s => ({ ...s, selectedTabIndex: index }));
  }

  // --- Batch mutations ---
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
  onPageChange(event: PageEvent): void {
    this.#state.update(s => ({
      ...s,
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
    }));
  }
}
