import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
  OnInit,
} from '@angular/core';
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

import { activeLanguagePairCriteria } from '../../../../entities/language-pair/lib/language-pair-scope.utils';
import { courseAuthoringWithIdea } from '../../../../entities/course/utils/course-authoring.utils';
import { ScenarioSearchService } from '../../../../entities/scenario';
import type { CourseAuthoringStatus } from '../../../../entities/course/model';
import { COURSE_AUTHORING_STATUSES } from '../../../../entities/course/model';
import type { ScenarioIndexEntry } from '../../../../entities/scenario/model';
import { UserStore } from '../../../../entities/user/model/user.store';
import { MarkdownFieldComponent } from '../../../../shared/utils/markdown-field';
import type { CourseFormDraft, LessonFormDraft, ProgramFormDraft } from '../../types';
import {
  emptyLessonFormDraft,
  emptyProgramFormDraft,
  lessonDraftKey,
  programDraftKey,
} from '../../utils/course-form-draft.utils';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
   * Utility function for generating unique program draft keys.
   *
   * @remarks
   * Used in templates for `ngModel` bindings.
   */
  readonly programDraftKey = programDraftKey;

  /**
   * Utility function for generating unique lesson draft keys.
   *
   * @remarks
   * Used in templates for prerequisite selection.
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
   * Updates the title of a specific program.
   *
   * @param index — The zero-based index of the program.
   * @param value — The new program title.
   */
  updateProgramTitle(index: number, value: string): void {
    const program = this.draft().programs[index];
    if (!program) {
      return;
    }

    this.updateProgram(index, { ...program, title: value });
  }

  /**
   * Updates the description of a specific program.
   *
   * @param index — The zero-based index of the program.
   * @param value — The new program description.
   */
  updateProgramDescription(index: number, value: string): void {
    const program = this.draft().programs[index];
    if (!program) {
      return;
    }

    this.updateProgram(index, { ...program, description: value });
  }

  /**
   * Replaces a program at a specific index with the provided program draft.
   *
   * @param index — The zero-based index of the program to replace.
   * @param program — The new program draft.
   */
  updateProgram(index: number, program: ProgramFormDraft): void {
    const programs = this.draft().programs.map((item, itemIndex) =>
      itemIndex === index ? program : item,
    );
    this.updateDraft({ ...this.draft(), programs });
  }

  /**
   * Appends a new empty program to the draft.
   *
   * @remarks
   * Assigns the next available order number.
   */
  addProgram(): void {
    const programs = [
      ...this.draft().programs,
      emptyProgramFormDraft(this.draft().programs.length),
    ];
    this.updateDraft({ ...this.draft(), programs });
  }

  /**
   * Removes a program at the specified index.
   *
   * @remarks
   * Prevents removal if there is only one program.
   *
   * @param index — The zero-based index of the program to remove.
   */
  removeProgram(index: number): void {
    if (this.draft().programs.length <= 1) {
      return;
    }

    const programs = this.draft().programs.filter((_, itemIndex) => itemIndex !== index);
    this.updateDraft({ ...this.draft(), programs });
  }

  /**
   * Updates the title of a specific lesson within a program.
   *
   * @param programIndex — The zero-based index of the program.
   * @param lessonIndex — The zero-based index of the lesson.
   * @param value — The new lesson title.
   */
  updateLessonTitle(programIndex: number, lessonIndex: number, value: string): void {
    const program = this.draft().programs[programIndex];
    if (!program) {
      return;
    }

    const lesson = program.lessons[lessonIndex];
    if (!lesson) {
      return;
    }

    this.updateLesson(programIndex, {
      ...program,
      lessons: program.lessons.map((l, i) =>
        i === lessonIndex ? { ...l, title: value } : l,
      ),
    });
  }

  /**
   * Updates the description of a specific lesson within a program.
   *
   * @param programIndex — The zero-based index of the program.
   * @param lessonIndex — The zero-based index of the lesson.
   * @param value — The new lesson description.
   */
  updateLessonDescription(programIndex: number, lessonIndex: number, value: string): void {
    const program = this.draft().programs[programIndex];
    if (!program) {
      return;
    }

    const lesson = program.lessons[lessonIndex];
    if (!lesson) {
      return;
    }

    this.updateLesson(programIndex, {
      ...program,
      lessons: program.lessons.map((l, i) =>
        i === lessonIndex ? { ...l, description: value } : l,
      ),
    });
  }

  /**
   * Updates the assigned scenario IDs for a specific lesson.
   *
   * @param programIndex — The zero-based index of the program.
   * @param lessonIndex — The zero-based index of the lesson.
   * @param scenarioIds — The new array of scenario IDs.
   */
  updateLessonScenarioIds(
    programIndex: number,
    lessonIndex: number,
    scenarioIds: readonly string[],
  ): void {
    const program = this.draft().programs[programIndex];
    if (!program) {
      return;
    }

    const lesson = program.lessons[lessonIndex];
    if (!lesson) {
      return;
    }

    this.updateLesson(programIndex, {
      ...program,
      lessons: program.lessons.map((l, i) =>
        i === lessonIndex ? { ...l, scenarioIds } : l,
      ),
    });
  }

  /**
   * Updates the prerequisite lesson IDs for a specific lesson.
   *
   * @param programIndex — The zero-based index of the program.
   * @param lessonIndex — The zero-based index of the lesson.
   * @param prerequisiteLessonIds — The new array of prerequisite lesson keys.
   */
  updateLessonPrerequisites(
    programIndex: number,
    lessonIndex: number,
    prerequisiteLessonIds: readonly string[],
  ): void {
    const program = this.draft().programs[programIndex];
    if (!program) {
      return;
    }

    const lesson = program.lessons[lessonIndex];
    if (!lesson) {
      return;
    }

    this.updateLesson(programIndex, {
      ...program,
      lessons: program.lessons.map((l, i) =>
        i === lessonIndex ? { ...l, prerequisiteLessonIds } : l,
      ),
    });
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
   * @param programIndex — The zero-based index of the program.
   * @param lessonIndex — The zero-based index of the target lesson.
   * @returns Array of `{ key, label, index }` objects for other lessons.
   */
  prerequisiteOptions(
    programIndex: number,
    lessonIndex: number,
  ): readonly { key: string; label: string }[] {
    const program = this.draft().programs[programIndex];
    if (!program) {
      return [];
    }

    return program.lessons
      .map((lesson, lIndex) => ({
        key: lessonDraftKey(lesson),
        label: this.lessonLabel(lesson, lIndex),
        index: lIndex,
      }))
      .filter((option) => option.index !== lessonIndex);
  }

  /**
   * Returns the currently selected prerequisite lesson IDs for a specific lesson.
   *
   * @param programIndex — The zero-based index of the program.
   * @param lessonIndex — The zero-based index of the lesson.
   * @returns Array of prerequisite lesson keys, or empty array if lesson not found.
   */
  prerequisiteSelection(programIndex: number, lessonIndex: number): readonly string[] {
    const program = this.draft().programs[programIndex];
    if (!program) {
      return [];
    }

    const lesson = program.lessons[lessonIndex];
    if (!lesson) {
      return [];
    }

    return lesson.prerequisiteLessonIds;
  }

  /**
   * Updates a lesson within a program.
   *
   * @param programIndex — The zero-based index of the program.
   * @param program — The updated program draft.
   */
  updateLesson(programIndex: number, program: ProgramFormDraft): void {
    const programs = this.draft().programs.map((item, itemIndex) =>
      itemIndex === programIndex ? program : item,
    );
    this.updateDraft({ ...this.draft(), programs });
  }

  /**
   * Appends a new empty lesson to a specific program.
   *
   * @param programIndex — The zero-based index of the program.
   */
  addLesson(programIndex: number): void {
    const program = this.draft().programs[programIndex];
    if (!program) {
      return;
    }

    const lessons = [...program.lessons, emptyLessonFormDraft(program.lessons.length)];
    this.updateLesson(programIndex, { ...program, lessons });
  }

  /**
   * Removes a lesson at the specified index within a program.
   *
   * @remarks
   * Prevents removal if there is only one lesson. Cleans up prerequisite references
   * to the removed lesson from other lessons.
   *
   * @param programIndex — The zero-based index of the program.
   * @param lessonIndex — The zero-based index of the lesson to remove.
   */
  removeLesson(programIndex: number, lessonIndex: number): void {
    const program = this.draft().programs[programIndex];
    if (!program || program.lessons.length <= 1) {
      return;
    }

    const removedKey = lessonDraftKey(program.lessons[lessonIndex]);
    const lessons = program.lessons
      .filter((_, itemIndex) => itemIndex !== lessonIndex)
      .map((lesson, order) => ({
        ...lesson,
        order,
        prerequisiteLessonIds: lesson.prerequisiteLessonIds.filter(
          (key) => key !== removedKey,
        ),
      }));
    this.updateLesson(programIndex, { ...program, lessons });
  }
}
