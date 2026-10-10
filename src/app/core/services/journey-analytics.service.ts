import { Injectable, computed, inject, signal } from '@angular/core';

import { type ExplorerLevel, type ExplorerLevelResult, type JourneyAnalyticsEvent, type JourneyLocationNode } from '../models';
import { UserStore } from '../state/user.store';

const JOURNEY_VISITS_STORAGE_KEY = 'journey_visits';

type JourneyVisitRecord = {
  scenarioId: string;
  lessonId: string;
  courseId: string;
  visitedAt: string;
  durationMs: number;
  completionPercent: number;
};

/**
 * Analytics service for the learning journey map.
 *
 * @remarks
 * Tracks location visits, duration, and progress. Data is stored in localStorage
 * and synchronized with `LearningResultsStore`.
 */
@Injectable({ providedIn: 'root' })
export class JourneyAnalyticsService {
  private readonly userStore = inject(UserStore);

  private readonly visitsState = signal<readonly JourneyVisitRecord[]>(this.loadVisits());

  /**
   * Readonly signal of all visit records.
   *
   * @remarks
   * Each record contains scenario ID, lesson ID, course ID, timestamp, duration, and completion percentage.
   * Persisted to localStorage via `loadVisits` / `saveVisits`.
   */
  readonly visits = this.visitsState.asReadonly();

  /**
   * Returns a function that counts visits for a specific scenario.
   *
   * @remarks
   * This is a computed factory — call the returned function with a scenarioId.
   * The computed re-evaluates whenever `visits` changes.
   */
  readonly visitCountForScenario = computed(() => {
    return (scenarioId: string) =>
      this.visits().filter((v) => v.scenarioId === scenarioId).length;
  });

  /**
   * Returns a function that computes visit statistics for a specific course.
   *
   * @remarks
   * Includes total visits, total duration, and average completion percentage.
   * The computed re-evaluates whenever `visits` changes.
   */
  readonly courseVisitStats = computed(() => {
    return (courseId: string) => {
      const courseVisits = this.visits().filter((v) => v.courseId === courseId);
      const totalVisits = courseVisits.length;
      const totalDuration = courseVisits.reduce((sum, v) => sum + v.durationMs, 0);
      const avgCompletion =
        totalVisits > 0
          ? Math.round(courseVisits.reduce((sum, v) => sum + v.completionPercent, 0) / totalVisits)
          : 0;

      return { totalVisits, totalDurationMs: totalDuration, avgCompletionPercent: avgCompletion };
    };
  });

  /**
   * "Stuck points" — locations with abnormally long duration or low completion.
   *
   * @remarks
   * Thresholds: >5 minutes total duration OR <50% average completion.
   * Groups visits by scenario ID and filters out problematic locations.
   * The computed re-evaluates whenever `visits` changes.
   */
  readonly stuckPoints = computed(() => {
    const grouped = new Map<
      string,
      { scenarioId: string; lessonId: string; courseId: string; count: number; totalDuration: number; avgCompletion: number }
    >();

    for (const visit of this.visits()) {
      const current = grouped.get(visit.scenarioId);
      if (current) {
        current.count += 1;
        current.totalDuration += visit.durationMs;
        current.avgCompletion = (current.avgCompletion * (current.count - 1) + visit.completionPercent) / current.count;
      } else {
        grouped.set(visit.scenarioId, {
          scenarioId: visit.scenarioId,
          lessonId: visit.lessonId,
          courseId: visit.courseId,
          count: 1,
          totalDuration: visit.durationMs,
          avgCompletion: visit.completionPercent,
        });
      }
    }

    const thresholdMs = 5 * 60 * 1000; // 5 минут
    const thresholdCompletion = 50; // ниже 50% завершения

    return [...grouped.values()].filter(
      (stats) => stats.totalDuration > thresholdMs || stats.avgCompletion < thresholdCompletion,
    );
  });

  /**
   * Current explorer level computed from visit data.
   *
   * @remarks
   * Levels: novice → experienced → expert based on visit and completion thresholds.
   */
  readonly explorerLevel = computed(() => this.computeExplorerLevel());

