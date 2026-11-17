import { Injectable, inject, signal } from '@angular/core';

import { CourseSearchService } from '../../../course/search/course-search.service';
import { LanguagePairsApiService } from '../../../language-pair/api/language-pairs-api.service';
import type { LanguagePairDto } from '../../../language-pair/api/language-pairs-api.types';
import { LanguageService } from '../../../language-pair/services/language.service';
import { LessonsApiService } from '../../../lesson/api/lessons-api.service';
import { ProgramsApiService } from '../../../program/api/programs-api.service';
import { ScenarioSearchService } from '../../../scenario/search/scenario-search.service';
import type {
  HierarchyLevel,
  HierarchyOption,
  HierarchyScope,
  HierarchyValue,
} from '../../model/content-hierarchy.types';

/**
 * Single source of truth for cascading content-hierarchy options.
 *
 * @remarks
 * Every option list is loaded from the backend tables through the existing API
 * services:
 *
 * - `language_pairs` → `GET /language-pairs`;
 * - `education_courses` → `GET /courses/search` filtered by `languagePairIds`;
 * - `education_programs` → `GET /programs/by-course/{courseId}`;
 * - `education_lessons` → `GET /lessons/by-program/{programId}`;
 * - `education_scenarios` → `GET /scenarios/by-lesson/{lessonId}`.
 *
 * The service caches lists per parent ID and exposes `hydrate()` so edit
 * dialogs can restore the full ancestor chain (`scenario → lesson → program →
 * course → language pair`) even when only the leaf ID is known.
 *
 * Production code must not use static option arrays. Constants are allowed
 * only in the mock layer (`entities/* /api/mock/**`) and fixture files.
 */
@Injectable()
export class ContentHierarchyService {
  private readonly languagePairsApi = inject(LanguagePairsApiService);
  private readonly languageService = inject(LanguageService);
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly programsApi = inject(ProgramsApiService);
  private readonly lessonsApi = inject(LessonsApiService);
  private readonly scenarioSearchService = inject(ScenarioSearchService);

  /** Whether language pairs are currently being loaded. */
  readonly languagePairsLoading = signal(false);
  /** Whether courses are currently being loaded. */
  readonly coursesLoading = signal(false);
  /** Whether programs are currently being loaded. */
  readonly programsLoading = signal(false);
  /** Whether lessons are currently being loaded. */
  readonly lessonsLoading = signal(false);
  /** Whether scenarios are currently being loaded. */
  readonly scenariosLoading = signal(false);

  private languagePairsCache: readonly HierarchyOption[] | null = null;
  private readonly coursesCache = new Map<string, readonly HierarchyOption[]>();
  private readonly programsCache = new Map<string, readonly HierarchyOption[]>();
  private readonly lessonsCache = new Map<string, readonly HierarchyOption[]>();
  private readonly scenariosCache = new Map<string, readonly HierarchyOption[]>();

  /**
   * Loads the `language_pairs` registry.
   *
   * @returns Options formatted as «Known → Learning» using the `languages`
   * dictionary. If the dictionary is unavailable, language codes are used.
   */
  async loadLanguagePairs(): Promise<readonly HierarchyOption[]> {
    if (this.languagePairsCache) {
      return this.languagePairsCache;
    }

    this.languagePairsLoading.set(true);
    try {
      await this.languageService.load();
      const pairs = await this.languagePairsApi.listAll();
      const labels = this.languageService.getLabels();
      this.languagePairsCache = pairs.map((pair) => toPairOption(pair, labels));
      return this.languagePairsCache;
    } finally {
      this.languagePairsLoading.set(false);
    }
  }

  /**
   * Loads courses of a language pair from `education_courses`.
   *
   * @param languagePairId - Numeric `language_pairs.id`.
   * @param scope - `all` for authoring, `published` for learner-facing UI.
   * @returns Course options; empty when no pair is selected.
   */
  async loadCourses(
    languagePairId: number | undefined,
    scope: HierarchyScope = 'all',
  ): Promise<readonly HierarchyOption[]> {
    if (languagePairId === undefined || !Number.isFinite(languagePairId)) {
      return [];
    }

    const key = `${languagePairId}:${scope}`;
    const cached = this.coursesCache.get(key);
    if (cached) {
      return cached;
    }

    this.coursesLoading.set(true);
    try {
      const page = await this.courseSearchService.search({
        scope,
        languagePairIds: [languagePairId],
        page: { page: 0, pageSize: 100 },
      });
      const options = page.items.map((course) => ({ id: course.id, title: course.title }));
      this.coursesCache.set(key, options);
      return options;
    } finally {
      this.coursesLoading.set(false);
    }
  }

  /**
   * Loads programs of a course from `education_programs`.
   *
   * @param courseId - Course ID.
   * @returns Program options; empty when no course is selected.
   */
  async loadPrograms(courseId: string | undefined): Promise<readonly HierarchyOption[]> {
    if (!courseId) {
      return [];
    }

    const cached = this.programsCache.get(courseId);
    if (cached) {
      return cached;
    }

    this.programsLoading.set(true);
    try {
      const programs = await this.programsApi.getByCourse(courseId);
      const options = programs.map((program) => ({ id: program.id, title: program.title }));
      this.programsCache.set(courseId, options);
      return options;
    } finally {
      this.programsLoading.set(false);
    }
  }

