/**
 * Страница единого проводника контента (`/tools/content`).
 *
 * Объединяет всю иерархию `Course → Program → Lesson → Scenario → Card`:
 * слева — дерево с ленивой загрузкой, справа — детали выбранного узла.
 *
 * Диалоговая оркестрация живёт здесь (а не в фиче), потому что FSD
 * запрещает cross-feature импорты между feature-слайсами: страница
 * открывает существующие билдеры (course/scenario/card) и обновляет
 * дерево после сохранения.
 *
 * Deep links: `/tools/content?courseId&programId&lessonId&scenarioId&cardId`
 * — авто-раскрытие цепочки и выбор узла (см. ExplorerRevealTarget).
 */
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ContentExplorerStore } from '../../../features/content-explorer/services/content-explorer.store';
import { ExplorerDetailComponent } from '../../../features/content-explorer/components/explorer-detail/explorer-detail.component';
import { ExplorerTreeComponent } from '../../../features/content-explorer/components/explorer-tree/explorer-tree.component';
import { CourseBuilderDialogService } from '../../../features/course-builder/components/course-builder-dialog/course-builder-dialog.service';
import { ProgramBuilderDialogService } from '../../../features/program-builder/components/program-builder-dialog/program-builder-dialog.service';
import { LessonBuilderDialogService } from '../../../features/lesson-builder/components/lesson-builder-dialog/lesson-builder-dialog.service';
import { ScenarioBuilderDialogService } from '../../../features/scenario-builder/components/scenario-builder-dialog/scenario-builder-dialog.service';
import { CardEditorDialogService } from '../../../features/card-editor/components/card-editor-dialog/card-editor-dialog.service';
import { ScenarioSearchService } from '../../../entities/scenario/search/scenario-search.service';
import type { ScenarioIndexEntry } from '../../../entities/scenario/model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-content-explorer-page',
  imports: [MatIconModule, ExplorerTreeComponent, ExplorerDetailComponent],
  templateUrl: './content-explorer-page.component.html',
  styleUrl: './content-explorer-page.component.scss',
})
export class ContentExplorerPageComponent implements OnInit {
  /** Хранилище дерева проводника */
  protected readonly store = inject(ContentExplorerStore);
  private readonly route = inject(ActivatedRoute);
  private readonly courseBuilderDialog = inject(CourseBuilderDialogService);
  private readonly scenarioBuilderDialog = inject(ScenarioBuilderDialogService);
  private readonly cardEditorDialog = inject(CardEditorDialogService);
  private readonly programBuilderDialog = inject(ProgramBuilderDialogService);
  private readonly lessonBuilderDialog = inject(LessonBuilderDialogService);
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly snackBar = inject(MatSnackBar);

  /** Whether a dialog flow is in progress (passed to the detail panel). */
  protected readonly acting = signal(false);
  /** Backlinks «Где используется» for the selected card. */
  protected readonly cardUsages = signal<readonly ScenarioIndexEntry[] | null>(null);
  protected readonly cardUsagesLoading = signal(false);

  async ngOnInit(): Promise<void> {
    await this.store.loadRoots();
    void this.revealFromQuery();
  }

  /** «Редактировать» — открывает соответствующий билдер для выбранного узла. */
  protected async onEditRequested(): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || node.virtual || this.acting()) {
      return;
    }

    this.acting.set(true);
    try {
      switch (node.kind) {
        case 'course': {
          // forceEdit — курс всегда открывается в режиме редактирования
          // (frontend read-only fallback отключён; права проверяет бэкенд).
          const result = await this.courseBuilderDialog.openEdit(node.id, { forceEdit: true });
          if (result?.saved) {
            await this.store.refreshNode(node);
          }
          break;
        }
        case 'program': {
          const result = await this.programBuilderDialog.openEdit(node.id);
          if (result?.saved) {
            await this.store.refreshNode(node);
          }
          break;
        }
        case 'lesson': {
          const result = await this.lessonBuilderDialog.openEdit(node.id);
          if (result?.saved) {
            await this.store.refreshNode(node);
          }
          break;
        }
        case 'scenario': {
          const result = await this.scenarioBuilderDialog.openEdit(node.id);
          if (result?.saved) {
            await this.store.refreshNode(node);
          }
          break;
        }
        case 'card': {
          const result = await this.cardEditorDialog.openEdit(node.id);
          if (!result?.saved) {
            break;
          }
          const parentScenario = node.parentId ? this.store.getByKey(node.parentId) : null;
          if (parentScenario && parentScenario.kind === 'scenario') {
            await this.store.refreshNode(parentScenario);
          }
          break;
        }
      }
    } finally {
      this.acting.set(false);
    }
  }

  /**
   * «+ Программа» — открывает конструктор программ в режиме создания
   * с привязкой к выбранному курсу. После сохранения обновляет узел курса,
   * чтобы новая программа появилась в дереве.
   */
  protected async onAddProgramRequested(): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || node.kind !== 'course' || this.acting()) {
      return;
    }

    this.acting.set(true);
    try {
      const result = await this.programBuilderDialog.openCreate(node.id);
      if (result?.saved) {
        await this.store.refreshNode(node);
      }
    } finally {
      this.acting.set(false);
    }
  }

  /**
   * «+ Урок» — открывает конструктор уроков в режиме создания
   * с привязкой к выбранному треку. После сохранения обновляет узел трека,
   * чтобы новый урок появился в дереве.
   */
  protected async onAddLessonRequested(): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || node.kind !== 'program' || this.acting()) {
      return;
    }

    this.acting.set(true);
    try {
      const result = await this.lessonBuilderDialog.openCreate(node.id);
      if (result?.saved) {
        await this.store.refreshNode(node);
      }
    } finally {
      this.acting.set(false);
    }
  }

  /**
   * «+ Сценарий» — открывает конструктор сценариев в режиме создания.
   * Связь сценария с уроком выполняется в конструкторе курсов (course draft).
   */
  protected async onAddScenarioRequested(): Promise<void> {
    if (this.acting()) {
      return;
    }
    this.acting.set(true);
    try {
      const result = await this.scenarioBuilderDialog.openCreate();
      this.snackBar.open(
        result?.saved
          ? 'Сценарий создан. Чтобы добавить его в урок, откройте конструктор курсов.'
          : 'Создание сценария отменено',
        undefined,
        { duration: 5000 },
      );
    } finally {
      this.acting.set(false);
    }
  }

  /** «Где используется» — сценарии, ссылающиеся на выбранную карточку. */
  protected async onShowUsagesRequested(): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || node.kind !== 'card' || this.cardUsagesLoading()) {
      return;
    }

    this.cardUsagesLoading.set(true);
    try {
      const usages = await this.scenarioSearchService.findUsingCard(node.id);
      this.cardUsages.set(usages);
    } catch {
      this.cardUsages.set([]);
    } finally {
      this.cardUsagesLoading.set(false);
    }
  }

  /**
   * Обрабатывает deep-link query-параметры: раскрывает цепочку
   * `courseId → programId → lessonId → scenarioId → cardId` и выбирает узел.
   */
  private async revealFromQuery(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const courseId = params.get('courseId');
    if (!courseId) {
      return;
    }

    await this.store.reveal({
      courseId,
      programId: params.get('programId') ?? undefined,
      lessonId: params.get('lessonId') ?? undefined,
      scenarioId: params.get('scenarioId') ?? undefined,
      cardId: params.get('cardId') ?? undefined,
    });
  }
}
