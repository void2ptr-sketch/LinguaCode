import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ScenarioBuilderDialogComponent } from './scenario-builder-dialog.component';
import type {
  ScenarioBuilderDialogData,
  ScenarioBuilderDialogResult,
} from './scenario-builder-dialog.types';

/**
 * Service for opening the scenario builder dialog.
 *
 * @remarks
 * Ensures only one dialog instance is active at a time. Opens `ScenarioBuilderDialogComponent`
 * in create or edit mode.
 */
@Injectable({ providedIn: 'root' })
export class ScenarioBuilderDialogService {
  private readonly dialog = inject(MatDialog);

  private activeRef: MatDialogRef<
    ScenarioBuilderDialogComponent,
    ScenarioBuilderDialogResult
  > | null = null;

  /**
   * Opens the scenario builder in create mode.
   *
   * @returns A promise resolving to the dialog result, or `undefined` if another dialog is already open.
   */
  openCreate(): Promise<ScenarioBuilderDialogResult | undefined> {
    return this.open({ mode: 'create' });
  }

  /**
   * Opens the scenario builder in edit mode for an existing scenario.
   *
   * @param scenarioId - The ID of the scenario to edit.
   * @returns A promise resolving to the dialog result, or `undefined` if another dialog is already open.
   */
  openEdit(scenarioId: string): Promise<ScenarioBuilderDialogResult | undefined> {
    return this.open({ mode: 'edit', scenarioId });
  }

  private open(data: ScenarioBuilderDialogData): Promise<ScenarioBuilderDialogResult | undefined> {
    if (this.activeRef) {
      return Promise.resolve(undefined);
    }

    this.activeRef = this.dialog.open(ScenarioBuilderDialogComponent, {
      data,
      panelClass: 'scenario-builder-dialog',
      width: '1100px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: 'first-titled-element',
    });

    return firstValueFrom(this.activeRef.afterClosed()).finally(() => {
      this.activeRef = null;
    });
  }
}
