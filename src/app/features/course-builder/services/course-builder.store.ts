import { Injectable, computed, inject, signal } from '@angular/core';

import { activeLanguagePairCriteria } from '../../../core/data/language-pair-scope.utils';
import { normalizeLanguagePair } from '../../../core/data/language-pair.utils';
import { CourseSearchService } from '../../../core/data';
import type { CourseIndexEntry, CourseListScope, CourseWithLessons } from '../../../core/models';
import { sanitizePlainText } from '../../../core/security';
import { UserStore } from '../../../core/state';
import { isEditableContentAuthor } from '../../../core/data/system-author.constants';
import { DEFAULT_PAGE_SIZE } from '../../../shared/pagination';
import type { CourseFormDraft, CourseEditorMode } from '../types';
import { formDraftToCourseWritePayload } from '../utils/course-form-draft.utils';

const sanitizeTitle = (value: string): string => sanitizePlainText(value, 128);
const sanitizeDescription = (value: string): string => sanitizePlainText(value, 512);

@Injectable({ providedIn: 'root' })
export class CourseBuilderStore {
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly userStore = inject(UserStore);

  readonly indexItems = signal<readonly CourseIndexEntry[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly listQuery = signal('');
  readonly listScope = signal<CourseListScope>('mine');

  readonly loading = signal(false);
  readonly editorLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editorMode = signal<CourseEditorMode>('list');
  readonly editingCourseId = signal<string | null>(null);
  readonly editingCourse = signal<CourseWithLessons | null>(null);

  readonly isReadOnly = computed(() => {
    const course = this.editingCourse();
    if (!course) {
      return false;
    }

    return !isEditableContentAuthor(course.authorId, this.userStore.user().id);
  });

  async loadList(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const pair = this.userStore.languagePair();
      const page = await this.courseSearchService.search({
        query: this.listQuery().trim() || undefined,
        scope: this.listScope(),
        ...activeLanguagePairCriteria(pair),
        page: { page: this.pageIndex(), pageSize: this.pageSize() },
      });

      this.indexItems.set(page.items);
      this.totalItems.set(page.totalItems);
    } catch {
      this.error.set('Не удалось загрузить список курсов');
    } finally {
      this.loading.set(false);
    }
  }

  async load(): Promise<void> {
    await this.loadList();
  }

  setListQuery(query: string): void {
    this.listQuery.set(query);
    this.pageIndex.set(0);
  }

  setListScope(scope: CourseListScope): void {
    this.listScope.set(scope);
    this.pageIndex.set(0);
  }

  setPage(pageIndex: number, pageSize: number): void {
    this.pageIndex.set(pageIndex);
    this.pageSize.set(pageSize);
  }

  startCreate(): void {
    this.editorMode.set('create');
    this.editingCourseId.set(null);
    this.editingCourse.set(null);
    this.error.set(null);
  }

  async startEdit(courseId: string): Promise<void> {
    this.editorLoading.set(true);
    this.error.set(null);

    try {
      const course = await this.courseSearchService.getById(courseId);
      this.editorMode.set('edit');
      this.editingCourseId.set(courseId);
      this.editingCourse.set(course);
    } catch {
      this.error.set('Не удалось загрузить курс');
    } finally {
      this.editorLoading.set(false);
    }
  }

  cancelEdit(): void {
    this.editorMode.set('list');
    this.editingCourseId.set(null);
    this.editingCourse.set(null);
    this.error.set(null);
  }

  async createCourse(draft: CourseFormDraft): Promise<boolean> {
    const payload = this.normalizeDraft(draft);
    if (!payload) {
      return false;
    }

    try {
      await this.courseSearchService.create({
        ...payload,
        languagePair: this.userStore.languagePair(),
      });
      this.cancelEdit();
      await this.loadList();
      return true;
    } catch {
      this.error.set('Не удалось создать курс');
      return false;
    }
  }

  async updateCourse(courseId: string, draft: CourseFormDraft): Promise<boolean> {
    if (this.isReadOnly()) {
      this.error.set('Нельзя изменять чужой курс');
      return false;
    }

    const payload = this.normalizeDraft(draft);
    if (!payload) {
      return false;
    }

    const current = this.editingCourse();

    try {
      await this.courseSearchService.update(courseId, {
        ...payload,
        languagePair: normalizeLanguagePair(current?.languagePair ?? this.userStore.languagePair()),
      });
      this.cancelEdit();
      await this.loadList();
      return true;
    } catch {
      this.error.set('Не удалось сохранить курс');
      return false;
    }
  }

  async deleteCourse(courseId: string): Promise<void> {
    const item = this.indexItems().find((course) => course.id === courseId);
    if (item && !isEditableContentAuthor(item.authorId, this.userStore.user().id)) {
      this.error.set('Нельзя удалять чужой курс');
      return;
    }

    try {
      await this.courseSearchService.delete(courseId);
      if (this.editingCourseId() === courseId) {
        this.cancelEdit();
      }
      await this.loadList();
    } catch {
      this.error.set('Не удалось удалить курс');
    }
  }

  private normalizeDraft(draft: CourseFormDraft) {
    const title = sanitizeTitle(draft.title);
    const description = sanitizeDescription(draft.description);
    const lessons = draft.lessons
      .map((lesson, index) => ({
        ...lesson,
        title: sanitizeTitle(lesson.title),
        description: sanitizeDescription(lesson.description),
        scenarioIds: lesson.scenarioIds.map((id) => sanitizePlainText(id, 64)).filter(Boolean),
        prerequisiteLessonIds: lesson.prerequisiteLessonIds
          .map((id) => sanitizePlainText(id, 64))
          .filter(Boolean),
        order: lesson.order ?? index,
      }))
      .filter((lesson) => lesson.title);

    if (!title) {
      this.error.set('Укажите название курса');
      return null;
    }

    if (lessons.length === 0) {
      this.error.set('Добавьте хотя бы один урок');
      return null;
    }

    for (const lesson of lessons) {
      if (lesson.scenarioIds.length === 0) {
        this.error.set(`Урок «${lesson.title}»: добавьте хотя бы один сценарий`);
        return null;
      }
    }

    return formDraftToCourseWritePayload({
      title,
      description,
      published: draft.published,
      lessons,
    });
  }
}
