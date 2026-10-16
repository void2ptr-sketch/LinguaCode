import { Injectable, computed, signal, effect, inject, untracked } from '@angular/core';
import type { CardDifficulty } from '../../../entities/card/model';

import type { CourseWithLessons } from '../../../entities/course/model';
import type { LessonPickPayload } from '../../../entities/lesson/ui/lesson-picker';
import { CardSearchService } from '../../../entities/card';
import {
  collectCourseScenarioIds,
  filterScenarioIdsByDifficulty,
  buildScenarioDifficultyMap,
  resolveCoursePracticeSettings,
  isOpenPracticeCourse,
  CourseSearchService,
} from '../../../entities/course';
import { ScenarioSearchService } from '../../../entities/scenario';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { UserStore } from '../../../entities/user/model/user.store';

/** Tab indices for the learning flow: course → lessons → scenarios → learning. */
export const LEARNING_TAB = {
  course: 0,
  lessons: 1,
  scenarios: 2,
  learning: 3,
} as const;

/**
 * Service managing the card selection flow state.
 *
 * @remarks
 * Encapsulates all flow-related signals, computed values, and business logic
 * for the card-select page. The page component delegates to this service.
 */
@Injectable({ providedIn: 'root' })
export class CardSelectFlowService {
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly cardSearchService = inject(CardSearchService);
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly logger = inject(AppLoggerService);
  private readonly userStore = inject(UserStore);

  // ─── Persistence effect ────────────────────────────────────────────────

  /**
   * Syncs learning session state to UserStore when flow signals change.
   *
   * @remarks
   * Uses `untracked` + `queueMicrotask` to avoid the Angular rule:
   * "cannot write to signals inside an effect". Direct calls to
   * `this.userStore.updateLearningSession()` inside the effect body would
   * trigger `untracked` warnings or infinite loops.
   *
   * `queueMicrotask` defers the write to the next microtask, breaking the
   * signal-read → effect-trigger cycle. This is an intentional workaround —
   * the persistence is eventually consistent, not synchronous.
   *
   * Limitations: no error handling for localStorage writes; the microtask
   * may run after the service is destroyed (harmless — UserStore handles it).
   * If strict synchronous persistence is needed, move `updateLearningSession`
   * calls into each mutator method instead of using an effect.
   */
  private readonly persistSessionEffect = effect(() => {
    const courseId = this.selectedCourseId();
    const lessonId = this.selectedLessonId();
    const scenarioId = this.selectedScenarioId();

    untracked(() => {
      queueMicrotask(() => {
        this.userStore.updateLearningSession({
          ...(courseId ? { activeCourseId: courseId } : {}),
          ...(lessonId ? { lastLessonId: lessonId } : {}),
          ...(scenarioId ? { lastScenarioId: scenarioId } : {}),
        });
      });
    });
  });

  // ─── User preferences ────────────────────────────────────────────────

  /** Font size preference from user settings. */
  readonly fontSize = inject(UserStore).preferences;

  /**
   * Resets session state when the active language pair changes.
   *
   * @remarks
   * This effect lives in a `providedIn: 'root'` service, so it is always
   * active for the entire application lifetime — not just when the
   * card-select page is open. This is intentional: it enables **global
   * session resume**. When the user switches language pairs anywhere in the
   * app (e.g. from the header switcher), the flow state is reset so that
   * the next time the user opens the card-select page, they start fresh
   * with the correct language pair.
   *
   * Behavior change vs. previous implementation: previously the reset was
   * a page-level method called only from the page component. Now it fires
   * globally, which means the reset happens even if the page is not mounted.
   * The effect itself is harmless when the page is not open (signals just
   * read and compare — no side effects in the untracked branch).
   */
  private readonly resetOnActivePairChange = effect(() => {
    const activeId = this.userStore.activeLanguagePairId();
    if (this._lastKnownActiveLanguagePairId !== null && this._lastKnownActiveLanguagePairId !== activeId) {
      untracked(() => this.resetAll());
    }
    this._lastKnownActiveLanguagePairId = activeId;
  });

  private _lastKnownActiveLanguagePairId: string | null = null;

  // ─── Flow state signals ────────────────────────────────────────────────

  /** Selected course ID (empty string means none selected). */
  readonly selectedCourseId = signal<string>('');

  /** Selected lesson ID within the current course. */
  readonly selectedLessonId = signal<string>('');

  /** The currently loaded course with its lessons. */
  readonly currentCourse = signal<CourseWithLessons | null>(null);

  /** Selected difficulty filter (null = no filter). */
  readonly selectedDifficulty = signal<CardDifficulty | null>(null);

  /** Map of scenario IDs to their difficulty levels. */
  readonly scenarioDifficultyMap = signal<ReadonlyMap<string, CardDifficulty>>(new Map());

