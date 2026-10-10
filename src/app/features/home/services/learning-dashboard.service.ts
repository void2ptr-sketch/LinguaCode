import { Injectable, computed, inject, signal } from '@angular/core';

import {
  buildLessonRoadmap,
  collectScenarioIds,
  courseMatchesActiveLanguagePair,
  inferActiveCourseId,
  resolveLearningResumeTarget,
  type LearningResumeTarget,
  type LessonRoadmapItem,
} from '../../../core/repositories/learning/learning-resume.utils';
import { CourseSearchService } from '../../../core/repositories/courses/search/course-search.service';
import { resolveLearningSessionForPair } from '../../../core/repositories/learning/learning-session.utils';
import { ScenariosApiService } from '../../../core/repositories/scenarios/api/scenarios-api.service';
import type { CourseWithLessons } from '../../../core/models';
import { LearningResultsStore, UserStore } from '../../../core/state';
import { RADICALS_COURSE_ID } from '../../../core/repositories/chinese/tones/radicals-course.defaults';

/**
 * Service for the learning dashboard (home page).
 *
 * @remarks
 * Loads the active course, builds the lesson roadmap, and determines the resume target
 * (where to continue learning from). Falls back to the radicals course when no active course exists.
 */
@Injectable({ providedIn: 'root' })
export class LearningDashboardService {
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly scenariosApiService = inject(ScenariosApiService);
  private readonly userStore = inject(UserStore);
  private readonly resultsStore = inject(LearningResultsStore);

  /**
   * Loading state for course data.
   *
   * @remarks
   * Set to `true` at the start of `reload()` and reset to `false` in the `finally` block.
   */
  readonly loading = signal(false);

  /**
   * Error message, if any.
   *
   * @remarks
   * Populated when `reload()` encounters a failure. Reset to `null` at the start of each reload.
   */
  readonly error = signal<string | null>(null);

  /**
   * The currently loaded course with its lessons.
   *
   * @remarks
   * Set by `reload()` after fetching course data. `null` when no course is active.
   */
  readonly course = signal<CourseWithLessons | null>(null);

  /**
   * The determined resume target indicating where to continue learning.
   *
   * @remarks
   * Computed by `resolveLearningResumeTarget` during `reload()`. Contains the kind
   * of target (e.g., 'start', 'continue', 'course-complete', 'no-program') and
   * associated metadata (course/lesson/scenario IDs and titles).
   */
  readonly resumeTarget = signal<LearningResumeTarget | null>(null);

  /**
   * The lesson roadmap for the current course.
   *
   * @remarks
   * Built from `course.lessons` via `buildLessonRoadmap`. Each item includes
   * the lesson title, ID, and completion state for each scenario.
   */
  readonly roadmap = signal<readonly LessonRoadmapItem[]>([]);

  /**
   * Learning session preferences for the active language pair.
   *
   * @remarks
   * Computed from `UserStore.activeLanguagePairEntry` via `resolveLearningSessionForPair`.
   * Includes saved state such as the active course ID, last lesson, and last scenario.
   */
  readonly learningSession = computed(() =>
    resolveLearningSessionForPair(this.userStore.activeLanguagePairEntry()),
  );

  /**
   * Computed progress for the currently loaded course.
   *
   * @remarks
   * Returns `null` when no course is loaded.
   */
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

  /**
   * Reloads the dashboard data: course, roadmap, and resume target.
   *
   * @remarks
   * Infers the active course from saved state or falls back to the radicals course.
   */
  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const pair = this.userStore.languagePair();
      const saved = this.learningSession();
      const pairResults = this.resultsStore.pairResults();
      const hasScenarioResult = (scenarioId: string) =>
        this.resultsStore.resultsForScenario(scenarioId).length > 0;

      let courseId = inferActiveCourseId(saved, pairResults, null);

      if (courseId) {
        try {
          const candidate = await this.courseSearchService.getById(courseId);
          if (!courseMatchesActiveLanguagePair(candidate, pair)) {
            courseId = null;
          }
        } catch {
          courseId = null;
        }
      }

      if (!courseId) {
        // Fallback: курс радикалов по умолчанию
        courseId = RADICALS_COURSE_ID;
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

      const shouldPersistActiveCourse = !saved.activeCourseId || saved.activeCourseId !== courseId;
      if (shouldPersistActiveCourse) {
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

  /**
   * Sets the active course ID and persists it.
   *
   * @param courseId - The ID of the course to set as active.
   *
   * @remarks
   * Clears the saved last lesson and last scenario IDs, effectively resetting the resume
   * target so that the next `reload()` will resolve a fresh "Start" target.
   */
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
