import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import type { ProgramFormDraft } from '../../types';
import { PROGRAM_TITLE_MAX_LENGTH } from '../../utils';

/**
 * Presentational form component for creating and editing programs.
 *
 * Provides UI controls for the program title and description.
 *
 * @remarks
 * Stateless by design: receives the draft via a required input and emits
 * updates through the `draftChange` output. The parent component (e.g.
 * `ProgramBuilderDialogComponent`) owns the draft signal.
 * @see ProgramFormDraft
 */
@Component({
  selector: 'app-program-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
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
   * Emits the updated program form draft when the user makes changes.
   *
   * @remarks
   * The parent component listens to this output and updates its own signal
   * with the new draft value.
   */
  readonly draftChange = output<ProgramFormDraft>();

  /** Maximum allowed title length (backend contract). */
  readonly titleMaxLength = PROGRAM_TITLE_MAX_LENGTH;

  /** Emits the draft with an updated title. */
  updateTitle(title: string): void {
    this.draftChange.emit({ ...this.draft(), title });
  }

  /** Emits the draft with an updated description. */
  updateDescription(description: string): void {
    this.draftChange.emit({ ...this.draft(), description });
  }
}
