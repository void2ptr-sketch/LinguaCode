import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { describe, expect, it, vi } from 'vitest';

import { CourseBuilderDialogComponent } from './course-builder-dialog.component';
import { CourseBuilderStore } from '../../services/course-builder.store';
import { CoursePdfExportService } from '../../services/course-pdf-export.service';
import { scenariosApiMockInterceptor } from '../../../../entities/scenario/api/mock/scenarios-api.mock.interceptor';
import type { CourseWithLessons } from '../../../../entities/course/model';
import type { CourseBuilderDialogData } from './course-builder-dialog.types';

function createComponent(
  data: CourseBuilderDialogData,
  mockStore?: Partial<CourseBuilderStore>,
): {
  fixture: ComponentFixture<CourseBuilderDialogComponent>;
  component: CourseBuilderDialogComponent;
  store: CourseBuilderStore;
  snackBarOpen: ReturnType<typeof vi.fn>;
  closeSpy: ReturnType<typeof vi.fn>;
} {
  const snackBarOpen = vi.fn();
  const closeSpy = vi.fn();

  TestBed.resetTestingModule();

  TestBed.configureTestingModule({
    imports: [
      CourseBuilderDialogComponent,
      MatButtonModule,
      MatDialogModule,
      MatProgressSpinnerModule,
    ],
    providers: [
      CourseBuilderStore,
      CoursePdfExportService,
      { provide: MatSnackBar, useValue: { open: snackBarOpen } },
      { provide: MatDialogRef, useValue: { close: closeSpy } },
      { provide: MAT_DIALOG_DATA, useValue: data },
      provideHttpClient(withInterceptors([scenariosApiMockInterceptor])),
    ],
  });

  if (mockStore) {
    Object.entries(mockStore).forEach(([key, value]) => {
      const store = TestBed.inject(CourseBuilderStore);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (store as any)[key] = value;
    });
  }

  const fixture = TestBed.createComponent(CourseBuilderDialogComponent);
  const component = fixture.componentInstance;
  const store = TestBed.inject(CourseBuilderStore);
  fixture.detectChanges();

  return { fixture, component, store, snackBarOpen, closeSpy };
}

