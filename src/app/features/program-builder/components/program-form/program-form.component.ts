import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

import type { CourseIndexEntry } from '../../../../entities/course/model';
import type { LanguagePairDto } from '../../../../entities/language-pair/api';
import type { ProgramRequiredTier } from '../../../../entities/program/model';
import type { ProgramFormDraft } from '../../types';
import { PROGRAM_TITLE_MAX_LENGTH } from '../../utils';

/** Labels for program access tiers (RU). */
const TIER_LABELS: Record<ProgramRequiredTier, string> = {
  FREE: 'Бесплатный',
  STARTER: 'Стартовый',
  GROWTH: 'Рост',
  PREMIUM: 'Премиум',
};

/**
 * Presentational form component for creating and editing programs.
 *
 * Provides UI controls for the program title, access tier, description,
 * language pair, and parent course.
 *
 * @remarks
 * Stateless by design: receives the draft via a required input and emits
 * updates through the `draftChange` output. The parent component (e.g.
 * `ProgramBuilderDialogComponent`) owns the draft value.
 * @see ProgramFormDraft
 */
@Component({
  selector: 'app-program-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
  ],
  templateUrl: './program-form.component.html',
  styleUrl: './program-form.component.scss',
})
export class ProgramFormComponent {
  /**
   * Required program form draft being edited or created.
   *
   * @remarks
   * Immutable from the component's perspective — use `draftChange` to emit updates.
   */
  readonly draft = input.required<ProgramFormDraft>();

  /**
   * Whether the form is in read-only mode.
   *
   * @remarks
   * When `true`, all input controls are disabled and no changes can be made.
   */
  readonly readOnly = input(false);

  /**
   * Available language pairs from the registry.
   *
   * @remarks
   * Populated by the parent dialog component via `LanguagePairsApiService.listAll()`.
   */
  readonly languagePairs = input<readonly LanguagePairDto[]>([]);

  /**
   * Available courses for the program's parent course selector.
   *
   * @remarks
   * Populated by the parent dialog component via `CourseSearchService.search()`.
   */
  readonly courses = input<readonly CourseIndexEntry[]>([]);

  /**
   * Emits the updated program form draft when the user makes changes.
   *
   * @remarks
   * The parent component listens to this output and updates its own signal
   * with the new draft value.
   */
  readonly draftChange = output<ProgramFormDraft>();

  /** Maximum allowed title length (backend contract). */
  readonly titleMaxLength = PROGRAM_TITLE_MAX_LENGTH;

  /** Maximum allowed description length. */
  readonly descriptionMaxLength = 2000;

  /** Available access tier options. */
  readonly tierOptions: ProgramRequiredTier[] = ['FREE', 'STARTER', 'GROWTH', 'PREMIUM'];
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

  /** Emits the draft with an updated required tier. */
  updateRequiredTier(tier: ProgramRequiredTier): void {
    this.draftChange.emit({ ...this.draft(), requiredTier: tier });
  }

  /** Emits the draft with an updated published flag. */
  updatePublished(published: boolean): void {
    this.draftChange.emit({ ...this.draft(), published });
  }

  /** Emits the draft with an updated order. */
  updateOrder(order: number): void {
    this.draftChange.emit({ ...this.draft(), order: Number(order) });
  }

  /** Emits the draft with an updated language pair ID. */
  onLanguagePairChange(languagePairId: number | null): void {
    this.draftChange.emit({
      ...this.draft(),
      languagePairId: languagePairId ?? undefined,
    });
  }

  /** Emits the draft with an updated course ID. */
  onCourseIdChange(courseId: string | null): void {
    this.draftChange.emit({
      ...this.draft(),
      courseId: courseId ?? '',
    });
  }
}
