import { Injectable, computed, inject, signal } from '@angular/core';

import { activeLanguagePairCriteria } from '../../../core/data/language-pair-scope.utils';
import {
  buildLessonRoadmap,
  collectScenarioIds,
  inferActiveCourseId,
  resolveLearningResumeTarget,
  type LearningResumeTarget,
  type LessonRoadmapItem,
} from '../../../core/data/learning-resume.utils';
import { CourseSearchService } from '../../../core/data/course-search.service';
import { resolveLearningSessionForPair } from '../../../core/data/learning-session.utils';
import { ScenariosApiService } from '../../../core/data/scenarios-api.service';
import type { CourseWithLessons } from '../../../core/models';
import { LearningResultsStore, UserStore } from '../../../core/state';

@Injectable({ providedIn: 'root' })
export class LearningDashboardService {
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly scenariosApiService = inject(ScenariosApiService);
  private readonly userStore = inject(UserStore);
  private readonly resultsStore = inject(LearningResultsStore);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly course = signal<CourseWithLessons | null>(null);
  readonly resumeTarget = signal<LearningResumeTarget | null>(null);
  readonly roadmap = signal<readonly LessonRoadmapItem[]>([]);

  readonly learningSession = computed(() =>
    resolveLearningSessionForPair(this.userStore.activeLanguagePairEntry()),
  );

  readonly courseProgress = computed(() => {
    const course = this.course();
    if (!course) {
      return null;
    }

    const lessons = course.lessons.map((lesson) => ({
      lessonId: lesson.id,
      scenarioIds: lesson.scenarioIds,
    }));

    return this.resultsStore.courseProgress(course.id, lessons);
  });

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const saved = this.learningSession();
      const pairResults = this.resultsStore.pairResults();
      const hasScenarioResult = (scenarioId: string) =>
        this.resultsStore.resultsForScenario(scenarioId).length > 0;

      let courseId = inferActiveCourseId(saved, pairResults, null);

      if (!courseId) {
        const page = await this.courseSearchService.search({
          scope: 'published',
          ...activeLanguagePairCriteria(this.userStore.languagePair()),
          page: { page: 0, pageSize: 1 },
        });
        courseId = page.items[0]?.id ?? null;
      }

      if (!courseId) {
        this.course.set(null);
        this.resumeTarget.set({
          kind: 'no-program',
          courseId: '',
          courseTitle: '',
          lessonId: '',
          lessonTitle: '',
          scenarioId: '',
          scenarioTitle: '',
        });
        this.roadmap.set([]);
        return;
      }

      const course = await this.courseSearchService.getById(courseId);
      this.course.set(course);

      if (!saved.activeCourseId) {
        queueMicrotask(() => {
          this.userStore.updateActiveLanguagePairSettings({
            learning: { activeCourseId: courseId },
          });
        });
      }

      const scenarioTitles = await this.loadScenarioTitles(collectScenarioIds(course));
      const target = resolveLearningResumeTarget({
        course,
        saved,
        pairResults,
        hasScenarioResult,
        scenarioTitles,
      });

      this.resumeTarget.set(target);
      this.roadmap.set(buildLessonRoadmap(course.lessons, hasScenarioResult));
    } catch {
      this.error.set('Не удалось загрузить программу обучения');
      this.course.set(null);
      this.resumeTarget.set(null);
      this.roadmap.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  setActiveCourseId(courseId: string): void {
    this.userStore.updateActiveLanguagePairSettings({
      learning: {
        activeCourseId: courseId,
        lastLessonId: undefined,
        lastScenarioId: undefined,
      },
    });
  }

  private async loadScenarioTitles(
    scenarioIds: readonly string[],
  ): Promise<Readonly<Record<string, string>>> {
    const titles: Record<string, string> = {};

    await Promise.all(
      scenarioIds.map(async (scenarioId) => {
        try {
          const scenario = await this.scenariosApiService.getById(scenarioId);
          titles[scenarioId] = scenario.title;
        } catch {
          // fallback labels resolve in utils
        }
      }),
    );

    return titles;
  }
}