  /** Display title for the selected course. */
  readonly courseTitle = signal<string>('');

  /** Display title for the selected lesson. */
  readonly lessonTitle = signal<string>('');

  /** Scenario IDs belonging to the selected lesson. */
  readonly lessonScenarioIds = signal<readonly string[]>([]);

  /** Lessons with their scenario IDs for the current course. */
  readonly courseLessons = signal<readonly { lessonId: string; scenarioIds: readonly string[] }[]>([]);

  /** Selected scenario ID within the current lesson. */
  readonly selectedScenarioId = signal<string>('');

  /** Display title for the selected scenario. */
  readonly scenarioTitle = signal<string>('');

  /** Source label for the scenario (e.g., '10 cards', 'up to 50 by criteria'). */
  readonly scenarioSourceLabel = signal<string>('');

  /** Warning message when some cards are missing from the scenario. */
  readonly missingCardsWarning = signal<string | null>(null);

  /** Currently active tab index in the learning flow (0=course, 1=lessons, 2=scenarios, 3=learning). */
  readonly activeTabIndex = signal<number>(LEARNING_TAB.course);

  // ─── Computed values ──────────────────────────────────────────────────

  /** Whether the current course allows open practice (no lesson selection required). */
  readonly isOpenPractice = computed(() => isOpenPracticeCourse(this.currentCourse()));

  /** Whether to show the difficulty filter UI. */
  readonly showDifficultyFilter = computed(
    () => this.practiceSettings().allowDifficultyFilter === true && !!this.selectedCourseId(),
  );

  /** Whether lesson prerequisites must be enforced. */
  readonly enforceLessonPrerequisites = computed(
    () => this.practiceSettings().enforceLessonPrerequisites !== false,
  );

  /** Whether a lesson must be selected before scenarios can be chosen. */
  readonly requiresLessonForScenarios = computed(() => {
    if (!this.selectedCourseId()) {
      return false;
    }
    return this.practiceSettings().requireLessonForScenarios !== false;
  });

  /** Computed practice settings derived from the current course configuration. */
  readonly practiceSettings = computed(() => resolveCoursePracticeSettings(this.currentCourse()));

  /**
   * Computed list of scenario IDs available for the picker.
   *
   * @remarks
   * Filters scenarios by selected lesson, course (open practice), and difficulty.
   * Returns `null` when no scenarios are available.
   */
  readonly allowedScenarioIdsForPicker = computed(() => {
    const lessonIds = this.lessonScenarioIds();
    const course = this.currentCourse();
    const difficulty = this.selectedDifficulty();
    const difficultyMap = this.scenarioDifficultyMap();

    const base: readonly string[] | null =
      lessonIds.length > 0
        ? lessonIds
        : course && this.isOpenPractice()
          ? collectCourseScenarioIds(course)
          : null;

    if (!base || base.length === 0) {
      return null;
    }

    return filterScenarioIdsByDifficulty(base, difficultyMap, difficulty);
  });

  /** Whether there is a next scenario in the current lesson. */
  readonly hasNextLessonScenario = computed(() => {
    const ids = this.lessonScenarioIds();
    const current = this.selectedScenarioId();
    const index = ids.indexOf(current);
    return index >= 0 && index < ids.length - 1;
  });

  /** Whether a course is selected (enables advancement to lessons/scenarios). */
  readonly canAdvanceFromCourse = computed(() => !!this.selectedCourseId());

  /** Whether a lesson is selected (enables advancement to scenarios). */
  readonly canAdvanceFromLessons = computed(() => !!this.selectedLessonId());

  /** Whether a scenario is selected (enables starting practice). */
  readonly canStartPractice = computed(() => !!this.selectedScenarioId());

  /**
   * Computed hint text for the current step.
   *
   * @remarks
   * Provides guidance on what the user should do next based on the active tab.
   */
  readonly nextStepHint = computed(() => {
    switch (this.activeTabIndex()) {
      case LEARNING_TAB.course:
        if (!this.canAdvanceFromCourse()) {
          return 'Выберите программу, чтобы продолжить';
        }
        return this.isOpenPractice() && !this.requiresLessonForScenarios()
          ? 'Перейдите к сценариям или выберите урок для фильтрации'
          : 'Перейдите к выбору урока';
      case LEARNING_TAB.lessons:
        return this.canAdvanceFromLessons()
          ? 'Перейдите к выбору сценария'
          : 'Выберите урок, чтобы продолжить';
      case LEARNING_TAB.scenarios:
        return this.canStartPractice()
          ? 'Запустите прохождение карточек'
          : 'Выберите сценарий, чтобы начать практику';
      default:
        return '';
    }
  });

  // ─── Methods ──────────────────────────────────────────────────────────

