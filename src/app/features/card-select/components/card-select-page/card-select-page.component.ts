import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

import type { CardDirection } from '../../../../core/models/language-pair.types';
import type { CardDifficulty } from '../../../../core/models/card-index.types';
import type { CourseWithLessons } from '../../../../core/models';
import { cardSupportsSessionDirection } from '../../../../core/data/cards/card-direction.utils';
import {
  CardSearchService,
  collectCourseScenarioIds,
  filterScenarioIdsByDifficulty,
  buildScenarioDifficultyMap,
  resolveCoursePracticeSettings,
  isOpenPracticeCourse,
  CourseSearchService,
  ScenarioSearchService,
} from '../../../../core/data';

import { CardHostComponent } from '../../../../shared/ui/card-host';
import { DIFFICULTY_LABELS } from '../../../../shared/constants';
import type { DrawAnswerPayload } from '../../../../shared/types/draw-answer.types';
import { CoursePickerComponent } from '../../../../shared/ui/course-picker';
import { LessonPickerComponent, type LessonPickPayload } from '../../../../shared/ui/lesson-picker';
import { ScenarioPickerComponent } from '../../../../shared/ui/scenario-picker';
import { LearningResultsStore, UserStore } from '../../../../core/state';
import { CardSelectService } from '../../services/card-select.service';
import { CardSelectStore } from '../../services/card-select.store';
import {
  PracticeSessionBarComponent,
  type PracticeSessionSegment,
} from '../practice-session-bar/practice-session-bar.component';
import {
  PracticeStepperComponent,
  type PracticeStepState,
} from '../practice-stepper/practice-stepper.component';

/** Tab indices for the learning flow: course → lessons → scenarios → learning. */
const LEARNING_TAB = {
  course: 0,
  lessons: 1,
  scenarios: 2,
  learning: 3,
} as const;

/** Tracks the last known active language pair to reset state on change. */
let lastKnownActiveLanguagePairId: string | null = null;

/**
 * Page component for card-based learning sessions.
 *
 * @remarks
 * Implements a four-step learning flow:
 * 1. Select a course (program)
 * 2. Select a lesson within the course
 * 3. Select a scenario within the lesson
 * 4. Practice cards from the scenario
 *
 * Supports deep linking via query parameters (courseId, lessonId, scenarioId, tab, difficulty).
 * Tracks learning progress through `LearningResultsStore` and persists session state via `UserStore`.
 *
 * @see CardSelectService
 * @see CardSelectStore
 * @see PracticeStepperComponent
 */
@Component({
  standalone: true,
  selector: 'app-card-select-page',
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    CardHostComponent,
    CoursePickerComponent,
    LessonPickerComponent,
    ScenarioPickerComponent,
    PracticeSessionBarComponent,
    PracticeStepperComponent,
  ],
  templateUrl: './card-select-page.component.html',
  styleUrl: './card-select-page.component.scss',
})
export class CardSelectPageComponent implements OnInit {
  /** Service for loading card selection sessions from scenarios. */
  private readonly cardSelectService = inject(CardSelectService);

  /** Stores learning results and progress. */
  private readonly resultsStore = inject(LearningResultsStore);

  /** User preferences and language pair settings. */
  private readonly userStore = inject(UserStore);

  /** Searches and loads courses. */
  private readonly courseSearchService = inject(CourseSearchService);

  /** Searches and indexes cards. */
  private readonly cardSearchService = inject(CardSearchService);

  /** Searches and loads scenarios. */
  private readonly scenarioSearchService = inject(ScenarioSearchService);

  /** Route query parameters for deep linking. */
  private readonly route = inject(ActivatedRoute);

  /** Local state store for the practice session. */
  readonly store = inject(CardSelectStore);

  /** Labels for difficulty levels (beginner, intermediate, advanced). */
  readonly difficultyLabels = DIFFICULTY_LABELS;

  /** Available difficulty levels. */
  readonly difficultyLevels: readonly CardDifficulty[] = ['beginner', 'intermediate', 'advanced'];

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
  readonly courseLessons = signal<readonly { lessonId: string; scenarioIds: readonly string[] }[]>(
    [],
  );

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

  /**
   * Computed practice settings derived from the current course configuration.
   */
  readonly practiceSettings = computed(() => resolveCoursePracticeSettings(this.currentCourse()));

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

