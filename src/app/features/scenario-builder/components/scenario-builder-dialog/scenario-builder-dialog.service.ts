import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ScenarioBuilderDialogComponent } from './scenario-builder-dialog.component';
import type {
  ScenarioBuilderDialogData,
  ScenarioBuilderDialogResult,
} from './scenario-builder-dialog.types';

@Injectable({ providedIn: 'root' })
export class ScenarioBuilderDialogService {
  private readonly dialog = inject(MatDialog);

  private activeRef: MatDialogRef<
    ScenarioBuilderDialogComponent,
    ScenarioBuilderDialogResult
  > | null = null;

  openCreate(): Promise<ScenarioBuilderDialogResult | undefined> {
    return this.open({ mode: 'create' });
  }

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
