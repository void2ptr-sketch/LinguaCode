import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';

import { CardCatalogSearchStore } from '../../../../shared/card-catalog-search';
import { CardEditorDiscardDialogComponent } from '../../../card-editor/components/card-editor-dialog/card-editor-discard-dialog.component';
import { ScenarioBuilderStore } from '../../services/scenario-builder.store';
import {
  emptyScenarioFormDraft,
  formDraftToScenarioDraft,
  scenarioToFormDraft,
  serializeScenarioFormDraft,
  type ScenarioFormDraft,
} from '../../utils/scenario-form-draft.utils';
import { ScenarioEditorFormComponent } from '../scenario-editor-form/scenario-editor-form.component';
import type { ScenarioBuilderDialogData, ScenarioBuilderDialogResult } from './scenario-builder-dialog.types';

@Component({
  selector: 'app-scenario-builder-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ScenarioEditorFormComponent,
  ],
  providers: [CardCatalogSearchStore],
  templateUrl: './scenario-builder-dialog.component.html',
  styleUrl: './scenario-builder-dialog.component.scss',
})
export class ScenarioBuilderDialogComponent implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<ScenarioBuilderDialogComponent, ScenarioBuilderDialogResult>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  readonly data = inject<ScenarioBuilderDialogData>(MAT_DIALOG_DATA);
  readonly store = inject(ScenarioBuilderStore);

  readonly draft = signal<ScenarioFormDraft>(emptyScenarioFormDraft());
  private readonly initialSnapshot = signal('');

  readonly dirty = computed(
    () => serializeScenarioFormDraft(this.draft()) !== this.initialSnapshot(),
  );

  readonly title = computed(() => {
    if (this.data.mode === 'create') {
      return 'Новый сценарий';
    }

    if (this.store.isReadOnly()) {
      return 'Просмотр сценария';
    }

    return 'Редактирование';
  });

  async ngOnInit(): Promise<void> {
    if (this.data.mode === 'create') {
      this.store.startCreate();
      const nextDraft = emptyScenarioFormDraft();
      this.draft.set(nextDraft);
      this.initialSnapshot.set(serializeScenarioFormDraft(nextDraft));
      return;
    }

    await this.store.startEdit(this.data.scenarioId);
    const scenario = this.store.editingScenario();

    if (!scenario) {
      this.dialogRef.close(undefined);
      return;
    }

    const nextDraft = scenarioToFormDraft(scenario);
    this.draft.set(nextDraft);
    this.initialSnapshot.set(serializeScenarioFormDraft(nextDraft));
  }

  updateDraft(nextDraft: ScenarioFormDraft): void {
    this.draft.set(nextDraft);
  }

  async saveScenario(): Promise<void> {
    const payload = formDraftToScenarioDraft(this.draft());
    let saved = false;

    if (this.data.mode === 'create') {
      saved = await this.store.createScenario(payload);
    } else {
      saved = await this.store.updateScenario(this.data.scenarioId, payload);
    }

    if (saved) {
      this.dialogRef.close({ saved: true });
    }
  }

  async cancel(): Promise<void> {
    if (!(await this.confirmClose())) {
      return;
    }

    this.store.cancelEdit();
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