  /** Whether all lessons/scenarios in the course are completed. */
  readonly courseCompleted = computed(() => {
    const lessons = this.courseLessons();
    if (lessons.length === 0) {
      return false;
    }

    return this.resultsStore.isCourseCompleted(
      lessons.map((lesson) => ({ scenarioIds: lesson.scenarioIds })),
    );
  });

  /** Whether to show the course certificate badge. */
  readonly showCourseCertificate = computed(
    () => this.store.completed() && this.selectedCourseId() !== '' && this.courseCompleted(),
  );

  /** Whether there is a next scenario in the current lesson. */
  readonly hasNextLessonScenario = computed(() => {
    const ids = this.lessonScenarioIds();
    const current = this.selectedScenarioId();
    const index = ids.indexOf(current);
    return index >= 0 && index < ids.length - 1;
  });

  /** Computed progress percentage through the current card session. */
  readonly cardProgressPercent = computed(() => {
    const total = this.store.cards().length;
    if (total === 0) {
      return 0;
    }

    return Math.round(((this.store.currentIndex() + 1) / total) * 100);
  });

  /** Whether the current card supports direction toggle (known→learning / learning→known). */
  readonly showDirectionToggle = computed(() =>
    cardSupportsSessionDirection(this.store.currentCard()),
  );

  /**
   * Computed session segments for the practice session bar.
   *
   * @remarks
   * Each segment represents a step in the learning flow: course → lesson → scenario.
   */
  readonly sessionSegments = computed((): readonly PracticeSessionSegment[] => {
    const courseId = this.selectedCourseId();
    const lessonId = this.selectedLessonId();
    const scenarioId = this.selectedScenarioId();

    return [
      {
        tabIndex: LEARNING_TAB.course,
        label: 'Программа',
        value: courseId ? this.courseTitle() || 'Выбранная программа' : null,
        placeholder: 'Программа не выбрана',
        completed: !!courseId,
        locked: false,
      },
      {
        tabIndex: LEARNING_TAB.lessons,
        label: 'Урок',
        value: lessonId ? this.lessonTitle() || 'Выбранный урок' : null,
        placeholder: 'Урок не выбран',
        completed: !!lessonId,
        locked: !courseId,
        lockReason: 'Сначала выберите программу',
      },
      {
        tabIndex: LEARNING_TAB.scenarios,
        label: 'Сценарий',
        value: scenarioId ? this.scenarioTitle() || 'Выбранный сценарий' : null,
        placeholder: 'Сценарий не выбран',
        completed: !!scenarioId,
        locked: false,
      },
    ];
  });

  /**
   * Computed practice steps for the stepper UI.
   *
   * @remarks
   * Includes the learning tab as the final step (cards practice).
   */
  readonly practiceSteps = computed((): readonly PracticeStepState[] => {
    const active = this.activeTabIndex();
    const courseId = this.selectedCourseId();
    const lessonId = this.selectedLessonId();
    const scenarioId = this.selectedScenarioId();

    return [
      {
        index: LEARNING_TAB.course,
        label: 'Программа',
        done: !!courseId,
        current: active === LEARNING_TAB.course,
        locked: false,
      },
      {
        index: LEARNING_TAB.lessons,
        label: 'Урок',
        done: !!lessonId,
        current: active === LEARNING_TAB.lessons,
        locked: !courseId,
      },
      {
        index: LEARNING_TAB.scenarios,
        label: 'Сценарий',
        done: !!scenarioId,
        current: active === LEARNING_TAB.scenarios,
        locked: false,
      },
      {
        index: LEARNING_TAB.learning,
        label: 'Обучение',
        done: false,
        current: active === LEARNING_TAB.learning,
        locked: !scenarioId,
      },
    ];
  });

  /** Whether a course is selected (enables advancement to lessons/scenarios). */
  readonly canAdvanceFromCourse = computed(() => !!this.selectedCourseId());

  /** Whether a lesson is selected (enables advancement to scenarios). */
  readonly canAdvanceFromLessons = computed(() => !!this.selectedLessonId());

  /** Whether a scenario is selected (enables starting practice). */
  readonly canStartPractice = computed(() => !!this.selectedScenarioId());

  /** Whether the learning tab (cards practice) is currently active. */
  readonly isLearningTabActive = computed(() => this.activeTabIndex() === LEARNING_TAB.learning);

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

  /**
   * Font size preference from the user store.
   * @remarks
   * Bound directly to user preferences — no getter needed since it's used as a signal in the template.
   */
  readonly fontSize = this.userStore.preferences;

