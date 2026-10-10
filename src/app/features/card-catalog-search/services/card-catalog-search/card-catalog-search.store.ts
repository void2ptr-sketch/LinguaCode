import { Injectable, computed, inject, signal } from '@angular/core';
import type { PageEvent } from '@angular/material/paginator';

import { CardSearchService } from '../../../../core/repositories';
import { formatLanguagePair } from '../../../../core/domain/language-pair/language-pair.utils';
import type {
  CardDifficulty,
  CardKind,
  CardSearchCriteria,
  CardSearchPage,
  ContentLanguage,
} from '../../../../core/models';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../../../shared/utils/pagination';
import {
  CardCatalogHierarchyService,
  type CourseOption,
  type LessonOption,
  type ScenarioOption,
} from '../../';

/**
 * Store for the card catalog search feature.
 *
 * @remarks
 * Manages search filters (query, language pair, difficulty, kinds, tags),
 * course/lesson/scenario hierarchy, and pagination. Delegates actual search
 * to `CardSearchService`.
 */
@Injectable()
export class CardCatalogSearchStore {
  private readonly cardSearchService = inject(CardSearchService);
  private readonly hierarchyService = inject(CardCatalogHierarchyService);

  /** Search query text. */
  readonly query = signal('');
  /** Known content language filter. */
  readonly knownLanguage = signal<ContentLanguage | null>(null);
  /** Learning content language filter. */
  readonly learningLanguage = signal<ContentLanguage | null>(null);
  /** Difficulty filter. */
  readonly difficulty = signal<CardDifficulty | null>(null);
  /** Selected card kinds. */
  readonly selectedKinds = signal<readonly CardKind[]>([]);
  /** Selected tags. */
  readonly selectedTags = signal<readonly string[]>([]);
  /** Selected course ID for hierarchy filter. */
  readonly selectedCourseId = signal<string | null>(null);
  /** Selected lesson ID for hierarchy filter. */
  readonly selectedLessonId = signal<string | null>(null);
  /** Selected scenario ID for hierarchy filter. */
  readonly selectedScenarioId = signal<string | null>(null);
  /** Current zero-based page index. */
  readonly pageIndex = signal(0);
  /** Items per page. */
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  /** Whether the language pair is locked (e.g. from URL params). */
  readonly pairLocked = signal(false);

  /** Available page size options. */
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  /** Loading state delegated from `CardSearchService`. */
  readonly loading = computed(() => this.cardSearchService.loading());
  /** Error state delegated from `CardSearchService`. */
  readonly error = computed(() => this.cardSearchService.error());
  /** Current search result. */
  readonly result = signal<CardSearchPage | null>(null);

  /** Search result entries (derived from `result`). */
  readonly entries = computed(() => {
    const result = this.result();
    return result ? result.items : [];
  });
  /** Search result facets (derived from `result`). */
  readonly facets = computed(() => this.result()?.facets ?? null);
  /** Total result count (derived from `result`). */
  readonly totalItems = computed(() => this.result()?.totalItems ?? 0);

  /** Available courses for the current language pair. */
  readonly availableCourses = signal<readonly CourseOption[]>([]);
  /** Available lessons for the selected course. */
  readonly availableLessons = signal<readonly LessonOption[]>([]);
  /** Available scenarios for the selected lesson. */
  readonly availableScenarios = signal<readonly ScenarioOption[]>([]);

  /** Courses loading state delegated from hierarchy service. */
  readonly coursesLoading = computed(() => this.hierarchyService.coursesLoading());
  /** Lessons loading state delegated from hierarchy service. */
  readonly lessonsLoading = computed(() => this.hierarchyService.lessonsLoading());

  /** Human-readable label for the locked language pair (e.g. "Русский → English"). */
  readonly lockedPairLabel = computed(() => {
    const known = this.knownLanguage();
    const learning = this.learningLanguage();

    if (!known || !learning) {
      return '';
    }

    return formatLanguagePair({ known, learning });
  });

  /**
   * Initializes the store and executes the initial search.
   */
  async init(): Promise<void> {
    await this.executeSearch();
  }

  /**
   * Initializes the store with the active language pair locked.
   *
   * @param known - The known content language.
   * @param learning - The learning content language.
   */
  async initWithActivePair(known: ContentLanguage, learning: ContentLanguage): Promise<void> {
    this.pairLocked.set(true);
    this.knownLanguage.set(known);
    this.learningLanguage.set(learning);
    const pairKey = this.languagePairKey(known, learning);
    this.hierarchyService.invalidateCache(pairKey);
    await this.loadCourses(pairKey);
    await this.executeSearch();
  }

  /**
   * Reloads the search results.
   */
  reload(): void {
    void this.init();
  }

  /**
   * Sets the search query and resets to page 0.
   *
   * @param value - The search query.
   */
  setQuery(value: string): void {
    this.query.set(value);
    this.resetPageAndSearch();
  }

  /**
   * Sets the known language filter and resets to page 0.
   *
   * @param value - The known content language, or `null` to clear.
   */
  setKnownLanguage(value: ContentLanguage | null): void {
    if (this.pairLocked()) {
      return;
    }

    this.knownLanguage.set(value);
    this.resetPageAndSearch();
  }

  /**
   * Sets the learning language filter and resets to page 0.
   *
   * @param value - The learning content language, or `null` to clear.
   */
  setLearningLanguage(value: ContentLanguage | null): void {
    if (this.pairLocked()) {
      return;
    }

    this.learningLanguage.set(value);
    this.resetPageAndSearch();
  }

