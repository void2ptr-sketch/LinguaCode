import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  OnInit,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { UserStore } from '../../../entities/user/model/user.store';
import { CourseSearchService } from '../../../entities/course';
import { ScenarioSearchService } from '../../../entities/scenario';
import { LearningResultsStore } from '../../../entities/learning/model/learning-results.store';
import { CardSelectStore } from '../../../features/card-select/services/card-select.store';
import { CardSelectService } from '../../../features/card-select/services/card-select.service';
import {
  CardSelectFlowService,
  LEARNING_TAB,
} from '../../../features/card-select/services/card-select-flow.service';
import {
  PracticeSessionBarComponent,
  type PracticeSessionSegment,
} from '../../../features/card-select/components/practice-session-bar/practice-session-bar.component';
import {
  PracticeStepperComponent,
  type PracticeStepState,
} from '../../../features/card-select/components/practice-stepper/practice-stepper.component';
import { CoursePickerSectionComponent } from '../../../features/card-select/components/course-picker-section/course-picker-section.component';
import { LessonPickerSectionComponent } from '../../../features/card-select/components/lesson-picker-section/lesson-picker-section.component';
import { ScenarioPickerSectionComponent } from '../../../features/card-select/components/scenario-picker-section/scenario-picker-section.component';
import { LearningZoneComponent } from '../../../features/card-select/components/learning-zone/learning-zone.component';
import type { CardDifficulty } from '../../../entities/card/model';
import type { LessonPickPayload } from '../../../entities/lesson/ui/lesson-picker';
import { DIFFICULTY_LABELS } from '../../../entities/card/lib/catalog-labels';
import { cardSupportsSessionDirection } from '../../../entities/card/utils/card-direction.utils';

