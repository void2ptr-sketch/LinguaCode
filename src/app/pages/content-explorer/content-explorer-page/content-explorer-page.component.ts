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
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  DestroyRef,
  NgZone,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { MatButtonToggleChange } from '@angular/material/button-toggle';
import type { PageEvent } from '@angular/material/paginator';

import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { CourseSearchService } from '../../../entities/course/search/course-search.service';
import {
  appendScenarioToLessonPayload,
  courseWithProgramsToWritePayload,
  removeScenarioFromLessonPayload,
} from '../../../entities/course/utils/course-write-payload.utils';
import { ContentExplorerStore } from '../../../features/content-explorer/services/content-explorer.store';
import type { ExplorerNode } from '../../../features/content-explorer/services/content-explorer.store';
import { ExplorerDetailComponent } from '../../../features/content-explorer/components/explorer-detail/explorer-detail.component';
import { ExplorerTreeComponent } from '../../../features/content-explorer/components/explorer-tree/explorer-tree.component';
import { CourseBuilderDialogService } from '../../../features/course-builder/components/course-builder-dialog/course-builder-dialog.service';
import { CourseBuilderStore } from '../../../features/course-builder/services/course-builder.store';
import { ProgramBuilderDialogService } from '../../../features/program-builder/components/program-builder-dialog/program-builder-dialog.service';
import { LessonBuilderDialogService } from '../../../features/lesson-builder/components/lesson-builder-dialog/lesson-builder-dialog.service';
import { ScenarioBuilderDialogService } from '../../../features/scenario-builder/components/scenario-builder-dialog/scenario-builder-dialog.service';
import { ScenarioBuilderStore } from '../../../features/scenario-builder/services/scenario-builder.store';
import type { ScenarioListScope } from '../../../entities/scenario/model';
import { UiPaginationComponent } from '../../../shared/utils/pagination';
import { CardEditorDialogService } from '../../../features/card-editor/components/card-editor-dialog/card-editor-dialog.service';
import { ScormExportService } from '../../../entities/course/api/scorm-export.service';
import { ScenarioSearchService } from '../../../entities/scenario/search/scenario-search.service';
import type { Scenario, ScenarioIndexEntry } from '../../../entities/scenario/model';
import { CardEditorStore } from '../../../features/card-editor/services/card-editor.store';
import { ProgramsApiService } from '../../../entities/program/api/programs-api.service';
import { LessonsApiService } from '../../../entities/lesson/api/lessons-api.service';

const TREE_WIDTH_KEY = 'content_explorer_tree_width';
const TREE_MIN_WIDTH = 280;
const TREE_MAX_WIDTH = 900;
const TREE_DEFAULT_WIDTH = 360;

