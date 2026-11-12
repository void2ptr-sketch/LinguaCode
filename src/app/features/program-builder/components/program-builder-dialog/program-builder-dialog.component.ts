import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';

import { CardEditorDiscardDialogComponent } from '../../../../shared/ui/dialogs';
import { ProgramBuilderStore } from '../../services/program-builder.store';
import {
  emptyProgramFormDraft,
  programToFormDraft,
  serializeProgramFormDraft,
} from '../../utils/program-form-draft.utils';
import { ProgramFormComponent } from '../program-form/program-form.component';
import type {
  ProgramBuilderDialogData,
  ProgramBuilderDialogResult,
} from './program-builder-dialog.types';
import type { ProgramFormDraft } from '../../types';

/**
 * Modal dialog component for creating and editing programs.
 *
 * Tracks dirty state to detect unsaved changes and prompts for confirmation
 * before closing with unsaved edits.
 *
 * @remarks
 * Receives mode and optional `programId`/`courseId` via `MAT_DIALOG_DATA` injection.
 * Uses `ProgramBuilderStore` for state management.
 * @see ProgramBuilderDialogData
 * @see ProgramBuilderDialogResult
 */
@Component({
  selector: 'app-program-builder-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule, MatProgressSpinnerModule, ProgramFormComponent],
  templateUrl: './program-builder-dialog.component.html',
  styleUrl: './program-builder-dialog.component.scss',
})
export class ProgramBuilderDialogComponent implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<ProgramBuilderDialogComponent, ProgramBuilderDialogResult>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  readonly data = inject<ProgramBuilderDialogData>(MAT_DIALOG_DATA);
  readonly store = inject(ProgramBuilderStore);

  /**
   * Current program form draft being edited or created.
   *
   * Updated by `ProgramFormComponent` through the `draftChange` event.
   */
  readonly draft = signal<ProgramFormDraft>(emptyProgramFormDraft());
  /** Internal snapshot of the initial draft for dirty state tracking. */
  private readonly initialSnapshot = signal('');

  /**
   * Whether the draft has unsaved changes compared to the initial snapshot.
   *
   * @remarks
   * Used to prompt users before closing the dialog with unsaved changes.
   */
  readonly dirty = computed(
    () => serializeProgramFormDraft(this.draft()) !== this.initialSnapshot(),
  );

  /**
   * Dynamic dialog title based on the current mode.
   *
   * @remarks
   * Returns "Новая программа" for create mode, "Просмотр программы" for
   * read-only edit, and "Редактирование программы" for writable edit mode.
   */
  readonly title = computed(() => {
    if (this.data.mode === 'create') {
      return 'Новая программа';
    }

    return this.store.isReadOnly() ? 'Просмотр программы' : 'Редактирование программы';
  });

  async ngOnInit(): Promise<void> {
    if (this.data.mode === 'create') {
      this.store.startCreate(this.data.courseId);
      const nextDraft = emptyProgramFormDraft(this.data.courseId);
      this.draft.set(nextDraft);
      this.initialSnapshot.set(serializeProgramFormDraft(nextDraft));
      return;
    }

    await this.store.startEdit(this.data.programId ?? '');
    const program = this.store.editingProgram();
    if (!program) {
      this.dialogRef.close(undefined);
      return;
    }

    const nextDraft = programToFormDraft(program);
    this.draft.set(nextDraft);
    this.initialSnapshot.set(serializeProgramFormDraft(nextDraft));
  }

  /**
   * Updates the current draft with the provided form data.
   *
   * Called by `ProgramFormComponent` when the user makes changes to the form.
   *
   * @param nextDraft — The updated program form draft.
   */
  updateDraft(nextDraft: ProgramFormDraft): void {
    this.draft.set(nextDraft);
  }

  /**
   * Saves the current program — creates a new one or updates an existing one.
   *
   * @remarks
   * In create mode, calls `ProgramBuilderStore.createProgram()`.
   * In edit mode, calls `ProgramBuilderStore.updateProgram()`.
   * Closes the dialog with `{ saved: true }` on success.
   */
  async saveProgram(): Promise<void> {
    const saved =
      this.data.mode === 'create'
        ? await this.store.createProgram(this.draft())
        : await this.store.updateProgram(this.data.programId ?? '', this.draft());

    if (saved) {
      this.dialogRef.close({ saved: true });
    }
  }

  /**
   * Cancels the current edit and closes the dialog.
   *
   * @remarks
   * Prompts for confirmation if the draft has unsaved changes.
   * Closes the dialog with `{ saved: false }` on confirmation.
   */
  async cancel(): Promise<void> {
    if (!(await this.confirmClose())) {
      return;
    }

    this.dialogRef.close({ saved: false });
  }

  private async confirmClose(): Promise<boolean> {
    if (!this.dirty()) {
      return true;
    }

    const ref = this.dialog.open(CardEditorDiscardDialogComponent, {
      width: 'min(24rem, 96vw)',
      autoFocus: 'first-titled-element',
    });

    return (await firstValueFrom(ref.afterClosed())) === true;
  }
}
