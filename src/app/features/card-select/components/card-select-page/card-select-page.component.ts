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
import { cardSupportsSessionDirection } from '../../../../core/data/card-direction.utils';
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

import { CardHostComponent } from '../../../../shared/components/card-host';
import { DIFFICULTY_LABELS } from '../../../../shared/card-catalog-search';
import type { DrawAnswerPayload } from '../../../../shared/types/draw-answer.types';
import { CoursePickerComponent } from '../../../../shared/course-picker';
import { LessonPickerComponent, type LessonPickPayload } from '../../../../shared/lesson-picker';
import { ScenarioPickerComponent } from '../../../../shared/scenario-picker';
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

const LEARNING_TAB = {
  course: 0,
  lessons: 1,
  scenarios: 2,
  learning: 3,
} as const;

let lastKnownActiveLanguagePairId: string | null = null;

@Component({
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
  private readonly cardSelectService = inject(CardSelectService);
  private readonly resultsStore = inject(LearningResultsStore);
  private readonly userStore = inject(UserStore);
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly cardSearchService = inject(CardSearchService);
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(CardSelectStore);

  readonly difficultyLabels = DIFFICULTY_LABELS;
  readonly difficultyLevels: readonly CardDifficulty[] = ['beginner', 'intermediate', 'advanced'];

  readonly selectedCourseId = signal<string>('');
  readonly selectedLessonId = signal<string>('');
  readonly currentCourse = signal<CourseWithLessons | null>(null);
  readonly selectedDifficulty = signal<CardDifficulty | null>(null);
  readonly scenarioDifficultyMap = signal<ReadonlyMap<string, CardDifficulty>>(new Map());
  readonly courseTitle = signal<string>('');
  readonly lessonTitle = signal<string>('');
  readonly lessonScenarioIds = signal<readonly string[]>([]);
  readonly courseLessons = signal<readonly { lessonId: string; scenarioIds: readonly string[] }[]>(
    [],
  );
  readonly selectedScenarioId = signal<string>('');
  readonly scenarioTitle = signal<string>('');
  readonly scenarioSourceLabel = signal<string>('');
  readonly missingCardsWarning = signal<string | null>(null);
  readonly activeTabIndex = signal<number>(LEARNING_TAB.course);

  readonly practiceSettings = computed(() => resolveCoursePracticeSettings(this.currentCourse()));
  readonly isOpenPractice = computed(() => isOpenPracticeCourse(this.currentCourse()));
  readonly showDifficultyFilter = computed(
    () => this.practiceSettings().allowDifficultyFilter === true && !!this.selectedCourseId(),
  );
  readonly enforceLessonPrerequisites = computed(
    () => this.practiceSettings().enforceLessonPrerequisites !== false,
  );
  readonly requiresLessonForScenarios = computed(() => {
    if (!this.selectedCourseId()) {
      return false;
    }

    return this.practiceSettings().requireLessonForScenarios !== false;
  });

  readonly allowedScenarioIdsForPicker = computed(() => {
    const lessonIds = this.lessonScenarioIds();
    const course = this.currentCourse();
    const difficulty = this.selectedDifficulty();
    const difficultyMap = this.scenarioDifficultyMap();

    let base: readonly string[] | null = null;
    if (lessonIds.length > 0) {
      base = lessonIds;
    } else if (course && this.isOpenPractice()) {
      base = collectCourseScenarioIds(course);
    } else {
      base = null;
    }

    if (!base || base.length === 0) {
      return null;
    }

    return filterScenarioIdsByDifficulty(base, difficultyMap, difficulty);
  });

  readonly courseCompleted = computed(() => {
    const lessons = this.courseLessons();
    if (lessons.length === 0) {
      return false;
    }

    return this.resultsStore.isCourseCompleted(
      lessons.map((lesson) => ({ scenarioIds: lesson.scenarioIds })),
    );
  });

  readonly showCourseCertificate = computed(
    () => this.store.completed() && this.selectedCourseId() !== '' && this.courseCompleted(),
  );

  readonly hasNextLessonScenario = computed(() => {
    const ids = this.lessonScenarioIds();
    const current = this.selectedScenarioId();
    const index = ids.indexOf(current);
    return index >= 0 && index < ids.length - 1;
  });

  readonly cardProgressPercent = computed(() => {
    const total = this.store.cards().length;
    if (total === 0) {
      return 0;
    }

    return Math.round(((this.store.currentIndex() + 1) / total) * 100);
  });

  readonly showDirectionToggle = computed(() =>
    cardSupportsSessionDirection(this.store.currentCard()),
  );

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

  readonly canAdvanceFromCourse = computed(() => !!this.selectedCourseId());
  readonly canAdvanceFromLessons = computed(() => !!this.selectedLessonId());
  readonly canStartPractice = computed(() => !!this.selectedScenarioId());
  readonly isLearningTabActive = computed(() => this.activeTabIndex() === LEARNING_TAB.learning);

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

  readonly fontSize = this.userStore.preferences;

  private readonly resetOnActivePairChange = effect(() => {
    const activeId = this.userStore.activeLanguagePairId();

    if (lastKnownActiveLanguagePairId !== null && lastKnownActiveLanguagePairId !== activeId) {
      this.resetSessionState();
    }

    lastKnownActiveLanguagePairId = activeId;
  });

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
    if (
      difficulty === 'beginner' ||
      difficulty === 'intermediate' ||
      difficulty === 'advanced'
    ) {
      this.selectedDifficulty.set(difficulty);
    }

    if (tab === 'learning' && scenarioId) {
      this.activeTabIndex.set(LEARNING_TAB.learning);
    } else if (tab === 'scenarios') {
      this.activeTabIndex.set(LEARNING_TAB.scenarios);
    } else if (tab === 'lessons' && courseId) {
      this.activeTabIndex.set(LEARNING_TAB.lessons);
    } else if (tab === 'course') {
      this.activeTabIndex.set(LEARNING_TAB.course);
    }
  }

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

  private persistLearningSession(
    patch: Partial<{ activeCourseId: string; lastLessonId: string; lastScenarioId: string }>,
  ): void {
    queueMicrotask(() => {
      this.userStore.updateLearningSession(patch);
    });
  }

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

  goToTab(tabIndex: number): void {
    if (tabIndex === LEARNING_TAB.lessons && !this.selectedCourseId()) {
      return;
    }

    if (tabIndex === LEARNING_TAB.learning && !this.selectedScenarioId()) {
      return;
    }

    this.activeTabIndex.set(tabIndex);
  }

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

  startPractice(): void {
    if (!this.canStartPractice()) {
      return;
    }

    this.activeTabIndex.set(LEARNING_TAB.learning);
  }

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

  onCourseLabelChange(label: string): void {
    this.courseTitle.set(label.split(' · ')[0] ?? label);
  }

  async onLessonChange(lessonId: string): Promise<void> {
    this.selectedLessonId.set(lessonId);
    this.selectedScenarioId.set('');
    this.scenarioTitle.set('');
    this.scenarioSourceLabel.set('');
    this.store.reset();
    this.missingCardsWarning.set(null);
  }

  async onLessonPick(payload: LessonPickPayload): Promise<void> {
    this.lessonTitle.set(payload.title);
    this.lessonScenarioIds.set(payload.scenarioIds);
    this.persistLearningSession({ lastLessonId: payload.lessonId });
  }

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

  onScenarioLabelChange(label: string): void {
    this.scenarioSourceLabel.set(label.split(' · ').slice(1).join(' · ') || label);
  }

  onDifficultyChange(value: CardDifficulty | null): void {
    this.selectedDifficulty.set(value);
    this.selectedScenarioId.set('');
    this.scenarioTitle.set('');
    this.scenarioSourceLabel.set('');
    this.store.reset();
    this.missingCardsWarning.set(null);
  }

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

  selectOption(index: number): void {
    this.store.selectOption(index);
  }

  setAnswerText(value: string): void {
    this.store.setAnswerText(value);
  }

  setMemoryComplete(value: boolean): void {
    this.store.setMemoryComplete(value);
  }

  setDrawSubmitted(value: boolean): void {
    this.store.setDrawSubmitted(value);
  }

  setDrawAnswer(payload: DrawAnswerPayload | null): void {
    this.store.setDrawAnswer(payload);
  }

  handleTimeExpired(): void {
    this.store.handleTimeExpired();
  }

  onDirectionChange(direction: CardDirection): void {
    this.store.setSessionDirection(direction);
  }

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

  async goToNextLessonScenario(): Promise<void> {
    const ids = this.lessonScenarioIds();
    const index = ids.indexOf(this.selectedScenarioId());
    if (index < 0 || index >= ids.length - 1) {
      return;
    }

    this.activeTabIndex.set(LEARNING_TAB.learning);
    await this.onScenarioChange(ids[index + 1]);
  }

  nextCard(): void {
    this.store.nextCard();
  }
}