  /**
   * Loads a course by ID and updates flow state.
   *
   * @param courseId - The course ID to load.
   */
  async loadCourse(courseId: string): Promise<void> {
    this.selectedCourseId.set(courseId);
    this.selectedLessonId.set('');
    this.currentCourse.set(null);
    this.selectedDifficulty.set(null);
    this.scenarioDifficultyMap.set(new Map());
    this.lessonTitle.set('');
    this.lessonScenarioIds.set([]);
    this.courseLessons.set([]);
    this.selectedScenarioId.set('');
    this.scenarioTitle.set('');
    this.scenarioSourceLabel.set('');
    this.missingCardsWarning.set(null);
    this.activeTabIndex.set(LEARNING_TAB.course);

    try {
      const course = await this.courseSearchService.getById(courseId);
      this.currentCourse.set(course);
      this.courseTitle.set(course.title);
      this.courseLessons.set(
        course.lessons.map((lesson) => ({
          lessonId: lesson.id,
          scenarioIds: lesson.scenarioIds,
        })),
      );
      await this.loadScenarioDifficultyMap(course);
    } catch (error) {
      this.logger.warn('CardSelect: failed to load course', error);
      // Reset courseId on failure so the lessons tab doesn't appear available
      // without an actual course loaded.
      this.selectedCourseId.set('');
      this.courseTitle.set('');
      this.currentCourse.set(null);
    }
  }

  /**
   * Resets course state without loading a new course.
   */
  resetCourseState(): void {
    this.selectedCourseId.set('');
    this.selectedLessonId.set('');
    this.currentCourse.set(null);
    this.selectedDifficulty.set(null);
    this.scenarioDifficultyMap.set(new Map());
    this.courseTitle.set('');
    this.lessonTitle.set('');
    this.lessonScenarioIds.set([]);
    this.courseLessons.set([]);
    this.selectedScenarioId.set('');
    this.scenarioTitle.set('');
    this.scenarioSourceLabel.set('');
    this.missingCardsWarning.set(null);
    this.activeTabIndex.set(LEARNING_TAB.course);
  }

  /**
   * Applies a lesson from a deep link (lessonId query parameter).
   *
   * @remarks
   * Reads the course from `currentCourse()` to avoid a duplicate HTTP request
   * when called right after `loadCourse()` in `ngOnInit`.
   *
   * @param lessonId - The lesson ID to apply.
   */
  async applyLessonFromCourse(lessonId: string): Promise<void> {
    const courseId = this.selectedCourseId();
    if (!courseId) {
      return;
    }

    // Reuse the already-loaded course to avoid a second HTTP call.
    const course = this.currentCourse();
    if (!course) {
      return;
    }

    const lesson = course.lessons.find((item) => item.id === lessonId);
    if (!lesson) {
      return;
    }

    this.selectedLessonId.set(lesson.id);
    this.lessonTitle.set(lesson.title);
    this.lessonScenarioIds.set(lesson.scenarioIds);
  }

  /**
   * Sets the active tab index.
   *
   * @param tabIndex - Target tab index (0=course, 1=lessons, 2=scenarios, 3=learning).
   */
  setActiveTab(tabIndex: number): void {
    this.activeTabIndex.set(tabIndex);
  }

  /**
   * Sets course title extracted from a picker label.
   *
   * @param label - The raw label string (may contain " · " separators).
   */
  setCourseTitleFromLabel(label: string): void {
    this.courseTitle.set(this.extractCourseTitle(label));
  }

  /**
   * Sets scenario source label extracted from a picker label.
   *
   * @param label - The raw label string (may contain " · " separators).
   */
  setScenarioSourceLabelFromPicker(label: string): void {
    this.scenarioSourceLabel.set(this.extractScenarioSourceLabel(label));
  }

  /**
   * Clears the missing cards warning.
   */
  clearMissingCardsWarning(): void {
    this.missingCardsWarning.set(null);
  }

  /**
   * Handles lesson selection change.
   *
   * @param lessonId - The selected lesson ID.
   */
  onLessonChange(lessonId: string): void {
    this.selectedLessonId.set(lessonId);
    this.selectedScenarioId.set('');
    this.scenarioTitle.set('');
    this.scenarioSourceLabel.set('');
    if (!lessonId) {
      this.lessonTitle.set('');
      this.lessonScenarioIds.set([]);
    }
  }

  /**
   * Handles lesson pick event from picker component.
   *
   * @param payload - The picked lesson's title and scenario IDs.
   */
  onLessonPick(payload: LessonPickPayload): void {
    this.lessonTitle.set(payload.title);
    this.lessonScenarioIds.set(payload.scenarioIds);
  }

