import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ProgramBuilderDialogComponent } from './program-builder-dialog.component';
import type {
  ProgramBuilderDialogData,
  ProgramBuilderDialogResult,
} from './program-builder-dialog.types';

/**
 * Service for opening the program builder dialog.
 *
 * @remarks
 * Ensures only one dialog instance is active at a time. Opens
 * `ProgramBuilderDialogComponent` in create or edit mode. The dialog should
 * only be opened through this service (page-level orchestration).
 */
@Injectable({ providedIn: 'root' })
export class ProgramBuilderDialogService {
  private readonly dialog = inject(MatDialog);

  private activeRef: MatDialogRef<
    ProgramBuilderDialogComponent,
    ProgramBuilderDialogResult
  > | null = null;

  /**
   * Opens the program builder in create mode for a given course.
   *
   * @param courseId - The ID of the parent course for the new program.
   * @returns A promise resolving to the dialog result, or `undefined` if another dialog is already open.
   */
  openCreate(courseId?: string): Promise<ProgramBuilderDialogResult | undefined> {
    return this.open({ mode: 'create', courseId });
  }

  /**
   * Opens the program builder in edit mode for an existing program.
   *
   * @param programId - The ID of the program to edit.
   * @returns A promise resolving to the dialog result, or `undefined` if another dialog is already open.
   */
  openEdit(programId: string): Promise<ProgramBuilderDialogResult | undefined> {
    return this.open({ mode: 'edit', programId });
  }

  private open(data: ProgramBuilderDialogData): Promise<ProgramBuilderDialogResult | undefined> {
    if (this.activeRef) {
      return Promise.resolve(undefined);
    }

    this.activeRef = this.dialog.open(ProgramBuilderDialogComponent, {
      data,
      width: '48rem',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: 'first-titled-element',
      panelClass: 'program-builder-dialog',
    });

    return firstValueFrom(this.activeRef.afterClosed()).finally(() => {
      this.activeRef = null;
    });
  }
}