/**
 * Page component for card-based learning sessions.
 *
 * @remarks
 * Thin coordinator that delegates flow state to `CardSelectFlowService`.
 * Manages store bindings, event delegation, and learning result tracking.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'app-card-select-page',
  imports: [
    RouterLink,
    MatIconModule,
    MatTabsModule,
    PracticeSessionBarComponent,
    PracticeStepperComponent,
    CoursePickerSectionComponent,
    LessonPickerSectionComponent,
    ScenarioPickerSectionComponent,
    LearningZoneComponent,
  ],
  templateUrl: './card-select-page.component.html',
  styleUrl: './card-select-page.component.scss',
})
export class CardSelectPageComponent implements OnInit {
  private readonly cardSelectService = inject(CardSelectService);
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly resultsStore = inject(LearningResultsStore);
  private readonly userStore = inject(UserStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly logger = inject(AppLoggerService);
  /** Guard so the journey return fires exactly once per completed session. */
  private journeyReturnFired = false;

  readonly store = inject(CardSelectStore);
  readonly flow = inject(CardSelectFlowService);

  readonly difficultyLevels: readonly CardDifficulty[] = ['beginner', 'intermediate', 'advanced'];
  readonly difficultyLabels = DIFFICULTY_LABELS;
  readonly LEARNING_TAB = LEARNING_TAB;

  // ─── Delegated signals (exposed for template) ─────────────────────────

  readonly selectedCourseId = this.flow.selectedCourseId;
  readonly selectedLessonId = this.flow.selectedLessonId;
  readonly currentCourse = this.flow.currentCourse;
  readonly selectedDifficulty = this.flow.selectedDifficulty;
  readonly scenarioDifficultyMap = this.flow.scenarioDifficultyMap;
  readonly courseTitle = this.flow.courseTitle;
  readonly lessonTitle = this.flow.lessonTitle;
  readonly lessonScenarioIds = this.flow.lessonScenarioIds;
  readonly courseLessons = this.flow.courseLessons;
  readonly selectedScenarioId = this.flow.selectedScenarioId;
  readonly scenarioTitle = this.flow.scenarioTitle;
  readonly scenarioSourceLabel = this.flow.scenarioSourceLabel;
  readonly missingCardsWarning = this.flow.missingCardsWarning;
  readonly activeTabIndex = this.flow.activeTabIndex;

  // ─── Computed delegates ───────────────────────────────────────────────

  readonly isOpenPractice = this.flow.isOpenPractice;
  readonly showDifficultyFilter = this.flow.showDifficultyFilter;
  readonly enforceLessonPrerequisites = this.flow.enforceLessonPrerequisites;
  readonly requiresLessonForScenarios = this.flow.requiresLessonForScenarios;
  readonly allowedScenarioIdsForPicker = this.flow.allowedScenarioIdsForPicker;
  readonly hasNextLessonScenario = this.flow.hasNextLessonScenario;
  readonly canAdvanceFromCourse = this.flow.canAdvanceFromCourse;
  readonly canAdvanceFromLessons = this.flow.canAdvanceFromLessons;
  readonly canStartPractice = this.flow.canStartPractice;
  readonly nextStepHint = this.flow.nextStepHint;

  readonly courseCompleted = computed(() => {
    const lessons = this.flow.courseLessons();
    if (lessons.length === 0) return false;
    return this.resultsStore.isCourseCompleted(
      lessons.map((lesson) => ({ scenarioIds: lesson.scenarioIds })),
    );
  });

  readonly showCourseCertificate = computed(
    () => this.store.completed() && this.selectedCourseId() !== '' && this.courseCompleted(),
  );

  readonly cardProgressPercent = computed(() => {
    const total = this.store.cards().length;
    if (total === 0) return 0;
    return Math.round(((this.store.currentIndex() + 1) / total) * 100);
  });

  readonly showDirectionToggle = computed(() =>
    cardSupportsSessionDirection(this.store.currentCard()),
  );

  readonly sessionSegments = computed((): readonly PracticeSessionSegment[] => {
    const courseId = this.selectedCourseId();
    const lessonId = this.selectedLessonId();
    const scenarioId = this.selectedScenarioId();
    const tab = LEARNING_TAB;

    return [
      {
        tabIndex: tab.course,
        label: 'Программа',
        value: courseId ? this.courseTitle() || 'Выбранная программа' : null,
        placeholder: 'Программа не выбрана',
        completed: !!courseId,
        locked: false,
      },
      {
        tabIndex: tab.lessons,
        label: 'Урок',
        value: lessonId ? this.lessonTitle() || 'Выбранный урок' : null,
        placeholder: 'Урок не выбран',
        completed: !!lessonId,
        locked: !courseId,
        lockReason: 'Сначала выберите программу',
      },
      {
        tabIndex: tab.scenarios,
        label: 'Сценарий',
        value: scenarioId ? this.scenarioTitle() || 'Выбранный сценарий' : null,
        placeholder: 'Сценарий не выбран',
        completed: !!scenarioId,
        locked: false,
      },
    ];
  });

  readonly practiceSteps = computed((): readonly PracticeStepState[] => {
    const active = this.activeTabIndex();
    const tab = LEARNING_TAB;
    const courseId = this.selectedCourseId();
    const lessonId = this.selectedLessonId();
    const scenarioId = this.selectedScenarioId();

    return [
      {
        index: tab.course,
        label: 'Программа',
        done: !!courseId,
        current: active === tab.course,
        locked: false,
      },
      {
        index: tab.lessons,
        label: 'Урок',
        done: !!lessonId,
        current: active === tab.lessons,
        locked: !courseId,
      },
      {
        index: tab.scenarios,
        label: 'Сценарий',
        done: !!scenarioId,
        current: active === tab.scenarios,
        locked: false,
      },
      {
        index: tab.learning,
        label: 'Обучение',
        done: false,
        current: active === tab.learning,
        locked: !scenarioId,
      },
    ];
  });

  readonly fontSize = this.flow.fontSize;

  // ─── Effects ──────────────────────────────────────────────────────────

  /** Auto-checks draw card answers when the store receives them. */
  private readonly autoCheckDrawAnswer = effect(() => {
    const drawSubmitted = this.store.drawSubmitted();
    const drawAnswer = this.store.drawAnswer();
    if (drawSubmitted && drawAnswer !== null) {
      untracked(() => this.checkAnswer());
    }
  });

  /**
   * Returns to the learning path map (Путь обучения) when a course scenario ends.
   *
   * @remarks
   * Triggered when the session is completed via the "Далее" button on the last card.
   * Navigates to `/journey` with the course ID; free practice (no course) keeps
   * the current completion screen.
   */
  private readonly returnToJourneyOnCompletion = effect(() => {
    const completed = this.store.completed();
    const courseId = this.selectedCourseId();
    if (completed && courseId && !this.journeyReturnFired) {
      this.journeyReturnFired = true;
      void this.router.navigate(['/journey'], { queryParams: { courseId } });
    }
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    const query = this.route.snapshot.queryParamMap;
    const courseId = query.get('courseId');
    const lessonId = query.get('lessonId');
    const scenarioId = query.get('scenarioId');
    const tab = query.get('tab');

    // Активируем языковую пару курса/сценария ДО установки состояния флоу:
    // глобальный сброс флоу при смене пары должен отработать на пустом состоянии,
    // иначе он затрёт выбранные курс/урок/сценарий, и карточки не откроются.
    if (courseId) {
      await this.activateLanguagePairForCourse(courseId);
    } else if (scenarioId) {
      await this.activateLanguagePairForScenario(scenarioId);
    }

    if (courseId) {
      await this.flow.loadCourse(courseId);
    }

    if (lessonId) {
      await this.flow.applyLessonFromCourse(lessonId);
    }

    if (scenarioId) {
      await this.onScenarioChange(scenarioId);
    }

    const difficulty = query.get('difficulty');
    if (difficulty === 'beginner' || difficulty === 'intermediate' || difficulty === 'advanced') {
      this.flow.onDifficultyChange(difficulty as CardDifficulty | null);
    }

    if (scenarioId) {
      this.flow.setActiveTab(LEARNING_TAB.learning);
    } else if (tab === 'scenarios') {
      this.flow.setActiveTab(LEARNING_TAB.scenarios);
    } else if (tab === 'lessons' && courseId) {
      this.flow.setActiveTab(LEARNING_TAB.lessons);
    } else if (tab === 'course') {
      this.flow.setActiveTab(LEARNING_TAB.course);
    }
  }

  /**
   * Активирует языковую пару курса, чтобы сценарии курса открывались
   * независимо от активной пары пользователя.
   */
  private async activateLanguagePairForCourse(courseId: string): Promise<void> {
    try {
      const course = await this.courseSearchService.getById(courseId);
      if (course?.languagePair) {
        this.userStore.addLanguagePair(course.languagePair);
      }
    } catch {
      // Не критично: флоу покажет собственную ошибку при загрузке курса.
    }
  }

  /**
   * Активирует языковую пару сценария при прямом переходе по ссылке.
   */
  private async activateLanguagePairForScenario(scenarioId: string): Promise<void> {
    try {
      const scenario = await this.scenarioSearchService.getById(scenarioId);
      if (scenario?.languagePair) {
        this.userStore.addLanguagePair(scenario.languagePair);
      }
    } catch {
      // Не критично: loadScenario покажет собственную ошибку.
    }
  }

  // ─── Event handlers (delegates) ───────────────────────────────────────

  goToTab(tabIndex: number): void {
    this.flow.goToTab(tabIndex);
  }

  advanceFromCurrentTab(): void {
    this.flow.advanceFromCurrentTab();
  }

  startPractice(): void {
    this.flow.startPractice();
  }

  async onCourseChange(courseId: string): Promise<void> {
    if (courseId) {
      await this.flow.loadCourse(courseId);
    } else {
      this.flow.resetCourseState();
    }
  }

  onCourseLabelChange(label: string): void {
    this.flow.setCourseTitleFromLabel(label);
  }

  onLessonChange(lessonId: string): void {
    this.flow.onLessonChange(lessonId);
    this.store.reset();
    this.flow.clearMissingCardsWarning();
  }

  async onLessonPick(payload: LessonPickPayload): Promise<void> {
    this.flow.onLessonPick(payload);
  }

  async onScenarioChange(scenarioId: string): Promise<void> {
    this.flow.onScenarioChange(scenarioId);

    if (!scenarioId) {
      this.store.reset();
      this.flow.clearMissingCardsWarning();
      return;
    }

    await this.loadCards();
  }

  onScenarioLabelChange(label: string): void {
    this.flow.setScenarioSourceLabelFromPicker(label);
  }

  onDifficultyChange(value: CardDifficulty | null): void {
    this.flow.onDifficultyChange(value);
    this.store.reset();
    this.flow.clearMissingCardsWarning();
  }

  async loadCards(): Promise<void> {
    const scenarioId = this.selectedScenarioId();
    if (!scenarioId) return;

    this.store.reset();
    this.store.setLoading(true);
    this.flow.clearMissingCardsWarning();

    try {
      const session = await this.cardSelectService.loadScenario(scenarioId);
      this.flow.setScenarioMetadata(
        session.scenarioTitle,
        session.scenarioSourceLabel,
        session.missingCardIds,
      );
      this.store.setScenario(session.scenarioId, session.cards);
    } catch (error) {
      this.logger.error('CardSelect: failed to load scenario cards', error);
      this.store.setError('Не удалось загрузить карточки сценария');
    }
  }

  /** Checks the current answer and records the result. */
  checkAnswer(): void {
    const card = this.store.currentCard();
    const isCorrect = this.store.checkAnswer();
    if (!card || isCorrect === null) return;

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
  }

  async goToNextLessonScenario(): Promise<void> {
    const nextId = this.flow.goToNextLessonScenario();
    if (!nextId) {
      return;
    }
    this.flow.onScenarioChange(nextId);
    await this.loadCards();
  }
}