  /**
   * Effect that resets session state when the active language pair changes.
   *
   * @remarks
   * Prevents stale course/lesson/scenario selections when switching language pairs.
   * Compares the current active language pair ID with the last known ID.
   */
  private readonly resetOnActivePairChange = effect(() => {
    const activeId = this.userStore.activeLanguagePairId();

    if (lastKnownActiveLanguagePairId !== null && lastKnownActiveLanguagePairId !== activeId) {
      this.resetSessionState();
    }

    lastKnownActiveLanguagePairId = activeId;
  });

  /**
   * Initializes the component from route query parameters.
   *
   * @remarks
   * Supports deep linking via query parameters:
   * - `courseId` — pre-select a course
   * - `lessonId` — pre-select a lesson within the course
   * - `scenarioId` — pre-select a scenario and open learning tab
   * - `tab` — set initial tab (course, lessons, scenarios, learning)
   * - `difficulty` — set difficulty filter (beginner, intermediate, advanced)
   */
  async ngOnInit(): Promise<void> {
    const query = this.route.snapshot.queryParamMap;
    const courseId = query.get('courseId');
    const lessonId = query.get('lessonId');
    const scenarioId = query.get('scenarioId');
    const tab = query.get('tab');

    if (courseId) {
      await this.onCourseChange(courseId);
    }

    if (lessonId) {
      await this.applyLessonFromCourse(lessonId);
    }

    if (scenarioId) {
      await this.onScenarioChange(scenarioId);
    }

    const difficulty = query.get('difficulty');
    if (difficulty === 'beginner' || difficulty === 'intermediate' || difficulty === 'advanced') {
      this.selectedDifficulty.set(difficulty);
    }

    if (tab === 'learning' && scenarioId) {
      this.activeTabIndex.set(LEARNING_TAB.learning);
    } else if (tab === 'scenarios') {
      this.activeTabIndex.set(LEARNING_TAB.scenarios);
    } else if (tab === 'lessons' && courseId) {
      this.activeTabIndex.set(LEARNING_TAB.lessons);
    } else     if (tab === 'course') {
      this.activeTabIndex.set(LEARNING_TAB.course);
    }

    // Если scenarioId передан из карты обучения — сразу открыть вкладку обучения
    if (scenarioId) {
      this.activeTabIndex.set(LEARNING_TAB.learning);
    }
  }

  /**
   * Applies a lesson from a deep link (lessonId query parameter).
   *
   * @param lessonId - The lesson ID to apply.
   * @remarks
   * Loads the lesson from the current course and sets title + scenario IDs.
   * Silently ignores if the course is not loaded or the lesson is not found.
   */
  private async applyLessonFromCourse(lessonId: string): Promise<void> {
    const courseId = this.selectedCourseId();
    if (!courseId) {
      return;
    }

    try {
      const course = await this.courseSearchService.getById(courseId);
      const lesson = course.lessons.find((item) => item.id === lessonId);
      if (!lesson) {
        return;
      }

      this.selectedLessonId.set(lesson.id);
      this.lessonTitle.set(lesson.title);
      this.lessonScenarioIds.set(lesson.scenarioIds);
    } catch {
      // ignore invalid deep link
    }
  }

  /**
   * Persists learning session state to the user store.
   *
   * @param patch - Partial patch of learning session settings.
   * @remarks
   * Uses `queueMicrotask` to defer persistence until after change detection.
   */
  private persistLearningSession(
    patch: Partial<{ activeCourseId: string; lastLessonId: string; lastScenarioId: string }>,
  ): void {
    queueMicrotask(() => {
      this.userStore.updateLearningSession(patch);
    });
  }

