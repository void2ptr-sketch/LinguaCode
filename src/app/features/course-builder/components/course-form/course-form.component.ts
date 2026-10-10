import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

import { activeLanguagePairCriteria } from '../../../../core/domain/language-pair/language-pair-scope.utils';
import { courseAuthoringWithIdea } from '../../../../core/repositories/courses/utils/course-authoring.utils';
import { ScenarioSearchService } from '../../../../core/repositories';
import type { CourseAuthoringStatus } from '../../../../core/models';
import { COURSE_AUTHORING_STATUSES } from '../../../../core/models';
import type { ScenarioIndexEntry } from '../../../../core/models';
import { UserStore } from '../../../../core/state';
import { MarkdownFieldComponent } from '../../../../shared/utils/markdown-field';
import type { CourseFormDraft, LessonFormDraft } from '../../types';
import { emptyLessonFormDraft, lessonDraftKey } from '../../utils/course-form-draft.utils';

/**
 * Full form component for creating and editing courses.
 *
 * Provides UI controls for course title, description, lessons (with scenarios and prerequisites),
 * and authoring metadata (status, idea).
 *
 * @remarks
 * Loads available scenarios from `ScenarioSearchService` on initialization.
 * Emits draft updates through the `draftChange` output for parent component synchronization.
 * @see CourseFormDraft
 * @see LessonFormDraft
 */
@Component({
  selector: 'app-course-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MarkdownFieldComponent,
  ],
  templateUrl: './course-form.component.html',
  styleUrl: './course-form.component.scss',
})
export class CourseFormComponent implements OnInit {
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly userStore = inject(UserStore);

  /**
   * Required course form draft being edited or created.
   *
   * @remarks
   * Immutable from the component's perspective — use `draftChange` to emit updates.
   */
  readonly draft = input.required<CourseFormDraft>();
  /**
   * Whether the form is in read-only mode.
   *
   * @remarks
   * When `true`, all input controls are disabled and no changes can be made.
   */
  readonly readOnly = input(false);

  /**
   * Emits the updated course form draft when the user makes changes.
   *
   * @remarks
   * The parent component (e.g., `CourseBuilderDialogComponent`) listens to this
   * output and updates its own signal with the new draft value.
   */
  readonly draftChange = output<CourseFormDraft>();
  /**
   * Emits when the user requests PDF export.
   *
   * @remarks
   * The payload indicates whether hints (correct answers) should be included.
   */
  readonly exportPdf = output<boolean>();

  /**
   * Utility function for generating unique lesson draft keys.
   *
   * @remarks
   * Used in templates for `ngModel` bindings and prerequisite selection.
   */
  readonly lessonDraftKey = lessonDraftKey;

  /**
   * Available scenarios for assignment to lessons.
   *
   * @remarks
   * Populated from `ScenarioSearchService` during initialization.
   * Filtered by the current language pair and published scope.
   */
  readonly scenarioOptions = signal<readonly ScenarioIndexEntry[]>([]);
  /** Available authoring status options (e.g., 'draft', 'planned', 'generating'). */
  readonly authoringStatusOptions = COURSE_AUTHORING_STATUSES;

  /**
   * Human-readable labels for course authoring status values.
   *
   * @remarks
   * Maps each `CourseAuthoringStatus` value to its display name in Russian.
   */
  readonly authoringStatusLabels: Record<CourseAuthoringStatus, string> = {
    draft: 'Черновик',
    planned: 'План готов',
    generating: 'Генерация',
    materialized: 'Материализовано',
    failed: 'Ошибка',
  };

  async ngOnInit(): Promise<void> {
    const pair = this.userStore.languagePair();
    const page = await this.scenarioSearchService.search({
      scope: 'published',
      ...activeLanguagePairCriteria(pair),
      page: { page: 0, pageSize: 100 },
    });
    this.scenarioOptions.set(page.items);
  }

  /**
   * Emits the updated draft to the parent component.
   *
   * @param nextDraft — The new course form draft value.
   */
  updateDraft(nextDraft: CourseFormDraft): void {
    this.draftChange.emit(nextDraft);
  }

  /**
   * Updates the course title in the draft.
   *
   * @param value — The new title string.
   */
  updateTitle(value: string): void {
    this.updateDraft({ ...this.draft(), title: value });
  }

  /**
   * Updates the course description in the draft.
   *
   * @param value — The new description string.
   */
  updateDescription(value: string): void {
    this.updateDraft({ ...this.draft(), description: value });
  }

  /**
   * Toggles the published flag in the draft.
   *
   * @param value — Whether the course should be published.
   */
  updatePublished(value: boolean): void {
    this.updateDraft({ ...this.draft(), published: value });
  }

  /**
   * Updates the authoring idea in the draft.
   *
   * @param value — The new idea text (Markdown).
   */
  updateAuthoringIdea(value: string): void {
    this.updateDraft({
      ...this.draft(),
      authoring: courseAuthoringWithIdea(this.draft().authoring, value),
    });
  }

