import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideHttpClient } from '@angular/common/http';
import { describe, expect, it, vi } from 'vitest';

import { LessonBuilderDialogComponent } from './lesson-builder-dialog.component';
import { LessonBuilderStore } from '../../services/lesson-builder.store';
import type { Lesson } from '../../../../entities/course/model/lesson.types';
import type { LessonBuilderDialogData } from './lesson-builder-dialog.types';
import { CourseSearchService } from '../../../../entities/course';
import { LanguagePairsApiService } from '../../../../entities/language-pair/api';
import { ProgramsApiService } from '../../../../entities/program/api';

type ProgramsApiMock = {
  getById: ReturnType<typeof vi.fn>;
  getByCourse: ReturnType<typeof vi.fn>;
};

const defaultProgramsApi = (): ProgramsApiMock => ({
  getById: vi.fn().mockResolvedValue({
    id: 'p1',
    courseId: 'c1',
    title: 'P',
    description: '',
    lessonIds: [],
    order: 0,
    updatedAt: '',
    languagePairId: 1,
  }),
  getByCourse: vi.fn().mockResolvedValue([]),
});

function createComponent(
  data: LessonBuilderDialogData,
  mockStore?: Partial<LessonBuilderStore>,
  programsApiMock: ProgramsApiMock = defaultProgramsApi(),
): {
  fixture: ComponentFixture<LessonBuilderDialogComponent>;
  component: LessonBuilderDialogComponent;
  store: LessonBuilderStore;
  closeSpy: ReturnType<typeof vi.fn>;
} {
  const closeSpy = vi.fn();

  TestBed.resetTestingModule();

  TestBed.configureTestingModule({
    imports: [
      LessonBuilderDialogComponent,
      MatButtonModule,
      MatDialogModule,
      MatProgressSpinnerModule,
    ],
    providers: [
      LessonBuilderStore,
      { provide: MatDialogRef, useValue: { close: closeSpy } },
      { provide: MAT_DIALOG_DATA, useValue: data },
      provideHttpClient(),
      {
        provide: CourseSearchService,
        useValue: { search: vi.fn().mockResolvedValue({ items: [], totalItems: 0, page: 0, pageSize: 100, totalPages: 0 }) },
      },
      {
        provide: LanguagePairsApiService,
        useValue: { listAll: vi.fn().mockResolvedValue([]) },
      },
      {
        provide: ProgramsApiService,
        useValue: programsApiMock,
      },
    ],
  });

  if (mockStore) {
    const store = TestBed.inject(LessonBuilderStore);
    Object.entries(mockStore).forEach(([key, value]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (store as any)[key] = value;
    });
  }

  const fixture = TestBed.createComponent(LessonBuilderDialogComponent);
  const component = fixture.componentInstance;
  const store = TestBed.inject(LessonBuilderStore);
  fixture.detectChanges();

  return { fixture, component, store, closeSpy };
}

const mockLesson: Lesson = {
  id: 'l1',
  programId: 'p1',
  title: 'Test Lesson',
  description: '',
  scenarioIds: [],
  prerequisiteLessonIds: [],
  order: 0,
  updatedAt: '',
  published: true,
  requiredTier: 'FREE',
};