  /**
   * Loads lessons of a program from `education_lessons`.
   *
   * @param programId - Program ID.
   * @returns Lesson options; empty when no program is selected.
   */
  async loadLessons(programId: string | undefined): Promise<readonly HierarchyOption[]> {
    if (!programId) {
      return [];
    }

    const cached = this.lessonsCache.get(programId);
    if (cached) {
      return cached;
    }

    this.lessonsLoading.set(true);
    try {
      const lessons = await this.lessonsApi.getByProgramId(programId);
      const options = lessons.map((lesson) => ({ id: lesson.id, title: lesson.title }));
      this.lessonsCache.set(programId, options);
      return options;
    } finally {
      this.lessonsLoading.set(false);
    }
  }

  /**
   * Loads scenarios of a lesson from `education_scenarios`.
   *
   * @param lessonId - Lesson ID.
   * @returns Scenario options with real titles; empty when no lesson is selected.
   */
  async loadScenarios(lessonId: string | undefined): Promise<readonly HierarchyOption[]> {
    if (!lessonId) {
      return [];
    }

    const cached = this.scenariosCache.get(lessonId);
    if (cached) {
      return cached;
    }

    this.scenariosLoading.set(true);
    try {
      const scenarios = await this.scenarioSearchService.getByLessonId(lessonId);
      const options = scenarios.map((scenario) => ({
        id: scenario.id,
        title: scenario.title,
      }));
      this.scenariosCache.set(lessonId, options);
      return options;
    } finally {
      this.scenariosLoading.set(false);
    }
  }

  /**
   * Restores missing ancestor IDs for a hierarchy value.
   *
   * @remarks
   * Walks the chain from the deepest selected level upward:
   * `scenario → lesson → program → course → language pair`.
   * Used by edit dialogs that receive only a leaf ID from the content explorer.
   *
   * @param value - Partial hierarchy value.
   * @returns A new value with as many ancestors filled as the backend provides.
   */
  async hydrate(value: HierarchyValue): Promise<HierarchyValue> {
    let next: HierarchyValue = { ...value };

    if (
      next.scenarioId &&
      (!next.lessonId || !next.programId || !next.courseId || !next.languagePairId)
    ) {
      try {
        const scenario = await this.scenarioSearchService.getById(next.scenarioId);
        next = {
          ...next,
          lessonId: next.lessonId ?? scenario.lessonId,
          programId: next.programId ?? scenario.programId,
          courseId: next.courseId ?? scenario.courseId,
          languagePairId: next.languagePairId ?? scenario.languagePairId,
        };
      } catch {
        // Leave the value unchanged; the dialog can still show the leaf.
      }
    }

    if (next.lessonId && (!next.programId || !next.courseId || !next.languagePairId)) {
      try {
        const lesson = await this.lessonsApi.getById(next.lessonId);
        next = {
          ...next,
          programId: next.programId ?? lesson.programId,
          courseId: next.courseId ?? lesson.courseId,
          languagePairId: next.languagePairId ?? lesson.languagePairId,
        };
      } catch {
        // Ignore: the caller can fall back to the context IDs.
      }
    }

    if (next.programId && (!next.courseId || !next.languagePairId)) {
      try {
        const program = await this.programsApi.getById(next.programId);
        next = {
          ...next,
          courseId: next.courseId ?? program.courseId,
          languagePairId: next.languagePairId ?? program.languagePairId,
        };
      } catch {
        // Ignore.
      }
    }

    if (next.courseId && !next.languagePairId) {
      try {
        const course = await this.courseSearchService.getById(next.courseId);
        next = { ...next, languagePairId: course.languagePairId };
      } catch {
        // Ignore.
      }
    }

    return next;
  }

  /**
   * Invalidates cached option lists.
   *
   * @param level - Level to invalidate. When omitted, all caches are cleared.
   * @param parentId - Parent ID whose list should be dropped.
   */
  invalidate(level?: HierarchyLevel, parentId?: string | number): void {
    if (!level) {
      this.languagePairsCache = null;
      this.coursesCache.clear();
      this.programsCache.clear();
      this.lessonsCache.clear();
      this.scenariosCache.clear();
      return;
    }

    switch (level) {
      case 'languagePair':
        this.languagePairsCache = null;
        this.coursesCache.clear();
        break;
      case 'course':
        this.coursesCache.clear();
        if (parentId !== undefined) {
          this.programsCache.delete(String(parentId));
        }
        break;
      case 'program':
        if (parentId !== undefined) {
          this.programsCache.delete(String(parentId));
        } else {
          this.programsCache.clear();
        }
        break;
      case 'lesson':
        if (parentId !== undefined) {
          this.lessonsCache.delete(String(parentId));
        } else {
          this.lessonsCache.clear();
        }
        break;
      case 'scenario':
        if (parentId !== undefined) {
          this.scenariosCache.delete(String(parentId));
        } else {
          this.scenariosCache.clear();
        }
        break;
    }
  }
}

function toPairOption(pair: LanguagePairDto, labels: Record<string, string>): HierarchyOption {
  const known = labels[pair.knownCode] ?? pair.knownCode;
  const learning = labels[pair.learningCode] ?? pair.learningCode;
  return { id: pair.id, title: `${known} → ${learning}` };
}
