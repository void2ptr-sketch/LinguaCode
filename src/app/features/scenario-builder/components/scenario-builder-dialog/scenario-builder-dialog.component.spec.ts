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
      cardSource: { mode: 'fixed' as const, fixedCardIds: ['c1'] },
      languagePair: { known: 'ru', learning: 'en' },
    } as unknown as Scenario;

    const mockEditStore = {
      editorLoading: () => false,
      error: () => null,
      isReadOnly: () => false,
      startEdit: vi.fn().mockResolvedValue(undefined),
      editingScenario: () => editScenario,
      updateScenario: vi.fn().mockResolvedValue(true),
      cancelEdit: vi.fn(),
    };

    beforeEach(async () => {
      localStorage.clear();
      seedTestContentCache();
      mockDialogRef.close.mockClear();
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
          { provide: UserStore, useValue: { languagePair: () => ({ known: 'ru', learning: 'en' }) } },
        ],
      }).compileComponents();

      const ref = TestBed.createComponent(ScenarioBuilderDialogComponent);
      component = ref.componentInstance;
      await ref.whenStable();
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
