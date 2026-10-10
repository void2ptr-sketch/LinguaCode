import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  buildLessonsById,
  isLessonUnlocked,
  prerequisiteBlockReason,
} from '../../../core/domain/lesson/lesson-prerequisites.utils';
import { CourseSearchService } from '../../../core/repositories';
import type { Lesson } from '../../../core/models';
import { LearningResultsStore } from '../../../core/state';

/**
 * Payload emitted when a lesson is picked.
 *
 * @property lessonId - The unique identifier of the selected lesson.
 * @property title - The display title of the selected lesson.
 * @property scenarioIds - Array of scenario IDs contained in the selected lesson.
 */
export type LessonPickPayload = {
  lessonId: string;
  title: string;
  scenarioIds: readonly string[];
};

type LessonListItem = {
  lesson: Lesson;
  unlocked: boolean;
  completed: boolean;
  completedScenarios: number;
  blockReason: string | null;
};

/**
 * Lesson picker component. Displays a list of lessons for a given course,
 * with unlock status, completion indicators, and prerequisite enforcement.
 *
 * @remarks
 * Loads lessons from `CourseSearchService`, computes unlock state based on
 * scenario results, and supports auto-picking the first unlocked lesson.
 */
@Component({
  selector: 'app-lesson-picker',
  imports: [MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './lesson-picker.component.html',
  styleUrl: './lesson-picker.component.scss',
})
export class LessonPickerComponent {
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly resultsStore = inject(LearningResultsStore);

  /**
   * ID of the course whose lessons to display.
   * @remarks
   * Required input that triggers lesson loading when changed.
   */
  readonly selectedCourseId = input.required<string>();

  /**
   * ID of the currently selected lesson.
   * @remarks
   * Required input. Updated via `selectedLessonIdChange` output when the user picks a lesson.
   */
  readonly selectedLessonId = input.required<string>();

  /**
   * Automatically pick the first unlocked lesson when the list loads.
   * @remarks
   * When true and the current selection is locked or empty, selects the first available lesson.
   */
  readonly autoPickFirstLesson = input(false);

  /**
   * Hide the lesson title in the display.
   * @remarks
   * When true, the lesson title is omitted from the rendered list items.
   */
  readonly hideTitle = input(false);

  /**
   * Enforce lesson prerequisites (locked lessons shown as unavailable).
   * @remarks
   * When true (default), lessons with unmet prerequisites are shown as locked.
   * When false, all lessons are displayed as available.
   */
  readonly enforcePrerequisites = input(true);

  /**
   * Emits when the selected lesson ID changes.
   * @remarks Payload is the new lesson ID string.
   */
  readonly selectedLessonIdChange = output<string>();

  /**
   * Emits when the user picks a lesson.
   * @remarks
   * Payload includes the lesson ID, title, and the array of scenario IDs for that lesson.
   */
  readonly lessonPickChange = output<LessonPickPayload>();

  /**
   * List of lessons for the selected course.
   * @remarks
   * Populated by `loadLessons()` after a successful course fetch.
   */
  readonly lessons = signal<readonly Lesson[]>([]);

  /**
   * Whether lesson data is currently being loaded.
   * @remarks
   * Set to true at the start of `loadLessons()` and reset in the finally block.
   */
  readonly loading = signal(false);

  /**
   * Error message from a failed lesson load, or null.
   * @remarks
   * Set to an error string when the course fetch fails.
   */
  readonly error = signal<string | null>(null);

  /**
   * Computed list of lessons with unlock status and completion data.
   * @remarks
   * Each item includes the lesson, unlocked status, completion state,
   * completed scenario count, and optional block reason.
   */
  readonly lessonItems = computed<readonly LessonListItem[]>(() => {
    const lessons = this.lessons();
    const lessonsById = buildLessonsById(lessons);
    const hasScenarioResult = (scenarioId: string) =>
      this.resultsStore.resultsForScenario(scenarioId).length > 0;
    const enforcePrerequisites = this.enforcePrerequisites();

    return lessons.map((lesson) => {
      const completedScenarios = lesson.scenarioIds.filter((scenarioId) =>
        hasScenarioResult(scenarioId),
      ).length;
      const unlocked =
        enforcePrerequisites && isLessonUnlocked(lesson, lessonsById, hasScenarioResult);

      return {
        lesson,
        unlocked: enforcePrerequisites ? unlocked : true,
        completed: this.resultsStore.isLessonCompleted(lesson.scenarioIds),
        completedScenarios,
        blockReason: enforcePrerequisites
          ? prerequisiteBlockReason(lesson, lessons, hasScenarioResult)
          : null,
      };
    });
  });

  private readonly loadOnCourseChange = effect(() => {
    const courseId = this.selectedCourseId();
    void this.loadLessons(courseId);
  });

  private readonly pickFirstUnlocked = effect(() => {
    if (!this.autoPickFirstLesson()) {
      return;
    }

    const items = this.lessonItems();
    const current = this.selectedLessonId();
    const currentItem = items.find((item) => item.lesson.id === current);

    if (currentItem?.unlocked) {
      return;
    }

    const firstUnlocked = items.find((item) => item.unlocked);
    if (firstUnlocked) {
      this.pick(firstUnlocked.lesson);
    }
  });

  /**
   * Loads lessons for the specified course from `CourseSearchService`.
   *
   * @param courseId - The ID of the course to load lessons for.
   * @remarks
   * Clears existing lessons and errors, sets loading to true, fetches the course,
   * sorts lessons by order, and updates the lessons signal. Sets error on failure.
   */
  async loadLessons(courseId: string): Promise<void> {
    this.lessons.set([]);
    this.error.set(null);

    if (!courseId) {
      return;
    }

    this.loading.set(true);

    try {
      const course = await this.courseSearchService.getById(courseId);
      const sorted = [...course.lessons].sort((left, right) => left.order - right.order);
      this.lessons.set(sorted);
    } catch {
      this.error.set('Не удалось загрузить уроки курса');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Picks a lesson and emits selection events.
   *
   * @param lesson - The lesson to pick.
   * @remarks No-op if the lesson is locked due to prerequisites.
   */
  pick(lesson: Lesson): void {
    const lessonsById = buildLessonsById(this.lessons());
    const hasScenarioResult = (scenarioId: string) =>
      this.resultsStore.resultsForScenario(scenarioId).length > 0;

    if (!isLessonUnlocked(lesson, lessonsById, hasScenarioResult)) {
      return;
    }

    this.selectedLessonIdChange.emit(lesson.id);
    this.emitLesson(lesson);
  }

  private emitLesson(lesson: Lesson): void {
    this.lessonPickChange.emit({
      lessonId: lesson.id,
      title: lesson.title,
      scenarioIds: lesson.scenarioIds,
    });
  }
}
