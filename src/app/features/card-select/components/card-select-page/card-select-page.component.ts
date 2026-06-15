import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

import type { CardDirection } from '../../../../core/models/language-pair.types';

import { CourseSearchService } from '../../../../core/data';

import { CardHostComponent } from '../../../../shared/components/card-host';
import { CoursePickerComponent } from '../../../../shared/course-picker';
import { LessonPickerComponent, type LessonPickPayload } from '../../../../shared/lesson-picker';
import { ScenarioPickerComponent } from '../../../../shared/scenario-picker';
import { LearningResultsStore, UserStore } from '../../../../core/state';
import { CardSelectService } from '../../services/card-select.service';
import { CardSelectStore } from '../../services/card-select.store';

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
    MatProgressSpinnerModule,
    MatTabsModule,
    CardHostComponent,
    CoursePickerComponent,
    LessonPickerComponent,
    ScenarioPickerComponent,
  ],
  templateUrl: './card-select-page.component.html',
  styleUrl: './card-select-page.component.scss',
})
export class CardSelectPageComponent implements OnInit {
  private readonly cardSelectService = inject(CardSelectService);
  private readonly resultsStore = inject(LearningResultsStore);
  private readonly userStore = inject(UserStore);
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(CardSelectStore);

  readonly selectedCourseId = signal<string>('');
  readonly selectedLessonId = signal<string>('');
  readonly courseTitle = signal<string>('');
  readonly lessonTitle = signal<string>('');
  readonly lessonScenarioIds = signal<readonly string[]>([]);
  readonly courseLessons = signal<readonly { lessonId: string; scenarioIds: readonly string[] }[]>([]);
  readonly selectedScenarioId = signal<string>('');
  readonly scenarioTitle = signal<string>('');
  readonly scenarioSourceLabel = signal<string>('');
  readonly missingCardsWarning = signal<string | null>(null);
  readonly activeTabIndex = signal<number>(LEARNING_TAB.course);

  readonly lessonProgressLabel = computed(() => {
    const ids = this.lessonScenarioIds();
    if (ids.length === 0) {
      return '';
    }

    const progress = this.resultsStore.scenarioSetProgress(ids);
    return `Урок: ${progress.completed}/${progress.total} сценариев`;
  });

  readonly courseProgressLabel = computed(() => {
    const courseId = this.selectedCourseId();
    const lessons = this.courseLessons();
    if (!courseId || lessons.length === 0) {
      return '';
    }

    const progress = this.resultsStore.courseProgress(courseId, lessons);
    return `Курс: ${progress.percent}%`;
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

  async onCourseChange(courseId: string): Promise<void> {
    this.selectedCourseId.set(courseId);
    this.selectedLessonId.set('');
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
        this.courseTitle.set(course.title);
        this.courseLessons.set(
          course.lessons.map((lesson) => ({
            lessonId: lesson.id,
            scenarioIds: lesson.scenarioIds,
          })),
        );
      } catch {
        this.courseTitle.set('');
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
    this.activeTabIndex.set(LEARNING_TAB.scenarios);
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

    if (!this.store.error() && this.activeTabIndex() === LEARNING_TAB.scenarios) {
      this.activeTabIndex.set(LEARNING_TAB.learning);
    }
  }

  onScenarioLabelChange(label: string): void {
    this.scenarioSourceLabel.set(label.split(' · ').slice(1).join(' · ') || label);
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

  handleTimeExpired(): void {
    this.store.handleTimeExpired();
  }

  onDirectionChange(direction: CardDirection): void {
    this.store.sessionDirection.set(direction);
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