describe('CourseBuilderDialogComponent', () => {
  it('should create', () => {
    const { component } = createComponent({ mode: 'create', courseId: '' });
    expect(component).toBeDefined();
  });

  it('should have CourseBuilderStore injected', () => {
    const { component } = createComponent({ mode: 'create', courseId: '' });
    expect(component.store).toBeDefined();
  });

  it('should have draft signal', () => {
    const { component } = createComponent({ mode: 'create', courseId: '' });
    expect(component.draft()).toBeDefined();
    expect(component.draft().title).toBe('');
  });

  it('should have dirty computed', () => {
    const { component } = createComponent({ mode: 'create', courseId: '' });
    expect(component.dirty()).toBe(false);
  });

  it('should have title computed', () => {
    const { component } = createComponent({ mode: 'create', courseId: '' });
    expect(component.title()).toBe('Новый курс');
  });

  it('should have saveCourse method', () => {
    const { component } = createComponent({ mode: 'create', courseId: '' });
    expect(component.saveCourse).toBeDefined();
    expect(typeof component.saveCourse).toBe('function');
  });

  it('should have save and export methods', () => {
    const { component } = createComponent({ mode: 'create', courseId: '' });
    expect(component.saveCourse).toBeDefined();
    expect(component.exportPdf).toBeDefined();
  });

  it('should be instantiated', () => {
    const { component } = createComponent({ mode: 'create', courseId: '' });
    expect(component).toBeTruthy();
  });

  // ── Dirty state ──

  it('should detect dirty state after draft change', () => {
    const { component } = createComponent({ mode: 'create', courseId: '' });
    component.updateDraft({ ...component.draft(), title: 'Changed' });
    expect(component.dirty()).toBe(true);
  });

  it('should not be dirty when draft equals initial', () => {
    const { component } = createComponent({ mode: 'create', courseId: '' });
    expect(component.dirty()).toBe(false);
  });

  // ── updateDraft ──

  it('should update draft signal', () => {
    const { component } = createComponent({ mode: 'create', courseId: '' });
    expect(component.draft().title).toBe('');
    component.updateDraft({ ...component.draft(), title: 'New Title' });
    expect(component.draft().title).toBe('New Title');
  });

  // ── saveCourse ──

  it('should close dialog with saved:true on successful create', async () => {
    const { component, closeSpy } = createComponent(
      { mode: 'create', courseId: '' },
      {
        createCourse: async () => true,
      },
    );
    await component.saveCourse();
    expect(closeSpy).toHaveBeenCalledWith({ saved: true });
  });

  it('should not close dialog when create fails', async () => {
    const { component, closeSpy } = createComponent(
      { mode: 'create', courseId: '' },
      {
        createCourse: async () => false,
      },
    );
    await component.saveCourse();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('should close dialog with saved:true on successful update', async () => {
    const mockCourse: CourseWithLessons = {
      id: 'c1',
      title: 'Test',
      authorId: 'local-user',
      description: '',
      lessons: [],
      lessonIds: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    };

    const { component, closeSpy } = createComponent(
      { mode: 'edit', courseId: 'c1' },
      {
        updateCourse: async () => true,
        editingCourse: signal(mockCourse),
        isReadOnly: signal(false),
        startEdit: async () => undefined,
      },
    );
    await component.saveCourse();
    expect(closeSpy).toHaveBeenCalledWith({ saved: true });
  });

  it('should not close dialog when update fails', async () => {
    const mockCourse: CourseWithLessons = {
      id: 'c1',
      title: 'Test',
      authorId: 'local-user',
      description: '',
      lessons: [],
      lessonIds: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    };

    const { component, closeSpy } = createComponent(
      { mode: 'edit', courseId: 'c1' },
      {
        updateCourse: async () => false,
        editingCourse: signal(mockCourse),
        isReadOnly: signal(false),
        startEdit: async () => undefined,
      },
    );
    await component.saveCourse();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  // ── exportPdf ──

  it('should show snackbar when course is not loaded', async () => {
    const { component, snackBarOpen } = createComponent(
      { mode: 'create', courseId: '' },
      {
        editingCourse: signal(null),
      },
    );
    await component.exportPdf(false);
    expect(snackBarOpen).toHaveBeenCalledWith('Курс не загружен', 'Закрыть', { duration: 3000 });
  });

  it('should show success snackbar on PDF export success', async () => {
    const mockCourse: CourseWithLessons = {
      id: 'c1',
      title: 'Test',
      authorId: 'local-user',
      description: '',
      lessons: [],
      lessonIds: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    };

    const { component, snackBarOpen } = createComponent(
      { mode: 'edit', courseId: 'c1' },
      {
        editingCourse: signal(mockCourse),
        startEdit: async () => undefined,
      },
    );

    const pdfExportService = TestBed.inject(CoursePdfExportService);
    vi.spyOn(pdfExportService, 'export').mockResolvedValue(new Blob());

    await component.exportPdf(true);

    expect(snackBarOpen).toHaveBeenCalledWith('PDF успешно выгружен', 'Закрыть', {
      duration: 3000,
    });
  });

  it('should show error snackbar on PDF export failure', async () => {
    const mockCourse: CourseWithLessons = {
      id: 'c1',
      title: 'Test',
      authorId: 'local-user',
      description: '',
      lessons: [],
      lessonIds: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    };

    const { component, snackBarOpen } = createComponent(
      { mode: 'edit', courseId: 'c1' },
      {
        editingCourse: signal(mockCourse),
        startEdit: async () => undefined,
      },
    );

    const pdfExportService = TestBed.inject(CoursePdfExportService);
    vi.spyOn(pdfExportService, 'export').mockRejectedValue(new Error('Export failed'));

    await component.exportPdf(false);

    expect(snackBarOpen).toHaveBeenCalledWith('Ошибка при выгрузке PDF', 'Закрыть', {
      duration: 5000,
    });
  });

  // ── close ──

  it('should close dialog with undefined', () => {
    const { component, closeSpy } = createComponent({ mode: 'create', courseId: '' });
    component.close();
    expect(closeSpy).toHaveBeenCalledWith(undefined);
  });

  // ── Edit mode title ──

  it('should set edit mode title when not read-only', async () => {
    const mockCourse: CourseWithLessons = {
      id: 'c1',
      title: 'Test Course',
      authorId: 'local-user',
      description: '',
      lessons: [],
      lessonIds: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    };

    const { component } = createComponent(
      { mode: 'edit', courseId: 'c1' },
      {
        isReadOnly: signal(false),
        editingCourse: signal(mockCourse),
        startEdit: async () => undefined,
      },
    );

    expect(component.title()).toBe('Редактирование курса');
  });

  it('should set read-only mode title when user is not author', async () => {
    const mockCourse: CourseWithLessons = {
      id: 'c1',
      title: 'Test Course',
      authorId: 'other-user',
      description: '',
      lessons: [],
      lessonIds: [],
      published: false,
      languagePair: { known: 'ru', learning: 'en' },
      updatedAt: '',
    };

    const { component } = createComponent(
      { mode: 'edit', courseId: 'c1' },
      {
        isReadOnly: signal(true),
        editingCourse: signal(mockCourse),
        startEdit: async () => undefined,
      },
    );

    expect(component.title()).toBe('Просмотр курса');
  });
});
