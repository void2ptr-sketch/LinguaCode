import { Injectable, computed, inject, signal } from '@angular/core';

import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import {
  buildLessonRoadmap,
  collectScenarioIds,
  courseMatchesActiveLanguagePair,
  inferActiveCourseId,
  resolveLearningResumeTarget,
  type LearningResumeTarget,
  type LessonRoadmapItem,
} from '../lib/learning-resume.utils';
import { CourseSearchService } from '../../../entities/course/search/course-search.service';
import { resolveLearningSessionForPair } from '../lib/learning-session.utils';
import { getScenarioSeedCache } from '../../../entities/content-seed/content-seed.cache';
import type { Course, ProgramWithLessons } from '../../../entities/course/model';
import { CPP_COMPLETE_COURSE_ID } from '../../../entities/course/model';
import { LearningResultsStore } from '../model/learning-results.store';
import { UserStore } from '../../../entities/user/model/user.store';
import { RADICALS_COURSE_ID } from '../../../entities/chinese/lib/tones/radicals-course.defaults';

/**
 * Service for the learning dashboard (home page).
 *
 * @remarks
 * Loads the active course, builds the lesson roadmap, and determines the resume target
 * (where to continue learning from). Falls back to the radicals course when no active course exists.
 */
@Injectable({ providedIn: 'root' })
export class LearningDashboardService {
  private readonly courseSearchService = inject<CourseSearchService>(CourseSearchService);
  private readonly userStore = inject<UserStore>(UserStore);
  private readonly resultsStore = inject<LearningResultsStore>(LearningResultsStore);
  private readonly logger = inject<AppLoggerService>(AppLoggerService);

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
   * The currently loaded course with its programs.
   *
   * @remarks
   * Set by `reload()` after fetching course data. `null` when no course is active.
   */
  readonly course = signal<Course | null>(null);

  /**
   * The currently loaded program (active track).
   *
   * @remarks
   * Set by `reload()` after resolving the active program from saved state. `null` when no program is active.
   */
  readonly program = signal<ProgramWithLessons | null>(null);

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
   * Computed progress for the currently loaded program.
   *
   * @remarks
   * Returns `null` when no program is loaded.
   */
  readonly courseProgress = computed(() => {
    const program = this.program();
    if (!program) {
      return null;
    }

    const lessons = program.lessons.map((lesson) => ({
      lessonId: lesson.id,
      scenarioIds: lesson.scenarioIds,
    }));

    const courseId = this.course()?.id;
    if (!courseId) {
      return null;
    }

    return this.resultsStore.courseProgress(courseId, lessons);
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
        } catch (error) {
          this.logger.warn('LearningDashboard: failed to validate active course', error);
          courseId = null;
        }
      }

      if (!courseId) {
        // Гарантированный fallback — курс радикалов (как раньше).
        courseId = RADICALS_COURSE_ID;
        // По умолчанию предпочитаем C++ Complete Course, если он доступен.
        try {
          const cppCourse = await this.courseSearchService.getById(CPP_COMPLETE_COURSE_ID);
          if (cppCourse) {
            courseId = CPP_COMPLETE_COURSE_ID;
          }
        } catch {
          // C++ курс недоступен — остаёмся на курсе радикалов.
        }
      }

      if (!courseId) {
        this.course.set(null);
        this.program.set(null);
        this.resumeTarget.set({
          kind: 'no-program',
          courseId: '',
          courseTitle: '',
          programId: '',
          programTitle: '',
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

      // Resolve active program from saved state or use the first program
      const savedProgramId = saved.activeProgramId;
      const programs =
        (
          course as unknown as {
            programs: import('../../../entities/program/model/program.types').Program[];
          }
        ).programs ?? [];
      let activeProgram = programs.find((p) => p.id === savedProgramId) ?? programs[0];

      if (!activeProgram && programs.length > 0) {
        // Load first program with lessons
        activeProgram = (await this.courseSearchService.getProgramById(
          programs[0].id,
        )) as unknown as import('../../../entities/program/model/program.types').ProgramWithLessons;
      }

      if (activeProgram) {
        this.program.set(
          activeProgram as unknown as import('../../../entities/program/model/program.types').ProgramWithLessons,
        );
      }

      const shouldPersistActiveCourse = !saved.activeCourseId || saved.activeCourseId !== courseId;
      if (shouldPersistActiveCourse) {
        queueMicrotask(() => {
          this.userStore.updateActiveLanguagePairSettings({
            learning: { activeCourseId: courseId },
          });
        });
      }

      const activeProgramForResume = this.program();
      if (!activeProgramForResume) {
        this.resumeTarget.set(null);
        this.roadmap.set([]);
        return;
      }

      const scenarioTitles = await this.loadScenarioTitles(
        collectScenarioIds(activeProgramForResume),
      );
      const target = resolveLearningResumeTarget({
        course,
        program: activeProgramForResume,
        saved,
        pairResults,
        hasScenarioResult,
        scenarioTitles,
      });

      this.resumeTarget.set(target);
      this.roadmap.set(buildLessonRoadmap(activeProgramForResume.lessons, hasScenarioResult));
    } catch (error) {
      this.logger.error('LearningDashboard: failed to load learning program', error);
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
   * Clears the saved last lesson, last scenario, and active program IDs, effectively resetting the resume
   * target so that the next `reload()` will resolve a fresh "Start" target.
   */
  setActiveCourseId(courseId: string): void {
    this.userStore.updateActiveLanguagePairSettings({
      learning: {
        activeCourseId: courseId,
        activeProgramId: undefined,
        lastLessonId: undefined,
        lastScenarioId: undefined,
      },
    });
  }

  private loadScenarioTitles(scenarioIds: readonly string[]): Readonly<Record<string, string>> {
    const seedScenarios = getScenarioSeedCache();
    const titles: Record<string, string> = {};

    for (const scenarioId of scenarioIds) {
      const seed = seedScenarios.find((s) => s.id === scenarioId);
      if (seed) {
        titles[scenarioId] = seed.title;
      }
    }

    return titles;
  }
}