  /**
   * Handles scenario selection change.
   *
   * @param scenarioId - The selected scenario ID (empty string to deselect).
   */
  onScenarioChange(scenarioId: string): void {
    this.selectedScenarioId.set(scenarioId);
    if (!scenarioId) {
      this.scenarioTitle.set('');
      this.scenarioSourceLabel.set('');
      this.missingCardsWarning.set(null);
      return;
    }
  }

  /**
   * Sets scenario metadata after cards are loaded.
   *
   * @param scenarioTitle - The scenario title.
   * @param scenarioSourceLabel - The source label (e.g., '10 cards').
   * @param missingCardIds - IDs of cards that could not be resolved.
   */
  setScenarioMetadata(scenarioTitle: string, scenarioSourceLabel: string, missingCardIds: readonly string[]): void {
    this.scenarioTitle.set(scenarioTitle);
    this.scenarioSourceLabel.set(scenarioSourceLabel);
    if (missingCardIds.length > 0) {
      this.missingCardsWarning.set(
        `В сценарии отсутствуют карточки: ${missingCardIds.join(', ')}`,
      );
    } else {
      this.missingCardsWarning.set(null);
    }
  }

  /**
   * Handles difficulty filter change.
   *
   * @param value - Selected difficulty level (null to clear filter).
   */
  onDifficultyChange(value: CardDifficulty | null): void {
    this.selectedDifficulty.set(value);
    this.selectedScenarioId.set('');
    this.scenarioTitle.set('');
    this.scenarioSourceLabel.set('');
  }

  /**
   * Extracts course title from a picker label with separator.
   *
   * @param label - The raw label string (may contain " · " separators).
   */
  extractCourseTitle(label: string): string {
    return label.split(' · ')[0] ?? label;
  }

  /**
   * Extracts scenario source label from a picker label with separator.
   *
   * @param label - The raw label string (may contain " · " separators).
   */
  extractScenarioSourceLabel(label: string): string {
    return label.split(' · ').slice(1).join(' · ') || label;
  }

  /**
   * Navigates to the specified tab.
   *
   * @param tabIndex - Target tab index (0=course, 1=lessons, 2=scenarios, 3=learning).
   */
  goToTab(tabIndex: number): void {
    if (tabIndex === LEARNING_TAB.lessons && !this.selectedCourseId()) {
      return;
    }
    if (tabIndex === LEARNING_TAB.learning && !this.selectedScenarioId()) {
      return;
    }
    this.activeTabIndex.set(tabIndex);
  }

  /**
   * Advances to the next step in the learning flow.
   */
  advanceFromCurrentTab(): void {
    const current = this.activeTabIndex();

    if (current === LEARNING_TAB.scenarios) {
      this.startPractice();
      return;
    }

    if (current === LEARNING_TAB.course && this.canAdvanceFromCourse()) {
      if (this.isOpenPractice() && !this.requiresLessonForScenarios()) {
        this.activeTabIndex.set(LEARNING_TAB.scenarios);
      } else {
        this.activeTabIndex.set(LEARNING_TAB.lessons);
      }
      return;
    }

    if (current === LEARNING_TAB.lessons && this.canAdvanceFromLessons()) {
      this.activeTabIndex.set(LEARNING_TAB.scenarios);
    }
  }

  /**
   * Starts the practice session (navigates to the learning tab).
   */
  startPractice(): void {
    if (!this.canStartPractice()) {
      return;
    }
    this.activeTabIndex.set(LEARNING_TAB.learning);
  }

  /**
   * Advances to the next scenario in the current lesson.
   *
   * @returns The next scenario ID, or `null` if there is no next scenario.
   */
  goToNextLessonScenario(): string | null {
    const ids = this.lessonScenarioIds();
    const index = ids.indexOf(this.selectedScenarioId());
    if (index < 0 || index >= ids.length - 1) {
      return null;
    }
    this.activeTabIndex.set(LEARNING_TAB.learning);
    return ids[index + 1];
  }

  /**
   * Resets all flow state to initial values.
   *
   * @remarks
   * Delegates to `resetCourseState()` — the two methods were merged because
   * they became semantically identical after the refactoring.
   */
  resetAll(): void {
    this.resetCourseState();
  }

  // ─── Private helpers ──────────────────────────────────────────────────

  private async loadScenarioDifficultyMap(course: CourseWithLessons): Promise<void> {
    if (!resolveCoursePracticeSettings(course).allowDifficultyFilter) {
      this.scenarioDifficultyMap.set(new Map());
      return;
    }

    await this.cardSearchService.ensureIndexLoaded();
    const scenarioIds = collectCourseScenarioIds(course);
    const scenarios = await Promise.all(
      scenarioIds.map((scenarioId) => this.scenarioSearchService.getById(scenarioId)),
    );
    this.scenarioDifficultyMap.set(
      buildScenarioDifficultyMap(scenarios, this.cardSearchService.indexEntries()),
    );
  }
}
