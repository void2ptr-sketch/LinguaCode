import { Injectable, computed, inject, signal } from '@angular/core';
import { LearningResult } from '../models';
import { LearningResultsPersistence } from './learning-results.persistence';
import { UserStore } from './user.store';

const RECENT_RESULTS_LIMIT = 10;

@Injectable({ providedIn: 'root' })
export class LearningResultsStore {
  private readonly persistence = inject(LearningResultsPersistence);
  private readonly userStore = inject(UserStore);
  private readonly resultsState = signal<readonly LearningResult[]>(this.persistence.load());

  readonly results = this.resultsState.asReadonly();

  readonly userResults = computed(() => {
    const userId = this.userStore.user().id;
    return this.results().filter((item) => item.userId === userId);
  });

  readonly pairResults = computed(() => {
    const pair = this.userStore.languagePair();
    return this.userResults().filter(
      (item) =>
        item.languagePair.known === pair.known && item.languagePair.learning === pair.learning,
    );
  });

  readonly totalCount = computed(() => this.pairResults().length);
  readonly correctCount = computed(() => this.pairResults().filter((item) => item.correct).length);

  readonly accuracyPercent = computed(() => {
    const total = this.totalCount();
    if (total === 0) {
      return 0;
    }

    return Math.round((this.correctCount() / total) * 100);
  });

  readonly recentResults = computed(() => {
    return [...this.pairResults()]
      .sort((left, right) => right.answeredAt.localeCompare(left.answeredAt))
      .slice(0, RECENT_RESULTS_LIMIT);
  });

  readonly scenarioProgress = computed(() => {
    const grouped = new Map<string, { total: number; correct: number }>();

    for (const result of this.pairResults()) {
      const current = grouped.get(result.scenarioId) ?? { total: 0, correct: 0 };
      grouped.set(result.scenarioId, {
        total: current.total + 1,
        correct: current.correct + (result.correct ? 1 : 0),
      });
    }

    return [...grouped.entries()]
      .map(([scenarioId, stats]) => ({
        scenarioId,
        total: stats.total,
        correct: stats.correct,
      }))
      .sort((left, right) => left.scenarioId.localeCompare(right.scenarioId));
  });

  addResult(result: LearningResult): void {
    this.resultsState.update((results) => {
      const nextResults = [...results, result];
      this.persistence.save(nextResults);
      return nextResults;
    });
  }

  resultsForScenario(scenarioId: string): readonly LearningResult[] {
    return this.userResults().filter((item) => item.scenarioId === scenarioId);
  }

  scenarioSetProgress(scenarioIds: readonly string[]): {
    completed: number;
    total: number;
    percent: number;
  } {
    const uniqueIds = [...new Set(scenarioIds)];
    const total = uniqueIds.length;

    if (total === 0) {
      return { completed: 0, total: 0, percent: 0 };
    }

    let completed = 0;
    for (const scenarioId of uniqueIds) {
      if (this.resultsForScenario(scenarioId).length > 0) {
        completed += 1;
      }
    }

    return {
      completed,
      total,
      percent: Math.round((completed / total) * 100),
    };
  }

  lessonProgress(lessonId: string, scenarioIds: readonly string[]) {
    const stats = this.scenarioSetProgress(scenarioIds);
    return { lessonId, ...stats };
  }

  courseProgress(
    courseId: string,
    lessons: readonly { lessonId: string; scenarioIds: readonly string[] }[],
  ) {
    const scenarioIds = lessons.flatMap((lesson) => lesson.scenarioIds);
    const stats = this.scenarioSetProgress(scenarioIds);
    return { courseId, ...stats };
  }

  isLessonCompleted(scenarioIds: readonly string[]): boolean {
    if (scenarioIds.length === 0) {
      return false;
    }

    return scenarioIds.every((scenarioId) => this.resultsForScenario(scenarioId).length > 0);
  }

  isCourseCompleted(lessons: readonly { scenarioIds: readonly string[] }[]): boolean {
    const progress = this.scenarioSetProgress(lessons.flatMap((lesson) => lesson.scenarioIds));
    return progress.total > 0 && progress.percent === 100;
  }

  completedCourseIds(
    courses: readonly {
      courseId: string;
      lessons: readonly { scenarioIds: readonly string[] }[];
    }[],
  ): readonly string[] {
    return courses
      .filter((course) => this.isCourseCompleted(course.lessons))
      .map((course) => course.courseId);
  }

  clear(): void {
    const userId = this.userStore.user().id;
    this.resultsState.update((results) => {
      const nextResults = results.filter((item) => item.userId !== userId);
      this.persistence.save(nextResults);
      return nextResults;
    });
  }

  hasResultsForCard(cardId: string): boolean {
    return this.results().some((result) => result.cardId === cardId);
  }
}
