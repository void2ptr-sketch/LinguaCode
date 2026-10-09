import { Injectable, computed, inject, signal } from '@angular/core';
import { LearningResult } from '../models';
import { LearningResultsPersistence } from './learning-results.persistence';
import { UserStore } from './user.store';

/** Maximum number of recent results to display. */
const RECENT_RESULTS_LIMIT = 10;

/**
 * Store for learning session results and progress tracking.
 *
 * @remarks
 * Persists results to localStorage via `LearningResultsPersistence`. Computes aggregates
 * (accuracy, progress) using Angular Signals. Scopes results to the current user and language pair.
 */
@Injectable({ providedIn: 'root' })
export class LearningResultsStore {
  private readonly persistence = inject(LearningResultsPersistence);
  private readonly userStore = inject(UserStore);
  private readonly resultsState = signal<readonly LearningResult[]>(this.persistence.load());

  /** Readonly signal of all learning results. */
  readonly results = this.resultsState.asReadonly();

  /** Results filtered to the current user. */
  readonly userResults = computed(() => {
    const userId = this.userStore.user().id;
    return this.results().filter((item) => item.userId === userId);
  });

  /**
   * Results for the current user and active language pair.
   *
   * @remarks
   * This is the primary signal used for progress calculations.
   */
  readonly pairResults = computed(() => {
    const pair = this.userStore.languagePair();
    return this.userResults().filter(
      (item) =>
        item.languagePair.known === pair.known && item.languagePair.learning === pair.learning,
    );
  });

  /** Total number of answered cards for the active language pair. */
  readonly totalCount = computed(() => this.pairResults().length);

  /** Number of correct answers for the active language pair. */
  readonly correctCount = computed(() => this.pairResults().filter((item) => item.correct).length);

  /**
   * Accuracy percentage for the active language pair.
   *
   * @remarks
   * Returns 0 when there are no results.
   */
  readonly accuracyPercent = computed(() => {
    const total = this.totalCount();
    if (total === 0) {
      return 0;
    }

    return Math.round((this.correctCount() / total) * 100);
  });

  /**
   * Most recent results, sorted by answered date (descending).
   *
   * @remarks
   * Limited to `RECENT_RESULTS_LIMIT` items.
   */
  readonly recentResults = computed(() => {
    return [...this.pairResults()]
      .sort((left, right) => right.answeredAt.localeCompare(left.answeredAt))
      .slice(0, RECENT_RESULTS_LIMIT);
  });

  /**
   * Aggregated progress grouped by scenario ID.
   *
   * @remarks
   * Returns an array of { scenarioId, total, correct } sorted by scenarioId.
   */
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

  /**
   * Adds a learning result and persists.
   *
   * @param result - The learning result to add.
   */
  addResult(result: LearningResult): void {
    this.resultsState.update((results) => {
      const nextResults = [...results, result];
      this.persistence.save(nextResults);
      return nextResults;
    });
  }

  /**
   * Returns results for a specific scenario (current user only).
   *
   * @param scenarioId - The scenario ID.
   * @returns Array of learning results for the scenario.
   */
  resultsForScenario(scenarioId: string): readonly LearningResult[] {
    return this.userResults().filter((item) => item.scenarioId === scenarioId);
  }

  /**
   * Computes progress for a set of scenarios.
   *
   * @param scenarioIds - Array of scenario IDs.
   * @returns Object with completed count, total count, and percentage.
   */
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

  /**
   * Computes progress for a lesson.
   *
   * @param lessonId - The lesson ID.
   * @param scenarioIds - Array of scenario IDs in the lesson.
   * @returns Object with lessonId, completed count, total count, and percentage.
   */
  lessonProgress(lessonId: string, scenarioIds: readonly string[]) {
    const stats = this.scenarioSetProgress(scenarioIds);
    return { lessonId, ...stats };
  }

  /**
   * Computes progress for a course.
   *
   * @param courseId - The course ID.
   * @param lessons - Array of lessons with their scenario IDs.
   * @returns Object with courseId, completed count, total count, and percentage.
   */
  courseProgress(
    courseId: string,
    lessons: readonly { lessonId: string; scenarioIds: readonly string[] }[],
  ) {
    const scenarioIds = lessons.flatMap((lesson) => lesson.scenarioIds);
    const stats = this.scenarioSetProgress(scenarioIds);
    return { courseId, ...stats };
  }

  /**
   * Checks whether all scenarios in a list have been completed.
   *
   * @param scenarioIds - Array of scenario IDs.
   * @returns `true` if every scenario has at least one result.
   */
  isLessonCompleted(scenarioIds: readonly string[]): boolean {
    if (scenarioIds.length === 0) {
      return false;
    }

    return scenarioIds.every((scenarioId) => this.resultsForScenario(scenarioId).length > 0);
  }

  /**
   * Checks whether a course is fully completed.
   *
   * @param lessons - Array of lessons with their scenario IDs.
   * @returns `true` if all scenarios across all lessons have results.
   */
  isCourseCompleted(lessons: readonly { scenarioIds: readonly string[] }[]): boolean {
    const progress = this.scenarioSetProgress(lessons.flatMap((lesson) => lesson.scenarioIds));
    return progress.total > 0 && progress.percent === 100;
  }

  /**
   * Returns IDs of fully completed courses.
   *
   * @param courses - Array of courses with their lessons and scenario IDs.
   * @returns Array of completed course IDs.
   */
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

  /**
   * Clears all results for the current user and persists.
   */
  clear(): void {
    const userId = this.userStore.user().id;
    this.resultsState.update((results) => {
      const nextResults = results.filter((item) => item.userId !== userId);
      this.persistence.save(nextResults);
      return nextResults;
    });
  }

  /**
   * Checks whether there are any results for a specific card.
   *
   * @param cardId - The card ID.
   * @returns `true` if at least one result exists for the card.
   */
  hasResultsForCard(cardId: string): boolean {
    return this.results().some((result) => result.cardId === cardId);
  }
}