describe('LessonBuilderDialogComponent', () => {
  it('should create', () => {
    const { component } = createComponent({ mode: 'create' });
    expect(component).toBeDefined();
  });

  it('should have LessonBuilderStore injected', () => {
    const { component } = createComponent({ mode: 'create' });
    expect(component.store).toBeDefined();
  });

  it('should have draft signal with empty title in create mode', () => {
    const { component } = createComponent({ mode: 'create', programId: 'p1' });
    expect(component.draft()).toBeDefined();
    expect(component.draft().title).toBe('');
  });

  it('should initialize draft programId from dialog data', async () => {
    const { component, fixture } = createComponent({ mode: 'create', programId: 'p1' });
    await fixture.whenStable();
    expect(component.draft().programId).toBe('p1');
  });

  it('should have dirty computed', async () => {
    const { component, fixture } = createComponent({ mode: 'create' });
    await fixture.whenStable();
    expect(component.dirty()).toBe(false);
  });

  it('should detect dirty state after draft change', () => {
    const { component } = createComponent({ mode: 'create' });
    component.updateDraft({ ...component.draft(), title: 'Changed' });
    expect(component.dirty()).toBe(true);
  });

  it('should have title computed for create mode', () => {
    const { component } = createComponent({ mode: 'create' });
    expect(component.title()).toBe('Новый урок');
  });

  it('should have title computed for edit mode', () => {
    const { component, closeSpy } = createComponent(
      { mode: 'edit', lessonId: 'l1' },
      {
        startEdit: async () => undefined,
        editingLesson: signal(mockLesson),
        editingLessonAuthorId: signal('local-user'),
        isReadOnly: signal(false),
      },
    );
    expect(component.title()).toBe('Редактирование урока');
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('should have read-only title in edit mode', () => {
    const { component } = createComponent(
      { mode: 'edit', lessonId: 'l1' },
      {
        startEdit: async () => undefined,
        editingLesson: signal(mockLesson),
        isReadOnly: signal(true),
      },
    );
    expect(component.title()).toBe('Просмотр урока');
  });

  it('should close without result when the lesson fails to load', async () => {
    const { component, closeSpy, fixture } = createComponent(
      { mode: 'edit', lessonId: 'l1' },
      {
        startEdit: async () => undefined,
        editingLesson: signal(null),
      },
    );
    await fixture.whenStable();
    expect(closeSpy).toHaveBeenCalledWith(undefined);
    expect(component.title()).toBe('Редактирование урока');
  });

  // ── auto-increment order in create mode ──

  it('should compute next lesson order from existing lessons', async () => {
    const lessonsWithOrders = [
      { ...mockLesson, id: 'l1', order: 1 },
      { ...mockLesson, id: 'l2', order: 3 },
      { ...mockLesson, id: 'l3', order: 7 },
    ];
    const { component } = createComponent(
      { mode: 'create', programId: 'p1' },
      {
        startCreate: () => undefined,
        loadCandidateLessons: async () => {
          const store = TestBed.inject(LessonBuilderStore);
          store.candidateLessons.set(lessonsWithOrders);
        },
      },
    );
    await Promise.resolve();
    // Wait for the then() callback to flush
    await new Promise((r) => setTimeout(r, 0));
    // Max order is 7, so next should be 8
    expect(component.draft().order).toBe(8);
  });

  it('should default to order 1 when no existing lessons', async () => {
    const { component } = createComponent(
      { mode: 'create', programId: 'p1' },
      {
        startCreate: () => undefined,
        loadCandidateLessons: async () => {
          const store = TestBed.inject(LessonBuilderStore);
          store.candidateLessons.set([]);
        },
      },
    );
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
    expect(component.draft().order).toBe(1);
  });

  // ── saveLesson ──

  it('should close dialog with saved:true on successful create', async () => {
    const { component, closeSpy } = createComponent(
      { mode: 'create', programId: 'p1' },
      {
        createLesson: async () => true,
      },
    );
    await component.saveLesson();
    expect(closeSpy).toHaveBeenCalledWith({ saved: true });
  });

  it('should not close dialog when create fails', async () => {
    const { component, closeSpy } = createComponent(
      { mode: 'create', programId: 'p1' },
      {
        createLesson: async () => false,
      },
    );
    await component.saveLesson();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('should close dialog with saved:true on successful update', async () => {
    const { component, closeSpy } = createComponent(
      { mode: 'edit', lessonId: 'l1' },
      {
        startEdit: async () => undefined,
        editingLesson: signal(mockLesson),
        isReadOnly: signal(false),
        updateLesson: async () => true,
      },
    );
    await component.saveLesson();
    expect(closeSpy).toHaveBeenCalledWith({ saved: true });
  });

  it('should not close dialog when update fails', async () => {
    const { component, closeSpy } = createComponent(
      { mode: 'edit', lessonId: 'l1' },
      {
        startEdit: async () => undefined,
        editingLesson: signal(mockLesson),
        isReadOnly: signal(false),
        updateLesson: async () => false,
      },
    );
    await component.saveLesson();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  // ── cancel ──

  it('should close dialog with saved:false when not dirty', async () => {
    const { component, closeSpy, fixture } = createComponent({ mode: 'create' });
    await fixture.whenStable();
    await component.cancel();
    expect(closeSpy).toHaveBeenCalledWith({ saved: false });
  });

  // ── program selector ──

  it('should load every program of the lesson course in edit mode', async () => {
    const programsApiMock: ProgramsApiMock = {
      getById: vi.fn().mockResolvedValue({
        id: 'p1',
        courseId: 'c1',
        title: 'Program 1',
        description: '',
        lessonIds: ['l1'],
        order: 0,
        updatedAt: '',
      }),
      getByCourse: vi.fn().mockResolvedValue([
        {
          id: 'p1',
          courseId: 'c1',
          title: 'Program 1',
          description: '',
          lessonIds: ['l1'],
          order: 0,
          updatedAt: '',
          lessons: [],
        },
        {
          id: 'p2',
          courseId: 'c1',
          title: 'Program 2',
          description: '',
          lessonIds: [],
          order: 1,
          updatedAt: '',
          lessons: [],
        },
      ]),
    };

    const { component, fixture } = createComponent(
      { mode: 'edit', lessonId: 'l1' },
      {
        startEdit: async () => undefined,
        editingLesson: signal(mockLesson),
        editingLessonAuthorId: signal('local-user'),
        isReadOnly: signal(false),
      },
      programsApiMock,
    );

    await fixture.whenStable();

    expect(programsApiMock.getByCourse).toHaveBeenCalledWith('c1');
    expect(component.programs().map((program) => program.id)).toEqual(['p1', 'p2']);
  });

  it('should keep the edited program when the course response omits it', async () => {
    const programsApiMock: ProgramsApiMock = {
      getById: vi.fn().mockResolvedValue({
        id: 'p1',
        courseId: 'c1',
        title: 'Program 1',
        description: '',
        lessonIds: ['l1'],
        order: 0,
        updatedAt: '',
      }),
      getByCourse: vi.fn().mockResolvedValue([
        {
          id: 'p2',
          courseId: 'c1',
          title: 'Program 2',
          description: '',
          lessonIds: [],
          order: 1,
          updatedAt: '',
          lessons: [],
        },
      ]),
    };

    const { component, fixture } = createComponent(
      { mode: 'edit', lessonId: 'l1' },
      {
        startEdit: async () => undefined,
        editingLesson: signal(mockLesson),
        isReadOnly: signal(false),
      },
      programsApiMock,
    );

    await fixture.whenStable();

    expect(component.programs().map((program) => program.id)).toEqual(['p1', 'p2']);
  });

  // ── published / requiredTier in edit mode ──

  it('should include published and requiredTier in draft when editing', async () => {
    const { component, fixture } = createComponent(
      { mode: 'edit', lessonId: 'l1' },
      {
        startEdit: async () => undefined,
        editingLesson: signal(mockLesson),
        editingLessonAuthorId: signal('local-user'),
        isReadOnly: signal(false),
      },
    );
    await fixture.whenStable();
    expect(component.draft().published).toBe(true);
    expect(component.draft().requiredTier).toBe('FREE');
  });

  it('should detect dirty state after published change', () => {
    const { component } = createComponent({ mode: 'create' });
    component.updateDraft({ ...component.draft(), published: true });
    expect(component.dirty()).toBe(true);
  });

  it('should detect dirty state after requiredTier change', () => {
    const { component } = createComponent({ mode: 'create' });
    component.updateDraft({ ...component.draft(), requiredTier: 'STARTER' });
    expect(component.dirty()).toBe(true);
  });
});