import { CourseDeleteConfirmDialogComponent } from './course-delete-confirm-dialog.component';
import { ScenarioDeleteConfirmDialogComponent } from './scenario-delete-confirm-dialog.component';
import { ProgramDeleteConfirmDialogComponent } from './program-delete-confirm-dialog.component';
import { LessonDeleteConfirmDialogComponent } from './lesson-delete-confirm-dialog.component';
import { CardDeleteConfirmDialogComponent } from './card-delete-confirm-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-content-explorer-page',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    UiPaginationComponent,
    ExplorerTreeComponent,
    ExplorerDetailComponent,
  ],
  templateUrl: './content-explorer-page.component.html',
  styleUrl: './content-explorer-page.component.scss',
})
export class ContentExplorerPageComponent implements OnInit {
  /** Хранилище дерева проводника */
  protected readonly store = inject(ContentExplorerStore);
  private readonly route = inject(ActivatedRoute);
  private readonly courseBuilderDialog = inject(CourseBuilderDialogService);
  /** Экспорт/удаление курсов — переиспользует store конструктора курсов. */
  private readonly courseBuilderStore = inject(CourseBuilderStore);
  private readonly scenarioBuilderDialog = inject(ScenarioBuilderDialogService);
  /**
   * Store конструктора сценариев — переиспользуется Проводником для удаления
   * сценария и «Каталога сценариев» (список, scope, пагинация). Состояние
   * списка НЕ дублируется в store Проводника (план, Этап 4).
   */
  protected readonly scenarioBuilderStore = inject(ScenarioBuilderStore);
  private readonly cardEditorDialog = inject(CardEditorDialogService);
  /** Store for card editor operations (delete, create). */
  private readonly cardEditorStore = inject(CardEditorStore);
  private readonly programBuilderDialog = inject(ProgramBuilderDialogService);
  private readonly lessonBuilderDialog = inject(LessonBuilderDialogService);
  private readonly programsApi = inject(ProgramsApiService);
  private readonly lessonsApi = inject(LessonsApiService);
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly scormExportService = inject(ScormExportService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly logger = inject(AppLoggerService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  /** Whether a dialog flow is in progress (passed to the detail panel). */
  protected readonly acting = signal(false);

  // ── Tree resize logic ──────────────────────────────────────────

  readonly treeWidth = signal<number>(
    isPlatformBrowser(this.platformId)
      ? Number(localStorage.getItem(TREE_WIDTH_KEY)) || TREE_DEFAULT_WIDTH
      : TREE_DEFAULT_WIDTH,
  );

  readonly isResizing = signal(false);

  private _isResizing = false;
  private _startX = 0;
  private _startWidth = 0;

  readonly onMouseDownResize = (event: MouseEvent) => {
    event.preventDefault();
    this._isResizing = true;
    this.isResizing.set(true);
    this._startX = event.clientX;
    this._startWidth = this.treeWidth();

    // Listen outside Angular zone to avoid excessive change detection
    this.ngZone.runOutsideAngular(() => {
      const onMouseMove = (e: MouseEvent) => this._onMouseMove(e);
      const onMouseUp = () => {
        this._isResizing = false;
        this.isResizing.set(false);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  };

  private _onMouseMove = (event: MouseEvent) => {
    if (!this._isResizing) return;
    const delta = event.clientX - this._startX;
    const newWidth = Math.min(TREE_MAX_WIDTH, Math.max(TREE_MIN_WIDTH, this._startWidth + delta));
    this.treeWidth.set(newWidth);
  };

  constructor() {
    // Persist tree width to localStorage
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(TREE_WIDTH_KEY, String(this.treeWidth()));
      }
    });

    // Cleanup: stop resizing on destroy
    this.destroyRef.onDestroy(() => {
      this._isResizing = false;
    });
  }
  /** Открыт ли inline-каталог сценариев в header-зоне страницы. */
  protected readonly catalogOpen = signal(false);
  /** Backlinks «Где используется» for the selected card. */
  protected readonly cardUsages = signal<readonly ScenarioIndexEntry[] | null>(null);
  protected readonly cardUsagesLoading = signal(false);
  /** Card kind derived from selected node (for create-card action). */
  protected readonly cardKind = computed(() => {
    const node = this.store.selectedNode();
    if (node?.kind === 'card') {
      const data = node.data as { kind?: string } | undefined;
      return data?.kind ?? '';
    }
    return '';
  });

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
        // Expand the parent so the newly created program is visible immediately.
        node.expanded.set(true);
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
        // Expand the parent so the newly created lesson is visible immediately.
        node.expanded.set(true);
        await this.store.refreshNode(node);
      }
    } finally {
      this.acting.set(false);
    }
  }

  /**
   * «+ Сценарий» — открывает конструктор сценариев в режиме создания.
   *
   * После сохранения привязывает созданный сценарий к выбранному уроку
   * (точечный PUT курса целиком через `CourseWritePayload`), обновляет узел
   * урока в дереве и выбирает новый scenario-узел.
   *
   * Ошибка привязки некритична: сценарий уже создан — показывается
   * неблокирующее уведомление, откат не выполняется.
   */
  protected async onAddScenarioRequested(): Promise<void> {
    if (this.acting()) {
      return;
    }

    const lessonNode = this.store.selectedNode();
    const hasLessonContext =
      lessonNode !== null &&
      lessonNode.kind === 'lesson' &&
      !lessonNode.virtual &&
      lessonNode.editable;

    this.acting.set(true);
    try {
      const result = await this.scenarioBuilderDialog.openCreate();

      if (!result?.saved || !result.scenarioId) {
        if (result) {
          this.snackBar.open('Создание сценария отменено', undefined, { duration: 5000 });
        }
        return;
      }

      if (!hasLessonContext || !lessonNode) {
        this.snackBar.open('Сценарий создан', undefined, { duration: 5000 });
        return;
      }

      const bound = await this.bindScenarioToLesson(lessonNode, result.scenarioId);

      if (!bound) {
        this.snackBar.open(
          'Сценарий создан, но не удалось привязать его к уроку — добавьте его в конструкторе курсов',
          'Закрыть',
          { duration: 8000 },
        );
        return;
      }

      // Дерево показывает сценарии урока по `lesson.scenarioIds`: раскрываем
      // узел урока (иначе refreshNode не перезагрузит детей) и выбираем
      // новый scenario-узел.
      lessonNode.expanded.set(true);
      await this.store.refreshNode(lessonNode);
      this.selectScenarioNode(lessonNode, result.scenarioId);
      this.snackBar.open('Сценарий создан и добавлен в урок', undefined, { duration: 5000 });
    } finally {
      this.acting.set(false);
    }
  }

  /**
   * Привязывает сценарий к уроку точечным обновлением курса (`PUT /courses/{id}`):
   * свежий `getById` → маппинг в `CourseWritePayload` без валидаций
   * `normalizeDraft` → append `scenarioId` в целевой урок → `update` →
   * сброс кеша `getById`.
   *
   * @returns `true` при успешном PUT; `false` при ошибке (сценарий сохранён).
   */
  private async bindScenarioToLesson(
    lessonNode: ExplorerNode,
    scenarioId: string,
  ): Promise<boolean> {
    const courseNode = this.store.pathOf(lessonNode).find((node) => node.kind === 'course');
    if (!courseNode) {
      return false;
    }

    try {
      const course = await this.courseSearchService.getById(courseNode.id);
      const payload = appendScenarioToLessonPayload(
        courseWithProgramsToWritePayload(course),
        lessonNode.id,
        scenarioId,
      );
      await this.courseSearchService.update(courseNode.id, payload);
      this.courseSearchService.clearGetByIdCache();
      return true;
    } catch (error) {
      this.logger.error('ContentExplorer: failed to bind scenario to lesson', error);
      return false;
    }
  }

  /** Выбирает scenario-узел урока в дереве (после refreshNode дети пересоздаются). */
  private selectScenarioNode(lessonNode: ExplorerNode, scenarioId: string): void {
    const children = lessonNode.children();
    const scenarioNode = children?.find(
      (node) => node.kind === 'scenario' && node.id === scenarioId,
    );
    if (scenarioNode) {
      this.store.selectNode(scenarioNode);
    }
  }

  // ——— «Каталог сценариев» (Этап 4 миграции) ———

  /**
   * Переключает видимость inline-каталога сценариев. При открытии список
   * перезагружается: `ScenarioBuilderStore` — root-синглтон, его список
   * может быть устаревшим с прошлого открытия.
   */
  protected onToggleCatalog(): void {
    this.catalogOpen.update((open) => !open);
    if (this.catalogOpen()) {
      void this.scenarioBuilderStore.loadList();
    }
  }

  /** Безопасный доступ к элементам текущей страницы списка каталога. */
  protected catalogItems(): readonly ScenarioIndexEntry[] {
    return this.scenarioBuilderStore.indexItems() ?? [];
  }

  /**
   * Смена scope каталога («Мои / Опубликованные / Все»). `setListScope`
   * сбрасывает пагинацию на страницу 0; список перезагружается здесь
   * (store сам этого не делает — как и на старой странице конструктора).
   */
  protected onCatalogScopeChange(event: MatButtonToggleChange): void {
    this.scenarioBuilderStore.setListScope(event.value as ScenarioListScope);
    void this.scenarioBuilderStore.loadList();
  }

  /**
   * Пагинация каталога. Дерево при этом не трогается: сценарии урока
   * грузятся по `lesson.scenarioIds` без пагинации (осознанное
   * ограничение, план Этап 4).
   */
  protected onCatalogPageChange(event: PageEvent): void {
    this.scenarioBuilderStore.setPage(event.pageIndex, event.pageSize);
    void this.scenarioBuilderStore.loadList();
  }

  /**
   * «Создать сценарий» из каталога — создание без привязки к уроку
   * (даже если в дереве выбран lesson-узел). После сохранения достаточно
   * перезагрузить список каталога: автономные сценарии в дереве не живут.
   */
  protected async onCatalogCreateRequested(): Promise<void> {
    if (this.acting()) {
      return;
    }

    this.acting.set(true);
    try {
      const result = await this.scenarioBuilderDialog.openCreate();
      if (result?.saved) {
        await this.scenarioBuilderStore.loadList();
        this.snackBar.open('Сценарий создан', undefined, { duration: 5000 });
      }
    } finally {
      this.acting.set(false);
    }
  }

  /**
   * «Редактировать» из каталога — открывает общий диалог сценария
   * (для чужих сценариев он read-only). Дерево не меняется; после
   * сохранения перезагружается список каталога.
   */
  protected async onCatalogEditRequested(scenarioId: string): Promise<void> {
    if (this.acting()) {
      return;
    }

    this.acting.set(true);
    try {
      const result = await this.scenarioBuilderDialog.openEdit(scenarioId);
      if (result?.saved) {
        await this.scenarioBuilderStore.loadList();
      }
    } finally {
      this.acting.set(false);
    }
  }

  /** «Создать курс» — открывает конструктор курсов в режиме создания. */
  protected async onCreateCourseRequested(): Promise<void> {
    if (this.acting()) {
      return;
    }
    this.acting.set(true);
    try {
      const result = await this.courseBuilderDialog.openCreate();
      if (result?.saved) {
        await this.store.loadRoots();
      }
    } finally {
      this.acting.set(false);
    }
  }

  /** Экспорт выбранного курса в PDF без подсказок. */
  protected async onExportPdfRequested(): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || node.kind !== 'course' || this.acting()) {
      return;
    }

    this.acting.set(true);
    try {
      const success = await this.courseBuilderStore.exportPdf(node.id, false);
      if (!success) {
        const error = this.courseBuilderStore.exportError();
        if (error) {
          this.snackBar.open(error, 'Закрыть', { duration: 8000 });
        }
        return;
      }
      this.snackBar.open('PDF с оглавлением экспортирован', 'Закрыть', { duration: 4000 });
    } finally {
      this.acting.set(false);
    }
  }

  /** Экспорт выбранного курса в PDF с подсказками. */
  protected async onExportPdfWithHintsRequested(): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || node.kind !== 'course' || this.acting()) {
      return;
    }

    this.acting.set(true);
    try {
      const success = await this.courseBuilderStore.exportPdf(node.id, true);
      if (!success) {
        const error = this.courseBuilderStore.exportError();
        if (error) {
          this.snackBar.open(error, 'Закрыть', { duration: 8000 });
        }
        return;
      }
      this.snackBar.open('PDF с оглавлением и подсказками экспортирован', 'Закрыть', {
        duration: 4000,
      });
    } finally {
      this.acting.set(false);
    }
  }

  /** Экспорт выбранного курса в JSON (CourseBundle). */
  protected async onExportJsonRequested(): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || node.kind !== 'course' || this.acting()) {
      return;
    }

    this.acting.set(true);
    try {
      const json = await this.courseBuilderStore.exportCourseBundle(node.id);
      if (!json) {
        const error = this.courseBuilderStore.exportError();
        if (error) {
          this.snackBar.open(error, 'Закрыть', { duration: 8000 });
        }
        return;
      }

      this.downloadJson(json, `${node.id}.linguacode-course.json`, 'application/json');
      this.snackBar.open(
        "Файл экспортирован. Передайте его maintainer'у для добавления в общий каталог.",
        'Закрыть',
        { duration: 10000 },
      );
    } finally {
      this.acting.set(false);
    }
  }

  /** Экспорт выбранного курса в SCORM/xAPI-пакет. */
  protected async onExportScormRequested(): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || node.kind !== 'course' || this.acting()) {
      return;
    }

    this.acting.set(true);
    try {
      const bundle = await this.scormExportService.export(node.id);
      this.downloadJson(
        JSON.stringify(bundle, null, 2),
        `${node.id}-scorm.json`,
        'application/json',
      );
      this.snackBar.open('SCORM-пакет экспортирован', 'Закрыть', { duration: 4000 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка экспорта в SCORM';
      this.snackBar.open(message, 'Закрыть', { duration: 8000 });
    } finally {
      this.acting.set(false);
    }
  }

  /**
   * Удаление выбранного сценария (с подтверждением).
   *
   * После подтверждения делегирует удаление в `ScenarioBuilderStore`
   * (с проверкой владения по данным узла), затем каскадно убирает id
   * сценария из `lesson.scenarioIds` урока (защитная мера на случай,
   * если бэкенд не делает это сам), обновляет узел урока в дереве и
   * снимает выделение. Ошибка удаления — snackbar с текстом из store.
   */
  protected async onDeleteScenarioRequested(): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || node.kind !== 'scenario' || node.virtual || !node.editable || this.acting()) {
      return;
    }

    const confirmed = await this.dialog
      .open(ScenarioDeleteConfirmDialogComponent, {
        minWidth: '400px',
        data: { scenarioTitle: node.title() },
      })
      .afterClosed()
      .toPromise();

    if (!confirmed) {
      return;
    }

    this.acting.set(true);
    try {
      const entry = this.scenarioEntryFromNode(node);
      await this.scenarioBuilderStore.deleteScenario(node.id, entry);
      const error = this.scenarioBuilderStore.error();
      if (error) {
        this.snackBar.open(error, 'Закрыть', { duration: 8000 });
        return;
      }

      const lessonNode = node.parentId ? this.store.getByKey(node.parentId) : null;
      if (lessonNode && lessonNode.kind === 'lesson') {
        // Защитный каскад: убираем id из lesson.scenarioIds (идемпотентно —
        // если бэкенд уже убрал, payload не меняется и PUT не нужен).
        await this.unbindScenarioFromLesson(lessonNode, node.id);
        await this.store.refreshNode(lessonNode);
      }
      this.store.clearSelection();
      this.snackBar.open('Сценарий удалён', 'Закрыть', { duration: 4000 });
    } finally {
      this.acting.set(false);
    }
  }

  /**
   * Удаление выбранной программы (с подтверждением).
   *
   * Каскадно удаляет все вложенные данные (уроки, сценарии, карточки)
   * через API. Обновляет родительский узел курса и снимает выделение.
   */
  protected async onDeleteProgramRequested(): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || node.kind !== 'program' || this.acting()) {
      return;
    }

    const confirmed = await this.dialog
      .open(ProgramDeleteConfirmDialogComponent, {
        minWidth: '400px',
        data: { programTitle: node.title() },
      })
      .afterClosed()
      .toPromise();

    if (!confirmed) {
      return;
    }

    this.acting.set(true);
    try {
      await this.programsApi.delete(node.id);
      // Обновляем родительский курс (чтобы пересчитать количество уроков)
      const courseNode = this.store.parentCourseOf(node);
      if (courseNode) {
        await this.store.refreshNode(courseNode);
      }
      this.store.clearSelection();
      this.snackBar.open('Программа удалена', 'Закрыть', { duration: 4000 });
    } catch (error) {
      this.logger.error('ContentExplorer: failed to delete program', error);
      this.snackBar.open('Не удалось удалить программу', 'Закрыть', { duration: 8000 });
    } finally {
      this.acting.set(false);
    }
  }

  /**
   * Удаление выбранного урока (с подтверждением).
   *
   * Каскадно удаляет все вложенные данные (сценарии, карточки)
   * через API. Обновляет родительский трек и снимает выделение.
   */
  protected async onDeleteLessonRequested(): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || node.kind !== 'lesson' || this.acting()) {
      return;
    }

    const confirmed = await this.dialog
      .open(LessonDeleteConfirmDialogComponent, {
        minWidth: '400px',
        data: { lessonTitle: node.title() },
      })
      .afterClosed()
      .toPromise();

    if (!confirmed) {
      return;
    }

    this.acting.set(true);
    try {
      await this.lessonsApi.delete(node.id);
      // Обновляем родительский трек (чтобы пересчитать количество сценариев)
      const programNode = node.parentId ? this.store.getByKey(node.parentId) : null;
      if (programNode && programNode.kind === 'program') {
        await this.store.refreshNode(programNode);
      }
      this.store.clearSelection();
      this.snackBar.open('Урок удалён', 'Закрыть', { duration: 4000 });
    } catch (error) {
      this.logger.error('ContentExplorer: failed to delete lesson', error);
      this.snackBar.open('Не удалось удалить урок', 'Закрыть', { duration: 8000 });
    } finally {
      this.acting.set(false);
    }
  }

  /**
   * Создание карточки из проводника контента.
   *
   * Открывает диалог создания карточки. После успешного создания
   * обновляет родительский сценарий в дереве.
   */
  protected async onCreateCardRequested(kind: string): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || this.acting()) {
      return;
    }

    this.acting.set(true);
    try {
      const result = await this.cardEditorDialog.openCreate(
        kind as import('../../../entities/card/model').CardKind,
      );
      if (result?.saved) {
        const parentScenario = node.parentId ? this.store.getByKey(node.parentId) : null;
        if (parentScenario && parentScenario.kind === 'scenario') {
          await this.store.refreshNode(parentScenario);
        }
        this.snackBar.open('Карточка создана', 'Закрыть', { duration: 4000 });
      }
    } finally {
      this.acting.set(false);
    }
  }

  /**
   * Удаление выбранной карточки (с подтверждением).
   *
   * Делегирует удаление в `CardEditorStore` (с проверкой: не используется
   * в сценариях, нет результатов обучения). Обновляет родительский
   * сценарий в дереве и снимает выделение.
   */
  protected async onDeleteCardRequested(): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || node.kind !== 'card' || this.acting()) {
      return;
    }

    const confirmed = await this.dialog
      .open(CardDeleteConfirmDialogComponent, {
        minWidth: '400px',
        data: { cardTitle: node.title() },
      })
      .afterClosed()
      .toPromise();

    if (!confirmed) {
      return;
    }

    this.acting.set(true);
    try {
      const success = await this.cardEditorStore.deleteCard(node.id);
      const error = this.cardEditorStore.error();
      if (!success && error) {
        this.snackBar.open(error, 'Закрыть', { duration: 8000 });
        return;
      }
      // Обновляем родительский сценарий
      const parentScenario = node.parentId ? this.store.getByKey(node.parentId) : null;
      if (parentScenario && parentScenario.kind === 'scenario') {
        await this.store.refreshNode(parentScenario);
      }
      this.store.clearSelection();
      this.snackBar.open('Карточка удалена', 'Закрыть', { duration: 4000 });
    } catch (error) {
      this.logger.error('ContentExplorer: failed to delete card', error);
      this.snackBar.open('Не удалось удалить карточку', 'Закрыть', { duration: 8000 });
    } finally {
      this.acting.set(false);
    }
  }

  /** Собирает `ScenarioIndexEntry` из данных scenario-узла (для проверки владения). */
  private scenarioEntryFromNode(node: ExplorerNode): ScenarioIndexEntry | undefined {
    const scenario = node.data as Scenario | null;
    if (!scenario) {
      return undefined;
    }
    return {
      id: scenario.id,
      title: scenario.title,
      authorId: scenario.authorId,
      cardSourceMode: scenario.cardSource.mode,
      cardSourceSummary: '',
      published: scenario.published,
      updatedAt: scenario.updatedAt,
    };
  }

  /**
   * Каскадно убирает сценарий из `scenarioIds` урока точечным обновлением курса
   * (`PUT /courses/{id}`): свежий `getById` → маппинг в `CourseWritePayload` →
   * удаление id → `update` → сброс кеша `getById`. Некритичная операция:
   * при ошибке дерево уже отрисует «Сценарий (не найден в каталоге)».
   */
  private async unbindScenarioFromLesson(
    lessonNode: ExplorerNode,
    scenarioId: string,
  ): Promise<void> {
    const courseNode = this.store.pathOf(lessonNode).find((node) => node.kind === 'course');
    if (!courseNode) {
      return;
    }

    try {
      const course = await this.courseSearchService.getById(courseNode.id);
      const lesson = course.programs
        .flatMap((program) => program.lessons ?? [])
        .find((item) => item.id === lessonNode.id);
      if (!lesson || !lesson.scenarioIds.includes(scenarioId)) {
        // Сценарий уже не привязан к уроку (каскад на бэкенде) — PUT не нужен.
        return;
      }

      const payload = removeScenarioFromLessonPayload(
        courseWithProgramsToWritePayload(course),
        lessonNode.id,
        scenarioId,
      );
      await this.courseSearchService.update(courseNode.id, payload);
      this.courseSearchService.clearGetByIdCache();
    } catch (error) {
      this.logger.error('ContentExplorer: failed to unbind scenario from lesson', error);
    }
  }

  /** Удаление выбранного курса (с подтверждением). */
  protected async onDeleteCourseRequested(): Promise<void> {
    const node = this.store.selectedNode();
    if (!node || node.kind !== 'course' || this.acting()) {
      return;
    }

    const confirmed = await this.dialog
      .open(CourseDeleteConfirmDialogComponent, {
        minWidth: '400px',
        data: { courseTitle: node.title() },
      })
      .afterClosed()
      .toPromise();

    if (!confirmed) {
      return;
    }

    this.acting.set(true);
    try {
      await this.courseBuilderStore.deleteCourse(node.id);
      const error = this.courseBuilderStore.error();
      if (error) {
        this.snackBar.open(error, 'Закрыть', { duration: 8000 });
        return;
      }
      this.store.clearSelection();
      await this.store.loadRoots();
      this.snackBar.open('Курс удалён', 'Закрыть', { duration: 4000 });
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
   * Загружает текстовый файл в браузере (JSON-экспорт: CourseBundle / SCORM).
   */
  private downloadJson(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
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