  /**
   * Processes an analytics event and updates visit records.
   *
   * @param event - The journey analytics event to process.
   */
  trackEvent(event: JourneyAnalyticsEvent): void {
    switch (event.kind) {
      case 'visit': {
        this.visitsState.update((visits) => {
          const next = [...visits];
          const existingIndex = next.findIndex(
            (v) => v.scenarioId === event.scenarioId && v.courseId === event.courseId,
          );
          if (existingIndex >= 0) {
            next[existingIndex] = {
              ...next[existingIndex],
              visitedAt: event.timestamp,
            };
          } else {
            next.push({
              scenarioId: event.scenarioId,
              lessonId: event.lessonId,
              courseId: event.courseId,
              visitedAt: event.timestamp,
              durationMs: 0,
              completionPercent: 0,
            });
          }
          this.saveVisits(next);
          return next;
        });
        break;
      }
      case 'duration': {
        this.visitsState.update((visits) => {
          return visits.map((v) =>
            v.scenarioId === event.scenarioId && v.courseId === event.courseId
              ? { ...v, durationMs: v.durationMs + event.durationMs }
              : v,
          );
        });
        this.saveVisits(this.visitsState());
        break;
      }
      case 'complete': {
        this.visitsState.update((visits) => {
          return visits.map((v) =>
            v.scenarioId === event.scenarioId && v.courseId === event.courseId
              ? { ...v, completionPercent: event.completionPercent }
              : v,
          );
        });
        this.saveVisits(this.visitsState());
        break;
      }
    }
  }

  /**
   * Updates a location node's progress based on LearningResultsStore data.
   *
   * @param node - The journey location node to update.
   * @param completedCount - Number of completed cards in the scenario.
   * @param totalCount - Total number of cards in the scenario.
   * @returns The updated node with status, completion percent, and visited flag.
   */
  updateLocationProgress(node: JourneyLocationNode, completedCount: number, totalCount: number): JourneyLocationNode {
    const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const isVisited = this.visitCountForScenario()(node.scenarioId) > 0;

    let status: JourneyLocationNode['status'] = node.status;
    if (completedCount >= totalCount && totalCount > 0) {
      status = 'completed';
    } else if (isVisited) {
      status = 'in-progress';
    }

    return { ...node, status, completionPercent, visited: isVisited };
  }

  /**
   * Computes the current explorer level from visit data.
   *
   * @returns The explorer level result with totals and next milestone.
   */
  private computeExplorerLevel(): ExplorerLevelResult {
    const totalVisits = this.visits().length;
    const completed = this.visits().filter((v) => v.completionPercent >= 100).length;

    const noviceThreshold = { visits: 5, completed: 2 };
    const experiencedThreshold = { visits: 20, completed: 10 };

    let level: ExplorerLevel = 'novice';
    let nextMilestone: ExplorerLevelResult['nextMilestone'] = {
      visitsNeeded: noviceThreshold.visits - totalVisits,
      completedNeeded: noviceThreshold.completed - completed,
    };

    if (totalVisits >= noviceThreshold.visits && completed >= noviceThreshold.completed) {
      level = 'experienced';
      nextMilestone = {
        visitsNeeded: experiencedThreshold.visits - totalVisits,
        completedNeeded: experiencedThreshold.completed - completed,
      };
    }

    if (totalVisits >= experiencedThreshold.visits && completed >= experiencedThreshold.completed) {
      level = 'expert';
      nextMilestone = { visitsNeeded: 0, completedNeeded: 0 };
    }

    return { level, totalVisits, totalCompleted: completed, nextMilestone };
  }

  /**
   * Toggles the favorite status of a location node.
   *
   * @param nodeId - The ID of the location node.
   * @param isFavorite - `true` to add to favorites, `false` to remove.
   */
  toggleFavorite(nodeId: string, isFavorite: boolean): void {
    // Сохраняем флаг в localStorage как отдельный ключ
    const favorites = this.loadFavorites();
    if (isFavorite) {
      favorites.add(nodeId);
    } else {
      favorites.delete(nodeId);
    }
    this.saveFavorites(favorites);
  }

  /**
   * Checks whether a location node is marked as favorite.
   *
   * @param nodeId - The ID of the location node.
   * @returns `true` if the node is in the favorites list.
   */
  isFavorite(nodeId: string): boolean {
    return this.loadFavorites().has(nodeId);
  }

  /** Загрузка посещений из localStorage. */
  private loadVisits(): JourneyVisitRecord[] {
    try {
      const raw = localStorage.getItem(JOURNEY_VISITS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Сохранение посещений в localStorage. */
  private saveVisits(visits: readonly JourneyVisitRecord[]): void {
    try {
      localStorage.setItem(JOURNEY_VISITS_STORAGE_KEY, JSON.stringify(visits));
    } catch {
      // localStorage недоступен — данные остаются в сигнале
    }
  }

  /** Загрузка избранного. */
  private loadFavorites(): Set<string> {
    try {
      const raw = localStorage.getItem('journey_favorites');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  /** Сохранение избранного. */
  private saveFavorites(favorites: Set<string>): void {
    try {
      localStorage.setItem('journey_favorites', JSON.stringify([...favorites]));
    } catch {
      // игнорируем
    }
  }

  /**
   * Clears all analytics data (visits and favorites) from signals and localStorage.
   */
  clear(): void {
    this.visitsState.set([]);
    this.saveVisits([]);
    localStorage.removeItem('journey_favorites');
  }
}
