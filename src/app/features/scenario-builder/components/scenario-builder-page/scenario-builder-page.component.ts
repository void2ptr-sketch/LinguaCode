import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScenarioBuilderStore } from '../../services/scenario-builder.store';
import { ScenarioDraft } from '../../types';

@Component({
  selector: 'app-scenario-builder-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './scenario-builder-page.component.html',
  styleUrl: './scenario-builder-page.component.scss',
})
export class ScenarioBuilderPageComponent implements OnInit {
  readonly store = inject(ScenarioBuilderStore);

  readonly titleDraft = signal('');
  readonly descriptionDraft = signal('');
  readonly cardIdsDraft = signal<readonly string[]>([]);

  async ngOnInit(): Promise<void> {
    await this.store.load();
  }

  startCreate(): void {
    this.store.startCreate();
    this.resetDraft();
  }

  startEdit(scenarioId: string): void {
    const scenario = this.store.scenarios().find((item) => item.id === scenarioId);
    if (!scenario) {
      return;
    }

    this.store.startEdit(scenarioId);
    this.titleDraft.set(scenario.title);
    this.descriptionDraft.set(scenario.description);
    this.cardIdsDraft.set([...scenario.cardIds]);
  }

  cancelEdit(): void {
    this.store.cancelEdit();
    this.resetDraft();
  }

  saveScenario(): void {
    const draft: ScenarioDraft = {
      title: this.titleDraft(),
      description: this.descriptionDraft(),
      cardIds: this.cardIdsDraft(),
    };

    if (this.store.editorMode() === 'create') {
      if (this.store.createScenario(draft)) {
        this.resetDraft();
      }
      return;
    }

    const scenarioId = this.store.editingScenarioId();
    if (scenarioId && this.store.updateScenario(scenarioId, draft)) {
      this.resetDraft();
    }
  }

  deleteScenario(scenarioId: string): void {
    this.store.deleteScenario(scenarioId);
  }

  toggleCard(cardId: string, checked: boolean): void {
    const current = this.cardIdsDraft();
    if (checked) {
      if (!current.includes(cardId)) {
        this.cardIdsDraft.set([...current, cardId]);
      }
      return;
    }

    this.cardIdsDraft.set(current.filter((id) => id !== cardId));
  }

  isCardSelected(cardId: string): boolean {
    return this.cardIdsDraft().includes(cardId);
  }

  moveCard(cardId: string, direction: -1 | 1): void {
    const current = [...this.cardIdsDraft()];
    const index = current.indexOf(cardId);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) {
      return;
    }

    [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
    this.cardIdsDraft.set(current);
  }

  private resetDraft(): void {
    this.titleDraft.set('');
    this.descriptionDraft.set('');
    this.cardIdsDraft.set([]);
  }
}
