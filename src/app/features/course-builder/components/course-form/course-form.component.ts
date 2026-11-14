import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { courseAuthoringWithIdea } from '../../../../entities/course/utils/course-authoring.utils';
import type { CourseAuthoringStatus, CoursePracticeMode } from '../../../../entities/course/model';
import {
  COURSE_AUTHORING_STATUSES,
  DEFAULT_COURSE_PRACTICE_SETTINGS,
} from '../../../../entities/course/model';
import type { CourseRequiredTier } from '../../../../entities/course/repository/course-catalog.port';
import { MarkdownFieldComponent } from '../../../../shared/utils/markdown-field';
import type { CourseFormDraft } from '../../types';

/** Types of course export operations. */
export type CourseExportType = 'pdf-without-hints' | 'pdf-with-hints' | 'json' | 'scorm';

/**
 * Full form component for creating and editing courses.
 *
 * Provides UI controls for course title, description, practice settings,
 * and authoring metadata (status, idea).
 *
 * @remarks
 * Emits draft updates through the `draftChange` output for parent component synchronization.
 * @see CourseFormDraft
 */
@Component({
  selector: 'app-course-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
    MarkdownFieldComponent,
  ],
  templateUrl: './course-form.component.html',
  styleUrl: './course-form.component.scss',
})
export class CourseFormComponent {
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
   * Emits when the user requests a course export.
   *
   * @remarks
   * The payload indicates the export type: pdf-without-hints, pdf-with-hints,
   * json (CourseBundle), or scorm (SCORM/xAPI package).
   */
  readonly exportRequested = output<CourseExportType>();

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

  /**
   * Human-readable labels for course practice mode values.
   *
   * @remarks
   * Maps each `CoursePracticeMode` value to its display name in Russian.
   */
  readonly practiceModeLabels: Record<CoursePracticeMode, string> = {
    guided: 'Линейный (последовательный)',
    open: 'Свободный (выбор сценариев)',
  };

  /** Available required tier options for course access control. */
  readonly requiredTierOptions: readonly CourseRequiredTier[] = [
    'FREE',
    'STARTER',
    'GROWTH',
    'PREMIUM',
  ] as const;

  /**
   * Human-readable labels for course required tier values.
   *
   * @remarks
   * Maps each `CourseRequiredTier` value to its display name in Russian.
   */
  readonly requiredTierLabels: Record<CourseRequiredTier, string> = {
    FREE: 'Бесплатный',
    STARTER: 'Starter',
    GROWTH: 'Growth',
    PREMIUM: 'Premium',
  };

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

  // ── Practice Settings ──

  /**
   * Updates the practice mode in the draft.
   *
   * @param value — The new `CoursePracticeMode` value.
   */
  updatePracticeMode(value: CoursePracticeMode): void {
    const draft = this.draft();
    this.updateDraft({
      ...draft,
      practiceSettings: {
        ...DEFAULT_COURSE_PRACTICE_SETTINGS,
        ...draft.practiceSettings,
        mode: value,
      },
    });
  }

  /**
   * Updates the `requireLessonForScenarios` setting.
   *
   * @param value — Whether scenarios require a lesson selection.
   */
  updateRequireLessonForScenarios(value: boolean): void {
    const draft = this.draft();
    this.updateDraft({
      ...draft,
      practiceSettings: {
        ...DEFAULT_COURSE_PRACTICE_SETTINGS,
        ...draft.practiceSettings,
        requireLessonForScenarios: value,
      },
    });
  }

  /**
   * Updates the `enforceLessonPrerequisites` setting.
   *
   * @param value — Whether lesson prerequisites are enforced during practice.
   */
  updateEnforceLessonPrerequisites(value: boolean): void {
    const draft = this.draft();
    this.updateDraft({
      ...draft,
      practiceSettings: {
        ...DEFAULT_COURSE_PRACTICE_SETTINGS,
        ...draft.practiceSettings,
        enforceLessonPrerequisites: value,
      },
    });
  }

  /**
   * Updates the `allowDifficultyFilter` setting.
   *
   * @param value — Whether difficulty filtering is allowed on the Scenarios tab.
   */
  updateAllowDifficultyFilter(value: boolean): void {
    const draft = this.draft();
    this.updateDraft({
      ...draft,
      practiceSettings: {
        ...DEFAULT_COURSE_PRACTICE_SETTINGS,
        ...draft.practiceSettings,
        allowDifficultyFilter: value,
      },
    });
  }

  // ── Required Tier & Slug ──

  /**
   * Updates the required tier in the draft.
   *
   * @param value — The new `CourseRequiredTier` value.
   */
  updateRequiredTier(value: CourseRequiredTier): void {
    this.updateDraft({ ...this.draft(), requiredTier: value });
  }

  /**
   * Updates the slug in the draft.
   *
   * @param value — The new slug string.
   */
  updateSlug(value: string): void {
    this.updateDraft({ ...this.draft(), slug: value });
  }

  // ── Export ──

  /**
   * Handles PDF export requests from the Export tab.
   *
   * @param withHints — Whether to include correct answers (hints) in the PDF.
   */
  onExportPdf(withHints: boolean): void {
    const type: CourseExportType = withHints ? 'pdf-with-hints' : 'pdf-without-hints';
    this.exportRequested.emit(type);
  }
}