  /**
   * Sets the difficulty filter and resets to page 0.
   *
   * @param value - The difficulty level, or `null` to clear.
   */
  setDifficulty(value: CardDifficulty | null): void {
    this.difficulty.set(value);
    this.resetPageAndSearch();
  }

  /**
   * Toggles a card kind in the selected kinds.
   *
   * @param kind - The card kind to toggle.
   */
  toggleKind(kind: CardKind): void {
    const current = this.selectedKinds();
    this.selectedKinds.set(
      current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind],
    );
    this.resetPageAndSearch();
  }

  /**
   * Toggles a tag in the selected tags.
   *
   * @param tag - The tag to toggle.
   */
  toggleTag(tag: string): void {
    const current = this.selectedTags();
    this.selectedTags.set(
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
    this.resetPageAndSearch();
  }

  /**
   * Sets the course filter and loads associated lessons.
   *
   * @param courseId - The course ID, or `null` to clear.
   */
  async setCourse(courseId: string | null): Promise<void> {
    this.selectedCourseId.set(courseId);
    this.selectedLessonId.set(null);
    this.selectedScenarioId.set(null);
    this.availableLessons.set([]);
    this.availableScenarios.set([]);

    if (courseId) {
      const lessons = await this.hierarchyService.loadLessons(courseId);
      this.availableLessons.set(lessons);
    }

    this.resetPageAndSearch();
  }

  /**
   * Sets the lesson filter and loads associated scenarios.
   *
   * @param lessonId - The lesson ID, or `null` to clear.
   */
  async setLesson(lessonId: string | null): Promise<void> {
    this.selectedLessonId.set(lessonId);
    this.selectedScenarioId.set(null);
    this.availableScenarios.set([]);

    if (lessonId) {
      const courseId = this.selectedCourseId();
      if (courseId) {
        const scenarios = this.hierarchyService.getScenariosForLesson(courseId, lessonId);
        this.availableScenarios.set(scenarios);
      }
    }

    this.resetPageAndSearch();
  }

  /**
   * Sets the scenario filter.
   *
   * @param scenarioId - The scenario ID, or `null` to clear.
   */
  setScenario(scenarioId: string | null): void {
    this.selectedScenarioId.set(scenarioId);
    this.resetPageAndSearch();
  }

  /**
   * Clears all search filters and resets pagination.
   *
   * @remarks
   * Preserves locked language pair settings.
   */
  clearFilters(): void {
    const lockedKnown = this.pairLocked() ? this.knownLanguage() : null;
    const lockedLearning = this.pairLocked() ? this.learningLanguage() : null;

    this.query.set('');
    this.knownLanguage.set(lockedKnown);
    this.learningLanguage.set(lockedLearning);
    this.difficulty.set(null);
    this.selectedKinds.set([]);
    this.selectedTags.set([]);
    this.selectedCourseId.set(null);
    this.selectedLessonId.set(null);
    this.selectedScenarioId.set(null);
    this.availableLessons.set([]);
    this.availableScenarios.set([]);
    this.resetPageAndSearch();
  }

  /**
   * Handles paginator page changes.
   *
   * @param event - The page event from Angular Material paginator.
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    void this.executeSearch();
  }

  /**
   * Applies a locked language pair and reloads courses.
   *
   * @param known - The known content language.
   * @param learning - The learning content language.
   */
  applyLanguagePair(known: ContentLanguage, learning: ContentLanguage): void {
    this.pairLocked.set(true);
    this.knownLanguage.set(known);
    this.learningLanguage.set(learning);
    const pairKey = this.languagePairKey(known, learning);
    this.hierarchyService.invalidateCache(pairKey);
    void this.loadCourses(pairKey);
    this.resetPageAndSearch();
  }

  private async loadCourses(languagePairKey: string): Promise<void> {
    const known = this.knownLanguage();
    const learning = this.learningLanguage();

    if (!known || !learning) {
      return;
    }

    const courses = await this.hierarchyService.loadCourses(known, learning, languagePairKey);
    this.availableCourses.set(courses);
  }

  private resetPageAndSearch(): void {
    this.pageIndex.set(0);
    void this.executeSearch();
  }

  private languagePairKey(known: ContentLanguage, learning: ContentLanguage): string {
    return `${known}_${learning}`;
  }

  private async executeSearch(): Promise<void> {
    try {
      const result = await this.cardSearchService.search(this.currentCriteria());
      this.result.set(result);
    } catch {
      this.result.set(null);
    }
  }

  currentCriteria(): CardSearchCriteria {
    return {
      query: this.query().trim() || undefined,
      knownLanguage: this.knownLanguage() ?? undefined,
      learningLanguage: this.learningLanguage() ?? undefined,
      difficulty: this.difficulty() ?? undefined,
      kinds: this.selectedKinds().length > 0 ? this.selectedKinds() : undefined,
      tags: this.selectedTags().length > 0 ? this.selectedTags() : undefined,
      courseId: this.selectedCourseId() ?? undefined,
      lessonId: this.selectedLessonId() ?? undefined,
      scenarioId: this.selectedScenarioId() ?? undefined,
      page: {
        page: this.pageIndex(),
        pageSize: this.pageSize(),
      },
    };
  }
}