  /**
   * Resets all session state to initial values.
   *
   * @remarks
   * Called when the language pair changes or when deselecting items.
   */
  private resetSessionState(): void {
    this.store.reset();
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
   * Navigates to the specified tab.
   *
   * @param tabIndex - Target tab index (0=course, 1=lessons, 2=scenarios, 3=learning).
   * @remarks
   * Prevents navigation to lessons without a course, and to learning without a scenario.
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
   *
   * @remarks
   * From course tab: moves to lessons (or scenarios for open practice).
   * From lessons tab: moves to scenarios.
   * From scenarios tab: starts practice.
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
   *
   * @remarks
   * Requires a scenario to be selected.
   */
  startPractice(): void {
    if (!this.canStartPractice()) {
      return;
    }

    this.activeTabIndex.set(LEARNING_TAB.learning);
  }

  /**
   * Handles course selection changes.
   *
   * @param courseId - The selected course ID (empty string to deselect).
   * @remarks
   * Resets lesson, scenario, and card state. Loads course details and difficulty map.
   * Persists the active course ID to user settings.
   */
  async onCourseChange(courseId: string): Promise<void> {
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
    this.store.reset();
    this.missingCardsWarning.set(null);

    if (courseId) {
      this.persistLearningSession({
        activeCourseId: courseId,
        lastLessonId: '',
        lastScenarioId: '',
      });

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
      } catch {
        this.courseTitle.set('');
        this.currentCourse.set(null);
      }
    } else {
      this.courseTitle.set('');
      this.activeTabIndex.set(LEARNING_TAB.course);
      this.persistLearningSession({
        activeCourseId: '',
        lastLessonId: '',
        lastScenarioId: '',
      });
    }
  }

  /**
   * Updates the course title display from the picker label.
   *
   * @param label - The raw label string from the picker (may contain " · " separators).
   * @remarks
   * Strips the second part after " · " to show only the course title.
   */
  onCourseLabelChange(label: string): void {
    this.courseTitle.set(label.split(' · ')[0] ?? label);
  }

  /**
   * Handles lesson selection changes.
   *
   * @param lessonId - The selected lesson ID.
   * @remarks
   * Resets scenario and card state. Does not load lesson details eagerly —
   * title and scenario IDs come from `onLessonPick`.
   */
  async onLessonChange(lessonId: string): Promise<void> {
    this.selectedLessonId.set(lessonId);
    this.selectedScenarioId.set('');
    this.scenarioTitle.set('');
    this.scenarioSourceLabel.set('');
    this.store.reset();
    this.missingCardsWarning.set(null);
  }

  /**
   * Handles lesson pick from the picker component.
   *
   * @param payload - The picked lesson's title and scenario IDs.
   * @remarks
   * Persists the last lesson ID to user settings.
   */
  async onLessonPick(payload: LessonPickPayload): Promise<void> {
    this.lessonTitle.set(payload.title);
    this.lessonScenarioIds.set(payload.scenarioIds);
    this.persistLearningSession({ lastLessonId: payload.lessonId });
  }

  /**
   * Loads cards for the selected scenario.
   *
   * @remarks
   * Calls `CardSelectService.loadScenario` to resolve the card session.
   * Shows a warning if some cards are missing.
   */
  async loadCards(): Promise<void> {
    const scenarioId = this.selectedScenarioId();
    if (!scenarioId) {
      return;
    }

    this.store.reset();
    this.store.setLoading(true);
    this.missingCardsWarning.set(null);

    try {
      const session = await this.cardSelectService.loadScenario(scenarioId);
      this.scenarioTitle.set(session.scenarioTitle);
      this.scenarioSourceLabel.set(session.scenarioSourceLabel);
      this.store.setScenario(session.scenarioId, session.cards);

      if (session.missingCardIds.length > 0) {
        this.missingCardsWarning.set(
          `В сценарии отсутствуют карточки: ${session.missingCardIds.join(', ')}`,
        );
      }
    } catch {
      this.store.setError('Не удалось загрузить карточки сценария');
    }
  }

  /**
   * Handles scenario selection changes.
   *
   * @param scenarioId - The selected scenario ID (empty string to deselect).
   * @remarks
   * Loads cards if a scenario is selected. Persists last scenario ID to user settings.
   */
  async onScenarioChange(scenarioId: string): Promise<void> {
    this.selectedScenarioId.set(scenarioId);

    if (!scenarioId) {
      this.store.reset();
      this.scenarioTitle.set('');
      this.scenarioSourceLabel.set('');
      this.missingCardsWarning.set(null);
      return;
    }

    await this.loadCards();

    this.persistLearningSession({
      ...(this.selectedCourseId() ? { activeCourseId: this.selectedCourseId() } : {}),
      ...(this.selectedLessonId() ? { lastLessonId: this.selectedLessonId() } : {}),
      lastScenarioId: scenarioId,
    });
  }

