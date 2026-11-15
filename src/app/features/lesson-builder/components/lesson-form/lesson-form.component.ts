import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

import type { Lesson } from '../../../../entities/course/model/lesson.types';
import type { LessonFormDraft } from '../../types';
import { LESSON_TITLE_MAX_LENGTH } from '../../utils';

/** Tier labels for the access level selector (RU). */
const TIER_LABELS: Record<string, string> = {
  FREE: 'Бесплатный',
  STARTER: 'Стартовый',
  GROWTH: 'Рост',
  PREMIUM: 'Премиум',
};

/**
 * Presentational form component for creating and editing lessons.
 *
 * Provides UI controls for the lesson title, description, display order and
 * prerequisite lessons.
 *
 * @remarks
 * Stateless by design: receives the draft via a required input and emits
 * updates through the `draftChange` output. The parent component (e.g.
 * `LessonBuilderDialogComponent`) owns the draft signal.
 *
 * Scenario composition (`scenarioIds`) is intentionally not editable here —
 * scenarios are managed in the scenario/course builders.
 * @see LessonFormDraft
 */
@Component({
  selector: 'app-lesson-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
  ],
  templateUrl: './lesson-form.component.html',
  styleUrl: './lesson-form.component.scss',
})
export class LessonFormComponent {
  /**
   * Required lesson form draft being edited or created.
   *
   * @remarks
   * Immutable from the component's perspective — use `draftChange` to emit updates.
   */
  readonly draft = input.required<LessonFormDraft>();

  /**
   * Candidate lessons for the prerequisite selector.
   *
   * @remarks
   * Loaded by the parent (store) — all lessons of the parent program except
   * the edited lesson itself.
   */
  readonly candidateLessons = input<readonly Lesson[]>([]);

  /**
   * Whether the form is in read-only mode.
   *
   * @remarks
   * When `true`, all input controls are disabled and no changes can be made.
   */
  readonly readOnly = input(false);

  /**
   * Emits the updated lesson form draft when the user makes changes.
   *
   * @remarks
   * The parent component listens to this output and updates its own signal
   * with the new draft value.
   */
  readonly draftChange = output<LessonFormDraft>();

  /** Maximum allowed title length (backend contract). */
  readonly titleMaxLength = LESSON_TITLE_MAX_LENGTH;

  /** Available tier options (keys of TIER_LABELS). */
  readonly tierOptions = Object.keys(TIER_LABELS) as string[];

  /** Tier labels for display. */
  readonly tierLabels = TIER_LABELS;

  /** Emits the draft with an updated title. */
  updateTitle(title: string): void {
    this.draftChange.emit({ ...this.draft(), title });
  }

  /** Emits the draft with an updated description. */
  updateDescription(description: string): void {
    this.draftChange.emit({ ...this.draft(), description });
  }

  /** Emits the draft with an updated display order. */
  updateOrder(order: string): void {
    this.draftChange.emit({ ...this.draft(), order: Number(order) });
  }

  /** Emits the draft with updated prerequisite lesson IDs. */
  updatePrerequisiteLessonIds(prerequisiteLessonIds: readonly string[]): void {
    this.draftChange.emit({ ...this.draft(), prerequisiteLessonIds });
  }

  /** Emits the draft with an updated published flag. */
  updatePublished(published: boolean): void {
    this.draftChange.emit({ ...this.draft(), published });
  }

  /** Emits the draft with an updated required tier. */
  updateRequiredTier(tier: string | null): void {
    this.draftChange.emit({
      ...this.draft(),
      requiredTier: (tier as LessonFormDraft['requiredTier']) ?? undefined,
    });
  }
}