  /**
   * Updates the authoring status in the draft.
   *
   * @param value — The new `CourseAuthoringStatus` value.
   */
  updateAuthoringStatus(value: CourseAuthoringStatus): void {
    this.updateDraft({
      ...this.draft(),
      authoring: { ...this.draft().authoring, status: value },
    });
  }

  /**
   * Updates the title of a specific lesson.
   *
   * @param index — The zero-based index of the lesson.
   * @param value — The new lesson title.
   */
  updateLessonTitle(index: number, value: string): void {
    const lesson = this.draft().lessons[index];
    if (!lesson) {
      return;
    }

    this.updateLesson(index, { ...lesson, title: value });
  }

  /**
   * Updates the description of a specific lesson.
   *
   * @param index — The zero-based index of the lesson.
   * @param value — The new lesson description.
   */
  updateLessonDescription(index: number, value: string): void {
    const lesson = this.draft().lessons[index];
    if (!lesson) {
      return;
    }

    this.updateLesson(index, { ...lesson, description: value });
  }

  /**
   * Updates the assigned scenario IDs for a specific lesson.
   *
   * @param index — The zero-based index of the lesson.
   * @param scenarioIds — The new array of scenario IDs.
   */
  updateLessonScenarioIds(index: number, scenarioIds: readonly string[]): void {
    const lesson = this.draft().lessons[index];
    if (!lesson) {
      return;
    }

    this.updateLesson(index, { ...lesson, scenarioIds });
  }

  /**
   * Updates the prerequisite lesson IDs for a specific lesson.
   *
   * @param index — The zero-based index of the lesson.
   * @param prerequisiteLessonIds — The new array of prerequisite lesson keys.
   */
  updateLessonPrerequisites(index: number, prerequisiteLessonIds: readonly string[]): void {
    const lesson = this.draft().lessons[index];
    if (!lesson) {
      return;
    }

    this.updateLesson(index, { ...lesson, prerequisiteLessonIds });
  }

  /**
   * Returns a display label for a lesson.
   *
   * @param lesson — The lesson form draft.
   * @param index — The zero-based index of the lesson.
   * @returns The lesson title if non-empty, otherwise "Урок N" (where N is 1-based index).
   */
  lessonLabel(lesson: LessonFormDraft, index: number): string {
    return lesson.title.trim() || `Урок ${index + 1}`;
  }

  /**
   * Returns the list of prerequisite options for a specific lesson.
   *
   * @remarks
   * Excludes the lesson itself from the options to prevent self-references.
   *
   * @param index — The zero-based index of the target lesson.
   * @returns Array of `{ key, label, index }` objects for other lessons.
   */
  prerequisiteOptions(index: number): readonly { key: string; label: string }[] {
    return this.draft()
      .lessons.map((lesson, lessonIndex) => ({
        key: lessonDraftKey(lesson),
        label: this.lessonLabel(lesson, lessonIndex),
        index: lessonIndex,
      }))
      .filter((option) => option.index !== index);
  }

  /**
   * Returns the currently selected prerequisite lesson IDs for a specific lesson.
   *
   * @param index — The zero-based index of the lesson.
   * @returns Array of prerequisite lesson keys, or empty array if lesson not found.
   */
  prerequisiteSelection(index: number): readonly string[] {
    const lesson = this.draft().lessons[index];
    if (!lesson) {
      return [];
    }

    return lesson.prerequisiteLessonIds;
  }

  /**
   * Replaces a lesson at a specific index with the provided lesson draft.
   *
   * @param index — The zero-based index of the lesson to replace.
   * @param lesson — The new lesson draft.
   */
  updateLesson(index: number, lesson: LessonFormDraft): void {
    const lessons = this.draft().lessons.map((item, itemIndex) =>
      itemIndex === index ? lesson : item,
    );
    this.updateDraft({ ...this.draft(), lessons });
  }

  /**
   * Appends a new empty lesson to the draft.
   *
   * @remarks
   * Assigns the next available order number.
   */
  addLesson(): void {
    const lessons = [...this.draft().lessons, emptyLessonFormDraft(this.draft().lessons.length)];
    this.updateDraft({ ...this.draft(), lessons });
  }

  /**
   * Removes a lesson at the specified index.
   *
   * @remarks
   * Prevents removal if there is only one lesson. Cleans up prerequisite references
   * to the removed lesson from other lessons.
   *
   * @param index — The zero-based index of the lesson to remove.
   */
  removeLesson(index: number): void {
    if (this.draft().lessons.length <= 1) {
      return;
    }

    const removedKey = lessonDraftKey(this.draft().lessons[index]);
    const lessons = this.draft()
      .lessons.filter((_, itemIndex) => itemIndex !== index)
      .map((lesson, order) => ({
        ...lesson,
        order,
        prerequisiteLessonIds: lesson.prerequisiteLessonIds.filter((key) => key !== removedKey),
      }));
    this.updateDraft({ ...this.draft(), lessons });
  }
}
