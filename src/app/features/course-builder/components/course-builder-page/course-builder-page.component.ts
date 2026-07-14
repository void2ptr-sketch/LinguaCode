/**
 * Компонент страницы конструктора курсов.
 *
 * Отображает список курсов с возможностью:
 * - Поиска и фильтрации (мои / опубликованные / все)
 * - Пагинации
 * - Создания нового курса
 * - Редактирования существующего курса
 * - Удаления собственного курса
 * - Экспорта курса в JSON (CourseBundle)
 * - Экспорта курса в PDF с оглавлением
 * - Сброса пользовательских данных (overlay) из localStorage
 *
 * Данные загружаются через CourseBuilderStore, который использует
 * mock-интерсепторы для работы без бэкенда.
 */
import { Component, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import type { CourseListScope } from '../../../../core/models';
import { UiPaginationComponent } from '../../../../shared/pagination';
import { UserStore } from '../../../../core/state';
import { CourseBuilderDialogService } from '../course-builder-dialog/course-builder-dialog.service';
import { CourseBuilderStore } from '../../services/course-builder.store';

/**
 * Глобальная переменная для отслеживания смены language pair.
 * При смене языка приложения — перезагружает список курсов.
 * Используется для предотвращения лишних запросов при инициализации.
 */
let lastKnownCourseBuilderActiveLanguagePairId: string | null = null;

/**
 * Компонент страницы конструктора курсов.
 *
 * Основной UI-компонент для управления курсами:
 * - Отображает список курсов с пагинацией
 * - Предоставляет кнопки для CRUD-операций
 * - Обработчики экспорта в JSON и PDF
 * - Кнопка сброса overlay (очистка localStorage)
 */
@Component({
  selector: 'app-course-builder-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    UiPaginationComponent,
  ],
  templateUrl: './course-builder-page.component.html',
  styleUrl: './course-builder-page.component.scss',
})
export class CourseBuilderPageComponent implements OnInit {
  /** Хранилище состояния конструктора курсов */
  readonly store = inject(CourseBuilderStore);
  /** Хранилище пользователя (текущий язык, ID) */
  readonly userStore = inject(UserStore);
  /** Сервис диалогов для создания/редактирования курсов */
  private readonly courseBuilderDialog = inject(CourseBuilderDialogService);
  /** Сервис Snackbar для уведомлений */
  private readonly snackBar = inject(MatSnackBar);
  /** Сервис Dialog для модальных окон */
  private readonly dialog = inject(MatDialog);

  /**
   * Effect: отслеживает смену activeLanguagePairId.
   * При смене языка — перезагружает список курсов.
   * Игнорирует начальную инициализацию (когда lastKnown === null).
   */
  private readonly reloadOnActivePairChange = effect(() => {
    const activeId = this.userStore.activeLanguagePairId();

    if (
      lastKnownCourseBuilderActiveLanguagePairId !== null &&
      lastKnownCourseBuilderActiveLanguagePairId !== activeId
    ) {
      void this.store.loadList();
    }

    lastKnownCourseBuilderActiveLanguagePairId = activeId;
  });

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Инициализация компонента.
   * Загружает список курсов при старте.
   */
  async ngOnInit(): Promise<void> {
    await this.store.load();
  }

  // -------------------------------------------------------------------------
  // CRUD-операции
  // -------------------------------------------------------------------------

  /**
   * Открывает диалог создания нового курса.
   * После сохранения — перезагружает список.
   */
  async startCreate(): Promise<void> {
    const result = await this.courseBuilderDialog.openCreate();
    if (result?.saved) {
      await this.store.loadList();
    }
  }

  /**
   * Открывает диалог редактирования курса.
   * @param courseId — ID курса для редактирования
   */
  async startEdit(courseId: string): Promise<void> {
    const result = await this.courseBuilderDialog.openEdit(courseId);
    if (result?.saved) {
      await this.store.loadList();
    }
  }

  /**
   * Удаляет курс.
   * @param courseId — ID курса для удаления
   */
  async deleteCourse(courseId: string): Promise<void> {
    await this.store.deleteCourse(courseId);
  }

  // -------------------------------------------------------------------------
  // Фильтры и пагинация
  // -------------------------------------------------------------------------

  /**
   * Обработчик изменения поискового запроса.
   * Сбрасывает на первую страницу и перезагружает список.
   * @param value — текст поиска
   */
  onListQueryChange(value: string): void {
    this.store.setListQuery(value);
    void this.store.loadList();
  }

  /**
   * Обработчик изменения области видимости.
   * Сбрасывает на первую страницу и перезагружает список.
   * @param scope — 'mine' | 'published' | 'all'
   */
  onListScopeChange(scope: CourseListScope): void {
    this.store.setListScope(scope);
    void this.store.loadList();
  }

  /**
   * Обработчик изменения пагинации.
   * Устанавливает новую страницу и перезагружает список.
   * @param event — событие изменения пагинации
   */
  onListPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex, event.pageSize);
    void this.store.loadList();
  }

  // -------------------------------------------------------------------------
  // Вспомогательные методы
  // -------------------------------------------------------------------------

  /**
   * Проверяет, является ли курс собственным.
   * @param authorId — ID автора курса
   * @returns true если текущий пользователь — автор
   */
  isOwnCourse(authorId: string): boolean {
    return authorId === this.userStore.user().id;
  }

  // -------------------------------------------------------------------------
  // Экспорт
  // -------------------------------------------------------------------------

  /**
   * Экспортирует курс в JSON (CourseBundle).
   * Файл сохраняется с расширением .linguacode-course.json.
   * Используется для передачи maintainer'у.
   *
   * @param courseId — ID курса для экспорта
   */
  async exportCourse(courseId: string): Promise<void> {
    const json = await this.store.exportCourseBundle(courseId);
    if (!json) {
      const error = this.store.exportError();
      if (error) {
        this.snackBar.open(error, 'Закрыть', { duration: 8000 });
      }
      return;
    }

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${courseId}.linguacode-course.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    this.snackBar.open(
      "Файл экспортирован. Передайте его maintainer'у для добавления в общий каталог.",
      'Закрыть',
      { duration: 10000 },
    );
  }

  /**
   * Экспортирует курс в PDF без подсказок.
   * Показывает вопросы и варианты ответов без выделения правильных.
   *
   * @param courseId — ID курса для экспорта
   */
  async exportPdf(courseId: string): Promise<void> {
    const success = await this.store.exportPdf(courseId, false);
    if (!success) {
      const error = this.store.exportError();
      if (error) {
        this.snackBar.open(error, 'Закрыть', { duration: 8000 });
      }
      return;
    }

    this.snackBar.open('PDF с оглавлением экспортирован', 'Закрыть', { duration: 4000 });
  }

  /**
   * Экспортирует курс в PDF с подсказками.
   * Правильные ответы отмечены символом ✓.
   *
   * @param courseId — ID курса для экспорта
   */
  async exportPdfWithHints(courseId: string): Promise<void> {
    const success = await this.store.exportPdf(courseId, true);
    if (!success) {
      const error = this.store.exportError();
      if (error) {
        this.snackBar.open(error, 'Закрыть', { duration: 8000 });
      }
      return;
    }

    this.snackBar.open('PDF с оглавлением и подсказками экспортирован', 'Закрыть', {
      duration: 4000,
    });
  }
}
