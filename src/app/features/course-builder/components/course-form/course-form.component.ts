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

import { activeLanguagePairCriteria } from '../../../../core/data/language-pair/language-pair-scope.utils';
import { courseAuthoringWithIdea } from '../../../../core/data/courses/course-authoring.utils';
import { ScenarioSearchService } from '../../../../core/data';
import type { CourseAuthoringStatus } from '../../../../core/models';
import { COURSE_AUTHORING_STATUSES } from '../../../../core/models';
import type { ScenarioIndexEntry } from '../../../../core/models';
import { UserStore } from '../../../../core/state';
import { MarkdownFieldComponent } from '../../../../shared/utils/markdown-field';
import type { CourseFormDraft, LessonFormDraft } from '../../types';
import { emptyLessonFormDraft, lessonDraftKey } from '../../utils/course-form-draft.utils';

/**
 * Course form component. Provides a full form for creating and editing courses,
 * including title, description, lessons, scenarios, and authoring status.
 * @remarks Loads available scenarios from the scenario search service on init.
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

  /** Required course form draft being edited. */
  readonly draft = input.required<CourseFormDraft>();
  /** Whether the form is in read-only mode. */
  readonly readOnly = input(false);

  /** Emits the updated course form draft when the user makes changes. */
  readonly draftChange = output<CourseFormDraft>();
  /** Emits when the user requests PDF export (payload: withHints). */
  readonly exportPdf = output<boolean>();

  /** Utility function for generating lesson draft keys. */
  readonly lessonDraftKey = lessonDraftKey;

  /** Available scenarios for assignment to lessons. */
  readonly scenarioOptions = signal<readonly ScenarioIndexEntry[]>([]);
  /** Available authoring status options. */
  readonly authoringStatusOptions = COURSE_AUTHORING_STATUSES;

  /** Labels for course authoring statuses. */
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

  updateDraft(nextDraft: CourseFormDraft): void {
    this.draftChange.emit(nextDraft);
  }

  updateTitle(value: string): void {
    this.updateDraft({ ...this.draft(), title: value });
  }

  updateDescription(value: string): void {
    this.updateDraft({ ...this.draft(), description: value });
  }

  updatePublished(value: boolean): void {
    this.updateDraft({ ...this.draft(), published: value });
  }

  updateAuthoringIdea(value: string): void {
    this.updateDraft({
      ...this.draft(),
      authoring: courseAuthoringWithIdea(this.draft().authoring, value),
    });
  }

  updateAuthoringStatus(value: CourseAuthoringStatus): void {
    this.updateDraft({
      ...this.draft(),
      authoring: { ...this.draft().authoring, status: value },
    });
  }

  updateLessonTitle(index: number, value: string): void {
    const lesson = this.draft().lessons[index];
    if (!lesson) {
      return;
    }

    this.updateLesson(index, { ...lesson, title: value });
  }

  updateLessonDescription(index: number, value: string): void {
    const lesson = this.draft().lessons[index];
    if (!lesson) {
      return;
    }

    this.updateLesson(index, { ...lesson, description: value });
  }

  updateLessonScenarioIds(index: number, scenarioIds: readonly string[]): void {
    const lesson = this.draft().lessons[index];
    if (!lesson) {
      return;
    }

    this.updateLesson(index, { ...lesson, scenarioIds });
  }

  updateLessonPrerequisites(index: number, prerequisiteLessonIds: readonly string[]): void {
    const lesson = this.draft().lessons[index];
    if (!lesson) {
      return;
    }

    this.updateLesson(index, { ...lesson, prerequisiteLessonIds });
  }

  lessonLabel(lesson: LessonFormDraft, index: number): string {
    return lesson.title.trim() || `Урок ${index + 1}`;
  }

  prerequisiteOptions(index: number): readonly { key: string; label: string }[] {
    return this.draft()
      .lessons.map((lesson, lessonIndex) => ({
        key: lessonDraftKey(lesson),
        label: this.lessonLabel(lesson, lessonIndex),
        index: lessonIndex,
      }))
      .filter((option) => option.index !== index);
  }

  prerequisiteSelection(index: number): readonly string[] {
    const lesson = this.draft().lessons[index];
    if (!lesson) {
      return [];
    }

    return lesson.prerequisiteLessonIds;
  }

  updateLesson(index: number, lesson: LessonFormDraft): void {
    const lessons = this.draft().lessons.map((item, itemIndex) =>
      itemIndex === index ? lesson : item,
    );
    this.updateDraft({ ...this.draft(), lessons });
  }

  addLesson(): void {
    const lessons = [...this.draft().lessons, emptyLessonFormDraft(this.draft().lessons.length)];
    this.updateDraft({ ...this.draft(), lessons });
  }

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
