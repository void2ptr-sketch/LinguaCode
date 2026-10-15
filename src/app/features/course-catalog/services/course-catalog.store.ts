import { Injectable, computed, signal, type Signal } from '@angular/core';
import type { CourseIndexEntry } from '../../../entities/course/model';
import type { PageEvent } from '@angular/material/paginator';
import { CourseCatalogState, initialState } from '../models/course-catalog-store';

/**
 * Store каталога курсов: поиск, пагинация, прогресс, вкладки.
 *
 * Черновики профиля/настроек вынесены в отдельные сторы:
 * - `ProfileDraftsStore` — черновики профиля;
 * - `CourseTabDraftsStore` — черновики вкладки «Курсы»;
 * - `SettingsDraftsStore` — черновики вкладки «Настройки».
 */
@Injectable({ providedIn: 'root' })
export class CourseCatalogStore {
  #state = signal<CourseCatalogState>({ ...initialState });

  // --- Селекторы (read-only) ---

  /** Текущие элементы каталога (страница). */
  get items(): Signal<readonly CourseIndexEntry[]> {
    return computed(() => this.#state().items);
  }

  /** Общее количество элементов каталога. */
  get totalItems(): Signal<number> {
    return computed(() => this.#state().totalItems);
  }

  /** Текущий индекс страницы (с нуля). */
  get pageIndex(): Signal<number> {
    return computed(() => this.#state().pageIndex);
  }

  /** Размер страницы. */
  get pageSize(): Signal<number> {
    return computed(() => this.#state().pageSize);
  }

  /** Признак загрузки каталога. */
  get loading(): Signal<boolean> {
    return computed(() => this.#state().loading);
  }

  /** Сообщение об ошибке, если загрузка не удалась. */
  get error(): Signal<string | null> {
    return computed(() => this.#state().error);
  }

  /** Прогресс по ID курса (0–100). */
  get progressByCourseId(): Signal<Readonly<Record<string, number>>> {
    return computed(() => this.#state().progressByCourseId);
  }

  /** Множество завершённых курсов. */
  get completedCourseIds(): Signal<ReadonlySet<string>> {
    return computed(() => this.#state().completedCourseIds);
  }

  /** Индекс выбранной вкладки. */
  get selectedTabIndex(): Signal<number> {
    return computed(() => this.#state().selectedTabIndex);
  }

  // --- Мутации ---

  setItems(items: readonly CourseIndexEntry[]): void {
    this.#state.update((s) => ({ ...s, items }));
  }

  setTotalItems(total: number): void {
    this.#state.update((s) => ({ ...s, totalItems: total }));
  }

  setPageIndex(page: number): void {
    this.#state.update((s) => ({ ...s, pageIndex: page }));
  }

  setPageSize(size: number): void {
    this.#state.update((s) => ({ ...s, pageSize: size }));
  }

  setLoading(loading: boolean): void {
    this.#state.update((s) => ({ ...s, loading }));
  }

  setError(error: string | null): void {
    this.#state.update((s) => ({ ...s, error }));
  }

  setProgressByCourseId(progress: Record<string, number>): void {
    this.#state.update((s) => ({ ...s, progressByCourseId: progress }));
  }

  setCompletedCourseIds(completed: Set<string>): void {
    this.#state.update((s) => ({ ...s, completedCourseIds: completed }));
  }

  setSelectedTabIndex(index: number): void {
    this.#state.update((s) => ({ ...s, selectedTabIndex: index }));
  }

  /**
   * Обрабатывает событие пагинатора.
   *
   * @param event - событие страницы Angular Material paginator
   */
  onPageChange(event: PageEvent): void {
    this.#state.update((s) => ({
      ...s,
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
    }));
  }
}
