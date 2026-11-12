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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { ScenarioIndexEntry } from '../../../../entities/scenario/model';
import { ContentExplorerStore } from '../../services/content-explorer.store';
import { EXPLORER_KIND_ICONS, EXPLORER_KIND_LABELS } from '../../types/content-explorer.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-explorer-detail',
  imports: [MatButtonModule, MatIconModule, MatListModule, MatMenuModule, MatTooltipModule],
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
  /** Card kind for the selected card node (for create-new-card action). */
  readonly cardKind = input<string>('');

  /** «Редактировать» intent for the selected node. */
  readonly editRequested = output<void>();
  /** «+ Программа» intent (course context). */
  readonly addProgramRequested = output<void>();
  /** «+ Урок» intent (program context). */
  readonly addLessonRequested = output<void>();
  /** «+ Сценарий» intent (lesson context). */
  readonly addScenarioRequested = output<void>();
  /** «Где используется» intent (card context). */
  readonly showUsagesRequested = output<void>();
  /** Экспорт PDF без подсказок (course context). */
  readonly exportPdfRequested = output<void>();
  /** Экспорт PDF с подсказками (course context). */
  readonly exportPdfWithHintsRequested = output<void>();
  /** Экспорт JSON (CourseBundle) (course context). */
  readonly exportJsonRequested = output<void>();
  /** Экспорт SCORM (course context). */
  readonly exportScormRequested = output<void>();
  /** Удаление курса (course context). */
  readonly deleteRequested = output<void>();
  /** Удаление сценария (scenario context, только для своего сценария). */
  readonly deleteScenarioRequested = output<void>();
  /** Удаление программы (program context). */
  readonly deleteProgramRequested = output<void>();
  /** Удаление урока (lesson context). */
  readonly deleteLessonRequested = output<void>();
  /** Создание карточки (card context). */
  readonly createCardRequested = output<string>();
  /** Удаление карточки (card context). */
  readonly deleteCardRequested = output<void>();

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

  /** Whether the selected node is a scenario. */
  protected readonly isScenario = computed(() => this.store.selectedNode()?.kind === 'scenario');

  /**
   * Published/draft status of the selected scenario (badge source).
   *
   * @remarks
   * `ExplorerNode.data` for scenario nodes carries the full `Scenario` entity
   * (see `ContentExplorerStore` scenario mapping), so no extra store changes
   * are needed — the badge reflects the same value as the tree meta line
   * («опубликован» / «черновик»).
   */
  protected readonly scenarioPublished = computed(() => {
    const node = this.store.selectedNode();
    if (node?.kind !== 'scenario') {
      return false;
    }
    return Boolean((node.data as { published?: boolean } | undefined)?.published);
  });

  /** Whether the selected node is a course. */
  protected readonly isCourse = computed(() => this.store.selectedNode()?.kind === 'course');

  /**
   * Whether course management actions (export/delete) are available.
   *
   * @remarks
   * Unlike `canEdit` (which is `true` for all non-virtual non-scenario nodes),
   * course management requires ownership: `ExplorerNode.editable` is set from
   * `isOwnAuthor(entry.authorId)` for course root nodes.
   */
  protected readonly canManageCourse = computed(() => {
    const node = this.store.selectedNode();
    return node?.kind === 'course' && !node.virtual && node.editable;
  });

  /**
   * Whether the selected scenario can be deleted.
   *
   * @remarks
   * Scenario deletion is AUTHOR/ADMIN and own-scenario only: mirrors
   * `ScenarioBuilderStore.isReadOnly` ownership semantics; the tree already
   * sets `ExplorerNode.editable` from `isOwnAuthor(scenario.authorId)`.
   */
  protected readonly canEditOwnScenario = computed(() => {
    const node = this.store.selectedNode();
    return node?.kind === 'scenario' && !node.virtual && node.editable;
  });

  protected onEditNode(): void {
    this.editRequested.emit();
  }

  protected onAddProgram(): void {
    this.addProgramRequested.emit();
  }

  protected onAddLesson(): void {
    this.addLessonRequested.emit();
  }

  protected onAddScenario(): void {
    this.addScenarioRequested.emit();
  }

  protected onLoadCardUsages(): void {
    this.showUsagesRequested.emit();
  }

  protected onExportPdf(): void {
    this.exportPdfRequested.emit();
  }

  protected onExportPdfWithHints(): void {
    this.exportPdfWithHintsRequested.emit();
  }

  protected onExportJson(): void {
    this.exportJsonRequested.emit();
  }

  protected onExportScorm(): void {
    this.exportScormRequested.emit();
  }

  protected onDeleteCourse(): void {
    this.deleteRequested.emit();
  }

  protected onDeleteScenario(): void {
    this.deleteScenarioRequested.emit();
  }

  protected onDeleteProgram(): void {
    this.deleteProgramRequested.emit();
  }

  protected onDeleteLesson(): void {
    this.deleteLessonRequested.emit();
  }

  protected onCreateCard(): void {
    this.createCardRequested.emit(this.cardKind());
  }

  protected onDeleteCard(): void {
    this.deleteCardRequested.emit();
  }
}
