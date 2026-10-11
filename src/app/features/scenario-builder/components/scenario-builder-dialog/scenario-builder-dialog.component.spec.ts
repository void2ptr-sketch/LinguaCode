import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ScenarioBuilderDialogComponent } from './scenario-builder-dialog.component';
import { ScenarioBuilderStore } from '../../services/scenario-builder.store';
import { UserStore } from '../../../../core/state';
import { CardCatalogSearchStore } from '../../../card-catalog-search';
import { seedTestContentCache } from '../../../../core/repositories/content-seed/content-seed.test-utils';

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
    subscribe: function(cb: (value: boolean) => void) {
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
  });

  describe('cancel', () => {
    it('should be defined', () => {
      expect(component.cancel).toBeDefined();
    });
  });
});
