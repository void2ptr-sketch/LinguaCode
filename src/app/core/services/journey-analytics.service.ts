import { Injectable, computed, inject, signal } from '@angular/core';

import {
  type ExplorerLevel,
  type ExplorerLevelResult,
  type JourneyAnalyticsEvent,
  type JourneyLocationNode,
} from '../models/journey.types';

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
 * Сервис аналитики для карты путешествия.
 * Отслеживает посещения локаций, длительность и прогресс.
 * Данные хранятся в localStorage и синхронизируются с LearningResultsStore.
 */
@Injectable({ providedIn: 'root' })
export class JourneyAnalyticsService {
  private readonly userStore = inject(UserStore);

  private readonly visitsState = signal<readonly JourneyVisitRecord[]>(this.loadVisits());

  readonly visits = this.visitsState.asReadonly();

  /** Количество посещений для конкретного сценария. */
  readonly visitCountForScenario = computed(() => {
    const userId = this.userStore.user().id;
    return (scenarioId: string) =>
      this.visits().filter((v) => v.scenarioId === scenarioId).length;
  });

  /** Общая статистика посещений по курсу. */
  readonly courseVisitStats = computed(() => {
    const userId = this.userStore.user().id;
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

  /** Статистика «точек застревания» — локации с аномально долгим временем или низким прогрессом. */
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

  /** Текущий уровень исследователя. */
  readonly explorerLevel = computed(() => this.computeExplorerLevel());

  /** Обработка события аналитики. */
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

  /** Обновление прогресса локации на основе данных из LearningResultsStore. */
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

  /** Вычисление уровня исследователя. */
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

  /** Переключатель избранного для локации. */
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

  /** Очистка всех данных аналитики. */
  clear(): void {
    this.visitsState.set([]);
    this.saveVisits([]);
    localStorage.removeItem('journey_favorites');
  }
}