  /**
   * Updates the scenario source label display from the picker label.
   *
   * @param label - The raw label string from the picker (may contain " · " separators).
   * @remarks
   * Extracts the second part after " · " to show the source description (e.g., "10 cards").
   */
  onScenarioLabelChange(label: string): void {
    this.scenarioSourceLabel.set(label.split(' · ').slice(1).join(' · ') || label);
  }

  /**
   * Handles difficulty filter changes.
   *
   * @param value - Selected difficulty level (null to clear filter).
   * @remarks
   * Resets scenario selection and card state when difficulty changes.
   */
  onDifficultyChange(value: CardDifficulty | null): void {
    this.selectedDifficulty.set(value);
    this.selectedScenarioId.set('');
    this.scenarioTitle.set('');
    this.scenarioSourceLabel.set('');
    this.store.reset();
    this.missingCardsWarning.set(null);
  }

  /**
   * Loads the scenario-to-difficulty map for a course.
   *
   * @param course - The course to load difficulty data for.
   * @remarks
   * Only loads when the course allows difficulty filtering.
   * Requires the card search index to be loaded first.
   */
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

  /**
   * Delegates option selection to the store.
   *
   * @param index - Zero-based index of the selected option.
   */
  selectOption(index: number): void {
    this.store.selectOption(index);
  }

  /**
   * Delegates answer text update to the store.
   *
   * @param value - The entered answer text.
   */
  setAnswerText(value: string): void {
    this.store.setAnswerText(value);
  }

  /**
   * Delegates memory card completion to the store.
   *
   * @param value - Whether the memory exercise is complete.
   */
  setMemoryComplete(value: boolean): void {
    this.store.setMemoryComplete(value);
  }

  /**
   * Delegates draw card submission to the store.
   *
   * @param value - Whether the draw submission has been triggered.
   */
  setDrawSubmitted(value: boolean): void {
    this.store.setDrawSubmitted(value);
  }

  /**
   * Delegates draw answer payload to the store.
   *
   * @param payload - The draw answer payload (strokes, timing).
   */
  setDrawAnswer(payload: DrawAnswerPayload | null): void {
    this.store.setDrawAnswer(payload);
  }

  /**
   * Delegates the time-expired event to the store.
   *
   * @remarks
   * Marks the current card as incorrect when time runs out.
   * Only applies to timed cards; no-op for other card types.
   */
  handleTimeExpired(): void {
    this.store.handleTimeExpired();
  }

  /**
   * Delegates direction change to the store.
   *
   * @param direction - The new card direction.
   */
  onDirectionChange(direction: CardDirection): void {
    this.store.setSessionDirection(direction);
  }

  /**
   * Checks the current answer and records the result.
   *
   * @remarks
   * Calls `store.checkAnswer()` to validate. On correct/incorrect answer,
   * records the result in `LearningResultsStore` and persists learning session state.
   */
  checkAnswer(): void {
    const card = this.store.currentCard();
    const isCorrect = this.store.checkAnswer();

    if (!card || isCorrect === null) {
      return;
    }

    this.resultsStore.addResult({
      id: crypto.randomUUID(),
      userId: this.userStore.user().id,
      cardId: card.id,
      scenarioId: this.store.scenarioId(),
      correct: isCorrect,
      answeredAt: new Date().toISOString(),
      languagePair: this.userStore.languagePair(),
      direction: this.store.sessionDirection(),
      lessonId: this.selectedLessonId() || undefined,
      courseId: this.selectedCourseId() || undefined,
    });

    this.persistLearningSession({
      activeCourseId: this.selectedCourseId() || undefined,
      lastLessonId: this.selectedLessonId() || undefined,
      lastScenarioId: this.store.scenarioId(),
    });
  }

  /**
   * Advances to the next scenario in the current lesson.
   *
   * @remarks
   * Navigates to the learning tab and loads the next scenario.
   * No-op if already on the last scenario.
   */
  async goToNextLessonScenario(): Promise<void> {
    const ids = this.lessonScenarioIds();
    const index = ids.indexOf(this.selectedScenarioId());
    if (index < 0 || index >= ids.length - 1) {
      return;
    }

    this.activeTabIndex.set(LEARNING_TAB.learning);
    await this.onScenarioChange(ids[index + 1]);
  }

  /**
   * Delegates the next-card action to the store.
   *
   * @remarks
   * Advances to the next card in the session. No-op if feedback has not been provided yet.
   * Marks the session as completed when the last card is reached.
   */
  nextCard(): void {
    this.store.nextCard();
  }
}
