import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideHttpClient } from '@angular/common/http';
import { describe, expect, it, vi } from 'vitest';

import { ProgramBuilderDialogComponent } from './program-builder-dialog.component';
import { ProgramBuilderStore } from '../../services/program-builder.store';
import type { Program } from '../../../../entities/program/model/program.types';
import type { ProgramBuilderDialogData } from './program-builder-dialog.types';
import { CourseSearchService } from '../../../../entities/course';
import { LanguagePairsApiService } from '../../../../entities/language-pair/api';

function createComponent(
  data: ProgramBuilderDialogData,
  mockStore?: Partial<ProgramBuilderStore>,
): {
  fixture: ComponentFixture<ProgramBuilderDialogComponent>;
  component: ProgramBuilderDialogComponent;
  store: ProgramBuilderStore;
  closeSpy: ReturnType<typeof vi.fn>;
} {
  const closeSpy = vi.fn();

  TestBed.resetTestingModule();

  TestBed.configureTestingModule({
    imports: [
      ProgramBuilderDialogComponent,
      MatButtonModule,
      MatDialogModule,
      MatProgressSpinnerModule,
    ],
    providers: [
      ProgramBuilderStore,
      { provide: MatDialogRef, useValue: { close: closeSpy } },
      { provide: MAT_DIALOG_DATA, useValue: data },
      provideHttpClient(),
      {
        provide: CourseSearchService,
        useValue: {
          search: vi
            .fn()
            .mockResolvedValue({ items: [], totalItems: 0, page: 0, pageSize: 100, totalPages: 0 }),
        },
      },
      {
        provide: LanguagePairsApiService,
        useValue: { listAll: vi.fn().mockResolvedValue([]) },
      },
    ],
  });

  if (mockStore) {
    const store = TestBed.inject(ProgramBuilderStore);
    Object.entries(mockStore).forEach(([key, value]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (store as any)[key] = value;
    });
  }

  const fixture = TestBed.createComponent(ProgramBuilderDialogComponent);
  const component = fixture.componentInstance;
  const store = TestBed.inject(ProgramBuilderStore);
  fixture.detectChanges();

  return { fixture, component, store, closeSpy };
}

const mockProgram: Program = {
  id: 'p1',
  courseId: 'c1',
  title: 'Test Program',
  description: '',
  lessonIds: [],
  order: 0,
  updatedAt: '',
};

describe('ProgramBuilderDialogComponent', () => {
  it('should create', () => {
    const { component } = createComponent({ mode: 'create' });
    expect(component).toBeDefined();
  });

  it('should have ProgramBuilderStore injected', () => {
    const { component } = createComponent({ mode: 'create' });
    expect(component.store).toBeDefined();
  });

  it('should have draft signal with empty title in create mode', () => {
    const { component } = createComponent({ mode: 'create', courseId: 'c1' });
    expect(component.draft()).toBeDefined();
    expect(component.draft().title).toBe('');
  });

  it('should initialize draft courseId from dialog data', async () => {
    const { component, fixture } = createComponent({ mode: 'create', courseId: 'c1' });
    await fixture.whenStable();
    expect(component.draft().courseId).toBe('c1');
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
    expect(component.title()).toBe('Новая программа');
  });

  it('should have title computed for edit mode', () => {
    const { component, closeSpy } = createComponent(
      { mode: 'edit', programId: 'p1' },
      {
        startEdit: async () => undefined,
        editingProgram: signal(mockProgram),
        editingProgramAuthorId: signal('local-user'),
        isReadOnly: signal(false),
      },
    );
    expect(component.title()).toBe('Редактирование программы');
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('should have read-only title in edit mode', () => {
    const { component } = createComponent(
      { mode: 'edit', programId: 'p1' },
      {
        startEdit: async () => undefined,
        editingProgram: signal(mockProgram),
        isReadOnly: signal(true),
      },
    );
    expect(component.title()).toBe('Просмотр программы');
  });

  it('should close without result when the program fails to load', async () => {
    const { component, closeSpy, fixture } = createComponent(
      { mode: 'edit', programId: 'p1' },
      {
        startEdit: async () => undefined,
        editingProgram: signal(null),
      },
    );
    await fixture.whenStable();
    expect(closeSpy).toHaveBeenCalledWith(undefined);
    expect(component.title()).toBe('Редактирование программы');
  });

  // ── saveProgram ──

  it('should close dialog with saved:true on successful create', async () => {
    const { component, closeSpy } = createComponent(
      { mode: 'create', courseId: 'c1' },
      {
        createProgram: async () => true,
      },
    );
    await component.saveProgram();
    expect(closeSpy).toHaveBeenCalledWith({ saved: true });
  });

  it('should not close dialog when create fails', async () => {
    const { component, closeSpy } = createComponent(
      { mode: 'create', courseId: 'c1' },
      {
        createProgram: async () => false,
      },
    );
    await component.saveProgram();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('should close dialog with saved:true on successful update', async () => {
    const { component, closeSpy } = createComponent(
      { mode: 'edit', programId: 'p1' },
      {
        startEdit: async () => undefined,
        editingProgram: signal(mockProgram),
        isReadOnly: signal(false),
        updateProgram: async () => true,
      },
    );
    await component.saveProgram();
    expect(closeSpy).toHaveBeenCalledWith({ saved: true });
  });

  it('should not close dialog when update fails', async () => {
    const { component, closeSpy } = createComponent(
      { mode: 'edit', programId: 'p1' },
      {
        startEdit: async () => undefined,
        editingProgram: signal(mockProgram),
        isReadOnly: signal(false),
        updateProgram: async () => false,
      },
    );
    await component.saveProgram();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  // ── cancel ──

  it('should close dialog with saved:false when not dirty', async () => {
    const { component, closeSpy, fixture } = createComponent({ mode: 'create' });
    await fixture.whenStable();
    component.cancel();
    await fixture.whenStable();
    expect(closeSpy).toHaveBeenCalledWith({ saved: false });
  });
});
