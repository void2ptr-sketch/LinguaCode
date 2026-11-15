import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ScenarioBuilderDialogComponent } from './scenario-builder-dialog.component';
import { ScenarioBuilderStore } from '../../services/scenario-builder.store';
import { UserStore } from '../../../../entities/user/model/user.store';
import { CardCatalogSearchStore } from '../../../../entities/card/lib/store/card-catalog-search.store';
import { seedTestContentCache } from '../../../../entities/content-seed/content-seed.test-utils';
import type { Scenario } from '../../../../entities/scenario/model';
import { CourseSearchService } from '../../../../entities/course/search/course-search.service';
import { ProgramsApiService } from '../../../../entities/program/api';
import { LanguagePairsApiService } from '../../../../entities/language-pair/api';
import { AppLoggerService } from '../../../../shared/logger/app-logger.service';

/** Mock for ScenarioEditorFormComponent to avoid deep dependency chain. */
@Component({
  selector: 'app-scenario-editor-form',
  template: '',
  standalone: true,
})
class MockScenarioEditorFormComponent {
  draft = { sourceMode: 'fixed' as const, title: '' };
}

describe('ScenarioBuilderDialogComponent', () => {
  let component: ScenarioBuilderDialogComponent;
  let store: ScenarioBuilderStore;

  const mockDialogRef = {
    close: vi.fn(),
  };

  const mockAfterClosed = {
    subscribe: function (cb: (value: boolean) => void) {
      cb(false);
      return { unsubscribe: vi.fn() };
    },
  };

  const mockMatDialog = {
    open: vi.fn().mockReturnValue(mockAfterClosed),
  };

  const createDialogData = { mode: 'create' as const };

  beforeEach(async () => {
    localStorage.clear();
    seedTestContentCache();

    await TestBed.configureTestingModule({
      imports: [ScenarioBuilderDialogComponent, MockScenarioEditorFormComponent],
      providers: [
        ScenarioBuilderStore,
        UserStore,
        CardCatalogSearchStore,
        provideHttpClient(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: MAT_DIALOG_DATA, useValue: createDialogData },
        {
          provide: CourseSearchService,
          useValue: { search: vi.fn().mockResolvedValue({ items: [], totalItems: 0, page: 0, pageSize: 100, totalPages: 0 }) },
        },
        {
          provide: ProgramsApiService,
          useValue: { getByCourse: vi.fn().mockResolvedValue([]), getLessons: vi.fn().mockResolvedValue([]) },
        },
        {
          provide: AppLoggerService,
          useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
        },
        {
          provide: LanguagePairsApiService,
          useValue: { listAll: vi.fn().mockResolvedValue([]) },
        },
      ],
    }).compileComponents();

    store = TestBed.inject(ScenarioBuilderStore);
    const ref = TestBed.createComponent(ScenarioBuilderDialogComponent);
    component = ref.componentInstance;

    // Wait for async ngOnInit to complete
    await ref.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should inject ScenarioBuilderStore', () => {
    expect(component.store).toBe(store);
  });

  it('should inject MAT_DIALOG_DATA', () => {
    expect(component.data).toBe(createDialogData);
  });

  describe('signals', () => {
    it('should have draft signal', () => {
      expect(component.draft).toBeDefined();
    });

    it('should have dirty computed', () => {
      expect(component.dirty).toBeDefined();
    });

    it('should have title computed', () => {
      expect(component.title).toBeDefined();
    });
  });

  describe('updateDraft', () => {
    it('should update the draft signal', () => {
      const initialDraft = component.draft();
      component.updateDraft({ ...initialDraft, title: 'New Title' });
      expect(component.draft().title).toBe('New Title');
    });

    it('should reload programs when the course changes', async () => {
      const programsApi = TestBed.inject(ProgramsApiService);
      const initialDraft = component.draft();

      component.updateDraft({ ...initialDraft, courseId: 'course-2' });
      await Promise.resolve();

      expect(programsApi.getByCourse).toHaveBeenCalledWith('course-2');
    });

    it('should clear programs when the course is reset', () => {
      const initialDraft = component.draft();

      component.updateDraft({ ...initialDraft, courseId: 'course-2' });
      component.updateDraft({ ...component.draft(), courseId: undefined });

      expect(component.programs()).toEqual([]);
      expect(component.lessons()).toEqual([]);
    });

    it('should reload lessons when the program changes', async () => {
      const programsApi = TestBed.inject(ProgramsApiService);
      const initialDraft = component.draft();

      component.updateDraft({ ...initialDraft, programId: 'program-2' });
      await Promise.resolve();

      expect(programsApi.getLessons).toHaveBeenCalledWith('program-2');
    });
  });

  describe('dirty computed', () => {
    it('should be a boolean', () => {
      const isDirty = component.dirty();
      expect(typeof isDirty).toBe('boolean');
    });
  });

  describe('title computed', () => {
    it('should return create title in create mode', () => {
      const title = component.title();
      expect(title).toBe('Новый сценарий');
    });
  });

  describe('create mode with context', () => {
    const mockScenarioBuilderStore = {
      startCreate: vi.fn(),
      loadCourses: vi.fn().mockResolvedValue(undefined),
      createDraft: vi.fn().mockImplementation((context) => Promise.resolve({
        title: '',
        description: '',
        published: false,
        languagePairId: context?.languagePairId,
        courseId: context?.courseId,
        programId: context?.programId,
        lessonId: context?.lessonId,
        requiredTier: 'FREE',
        scenarioOrder: 1,
        sourceMode: 'fixed',
        fixedCardIds: [],
        criteria: { knownLanguage: 'en', learningLanguage: 'zh' },
        criteriaLimit: 10,
        criteriaSort: 'updatedAt',
        criteriaSeed: '',
        snapshotFrozenAt: null,
      })),
      isReadOnly: vi.fn().mockReturnValue(false),
      editorLoading: vi.fn().mockReturnValue(false),
      error: vi.fn().mockReturnValue(null),
      courses: vi.fn().mockReturnValue([]),
    };

    beforeEach(async () => {
      localStorage.clear();
      seedTestContentCache();
      mockDialogRef.close.mockClear();

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ScenarioBuilderDialogComponent, MockScenarioEditorFormComponent],
        providers: [
          { provide: ScenarioBuilderStore, useValue: mockScenarioBuilderStore },
          {
            provide: UserStore,
            useValue: { languagePair: () => ({ known: 'ru', learning: 'en' }) },
          },
          CardCatalogSearchStore,
          provideHttpClient(),
          {
            provide: CourseSearchService,
            useValue: { search: vi.fn().mockResolvedValue({ items: [], totalItems: 0, page: 0, pageSize: 100, totalPages: 0 }) },
          },
          {
            provide: ProgramsApiService,
            useValue: { getByCourse: vi.fn().mockResolvedValue([]), getLessons: vi.fn().mockResolvedValue([]) },
          },
          {
            provide: AppLoggerService,
            useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
          },
          {
            provide: LanguagePairsApiService,
            useValue: { listAll: vi.fn().mockResolvedValue([]) },
          },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatDialog, useValue: mockMatDialog },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'create' as const, courseId: 'course-1', programId: 'program-1', lessonId: 'lesson-1', languagePairId: 1 } },
        ],
      });

      // Manually trigger ngOnInit by creating and detecting changes
      store = TestBed.inject(ScenarioBuilderStore);
      const ref = TestBed.createComponent(ScenarioBuilderDialogComponent);
      component = ref.componentInstance;
      ref.detectChanges();

      // Wait for all async operations
      await new Promise((r) => setTimeout(r, 50));
    });

    it('should pre-fill draft with context values', async () => {
      // Debug: verify component state
      expect(component.data.mode).toBe('create');
      expect((component.data as { mode: 'create'; courseId?: string }).courseId).toBe('course-1');
      expect(store).toBe(mockScenarioBuilderStore);
      expect(component.store).toBe(store);
      // Verify startCreate was called (proves ngOnInit ran the create flow)
      const startCreateSpy = vi.mocked(store.startCreate);
      expect(startCreateSpy).toHaveBeenCalled();
      // Verify createDraft was called with correct context
      const createDraftSpy = vi.mocked(store.createDraft);
      expect(createDraftSpy).toHaveBeenCalled();
      const callArgs = createDraftSpy.mock.calls[0]?.[0];
      expect(callArgs?.courseId).toBe('course-1');
      expect(callArgs?.programId).toBe('program-1');
      expect(callArgs?.lessonId).toBe('lesson-1');
      // Verify draft was set
      expect(component.draft().courseId).toBe('course-1');
      expect(component.draft().programId).toBe('program-1');
      expect(component.draft().lessonId).toBe('lesson-1');
    });
  });

  describe('create mode without context', () => {
    const emptyContextData = { mode: 'create' as const };

    const mockScenarioBuilderStoreNoContext = {
      startCreate: vi.fn(),
      loadCourses: vi.fn().mockResolvedValue(undefined),
      createDraft: vi.fn().mockResolvedValue({
        title: '',
        description: '',
        published: false,
        languagePairId: 1,
        requiredTier: 'FREE',
        scenarioOrder: 1,
        sourceMode: 'fixed',
        fixedCardIds: [],
        criteria: { knownLanguage: 'ru', learningLanguage: 'en' },
        criteriaLimit: 10,
        criteriaSort: 'updatedAt',
        criteriaSeed: '',
        snapshotFrozenAt: null,
      }),
      isReadOnly: vi.fn().mockReturnValue(false),
      editorLoading: vi.fn().mockReturnValue(false),
      error: vi.fn().mockReturnValue(null),
    };

    beforeEach(async () => {
      localStorage.clear();
      seedTestContentCache();
      mockDialogRef.close.mockClear();

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ScenarioBuilderDialogComponent, MockScenarioEditorFormComponent],
        providers: [
          { provide: ScenarioBuilderStore, useValue: mockScenarioBuilderStoreNoContext },
          {
            provide: UserStore,
            useValue: { languagePair: () => ({ known: 'ru', learning: 'en' }) },
          },
          CardCatalogSearchStore,
          provideHttpClient(),
          {
            provide: CourseSearchService,
            useValue: { search: vi.fn().mockResolvedValue({ items: [], totalItems: 0, page: 0, pageSize: 100, totalPages: 0 }) },
          },
          {
            provide: ProgramsApiService,
            useValue: { getByCourse: vi.fn().mockResolvedValue([]), getLessons: vi.fn().mockResolvedValue([]) },
          },
          {
            provide: AppLoggerService,
            useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
          },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatDialog, useValue: mockMatDialog },
          { provide: MAT_DIALOG_DATA, useValue: emptyContextData },
        ],
      }).compileComponents();

      const ref = TestBed.createComponent(ScenarioBuilderDialogComponent);
      component = ref.componentInstance;
      await ref.whenStable();
    });

    it('should fall back to userStore language pair when no context', () => {
      expect(component.draft().languagePairId).toBeUndefined();
      expect(component.draft().courseId).toBeUndefined();
      expect(component.draft().programId).toBeUndefined();
    });
  });

  describe('saveScenario', () => {
    it('should be defined', () => {
      expect(component.saveScenario).toBeDefined();
    });

    it('should close with { saved: true, scenarioId } after a successful create', async () => {
      mockDialogRef.close.mockClear();
      const created = { id: 's-new' } as Scenario;
      const createSpy = vi.spyOn(store, 'createScenario').mockResolvedValue(created);

      await component.saveScenario();

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).toHaveBeenCalledWith({ saved: true, scenarioId: 's-new' });
    });

    it('should keep the dialog open when the create fails (store returns null)', async () => {
      mockDialogRef.close.mockClear();
      vi.spyOn(store, 'createScenario').mockResolvedValue(null);

      await component.saveScenario();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('saveScenario in edit mode', () => {
    const editData = { mode: 'edit' as const, scenarioId: 's-edit' };
    const editScenario = {
      id: 's-edit',
      title: 'Existing scenario',
      description: '',
      published: false,
      cardSource: { mode: 'fixed' as const, cardIds: ['c1'] },
      languagePairId: 1,
    } as unknown as Scenario;

    const mockEditStore = {
      editorLoading: () => false,
      error: () => null,
      isReadOnly: () => false,
      loadCourses: vi.fn().mockResolvedValue(undefined),
      courses: vi.fn().mockReturnValue([]),
      startEdit: vi.fn().mockResolvedValue(undefined),
      editingScenario: () => editScenario,
      updateScenario: vi.fn().mockResolvedValue(true),
      cancelEdit: vi.fn(),
    };

    beforeEach(async () => {
      localStorage.clear();
      seedTestContentCache();
      mockDialogRef.close.mockClear();
      mockEditStore.loadCourses.mockClear();
      mockEditStore.startEdit.mockClear().mockResolvedValue(undefined);
      mockEditStore.updateScenario.mockClear().mockResolvedValue(true);
      mockEditStore.cancelEdit.mockClear();

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ScenarioBuilderDialogComponent, MockScenarioEditorFormComponent],
        providers: [
          provideHttpClient(),
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatDialog, useValue: mockMatDialog },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: ScenarioBuilderStore, useValue: mockEditStore },
          {
            provide: UserStore,
            useValue: { languagePair: () => ({ known: 'ru', learning: 'en' }) },
          },
          {
            provide: ProgramsApiService,
            useValue: {
              getByCourse: vi.fn().mockResolvedValue([]),
              getLessons: vi.fn().mockResolvedValue([]),
            },
          },
          {
            provide: LanguagePairsApiService,
            useValue: { listAll: vi.fn().mockResolvedValue([]) },
          },
        ],
      }).compileComponents();

      const ref = TestBed.createComponent(ScenarioBuilderDialogComponent);
      component = ref.componentInstance;
      ref.detectChanges();
      await ref.whenStable();
    });

    it('should load courses in edit mode so the course binding select is populated', () => {
      expect(mockEditStore.loadCourses).toHaveBeenCalledTimes(1);
    });

    it('should close with { saved: true, scenarioId } of the edited scenario on successful save', async () => {
      await component.saveScenario();

      expect(mockEditStore.updateScenario).toHaveBeenCalledWith('s-edit', expect.anything());
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).toHaveBeenCalledWith({ saved: true, scenarioId: 's-edit' });
    });

    it('should keep the dialog open when the update fails', async () => {
      mockEditStore.updateScenario.mockResolvedValueOnce(false);

      await component.saveScenario();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should be defined', () => {
      expect(component.cancel).toBeDefined();
    });
  });
});
