/**
 * Right panel of the content explorer: details of the selected node.
 *
 * @remarks
 * Presentational component: it renders the breadcrumb path, node meta and
 * action buttons, and emits intent events. The dialog orchestration
 * (course/scenario/card builders) lives in the page component, since FSD
 * forbids cross-feature imports between feature slices.
 */
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { ScenarioIndexEntry } from '../../../../entities/scenario/model';
import { ContentExplorerStore } from '../../services/content-explorer.store';
import {
  EXPLORER_KIND_ICONS,
  EXPLORER_KIND_LABELS,
} from '../../types/content-explorer.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-explorer-detail',
  imports: [MatIconModule, MatListModule, MatTooltipModule],
  templateUrl: './explorer-detail.component.html',
  styleUrl: './explorer-detail.component.scss',
})
export class ExplorerDetailComponent {
  /** Explorer tree store (shared with the page). */
  protected readonly store = inject(ContentExplorerStore);

  /** Whether action buttons are busy (dialog flow in progress). */
  readonly acting = input<boolean>(false);
  /** Backlinks «Где используется» for cards (loaded by the page on request). */
  readonly cardUsages = input<readonly ScenarioIndexEntry[] | null>(null);
  /** Whether backlinks are loading. */
  readonly cardUsagesLoading = input<boolean>(false);

  /** «Редактировать» intent for the selected node. */
  readonly editRequested = output<void>();
  /** «+ Программа» intent (course context). */
  readonly addProgramRequested = output<void>();
  /** «+ Сценарий» intent (lesson context). */
  readonly addScenarioRequested = output<void>();
  /** «Где используется» intent (card context). */
  readonly showUsagesRequested = output<void>();

  protected readonly kindIcon = computed(() => {
    const node = this.store.selectedNode();
    return node ? EXPLORER_KIND_ICONS[node.kind] : 'select_all';
  });

  protected readonly kindLabel = computed(() => {
    const node = this.store.selectedNode();
    return node ? EXPLORER_KIND_LABELS[node.kind] : '';
  });

  protected readonly breadcrumbs = computed(() => {
    const node = this.store.selectedNode();
    return node ? this.store.pathOf(node) : [];
  });

  /** Whether the selected node has edit actions (virtual/read-only nodes — no). */
  protected readonly canEdit = computed(() => {
    const node = this.store.selectedNode();
    if (!node || node.virtual) {
      return false;
    }
    return node.kind === 'scenario' ? node.editable : true;
  });

  protected readonly isCard = computed(() => this.store.selectedNode()?.kind === 'card');

  protected onEditNode(): void {
    this.editRequested.emit();
  }

  protected onAddProgram(): void {
    this.addProgramRequested.emit();
  }

  protected onAddScenario(): void {
    this.addScenarioRequested.emit();
  }

  protected onLoadCardUsages(): void {
    this.showUsagesRequested.emit();
  }
}
