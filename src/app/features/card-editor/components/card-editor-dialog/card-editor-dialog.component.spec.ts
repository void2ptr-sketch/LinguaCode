import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CardEditorDialogComponent } from './card-editor-dialog.component';
import { CardEditorStore } from '../../services/card-editor.store';
import { UserStore } from '../../../../core/state';
import { CardsCatalogMockHandler } from '../../../../core/api/cards/cards-catalog.mock.handler';
import { seedTestContentCache } from '../../../../core/repositories/content-seed/content-seed.test-utils';
import { provideHttpClient } from '@angular/common/http';
import type { CardEditorDialogData } from './card-editor-dialog.types';

describe('CardEditorDialogComponent', () => {
  let component: CardEditorDialogComponent;
  let store: CardEditorStore;

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

  const dialogData: CardEditorDialogData = { mode: 'create', kind: 'select' };

  beforeEach(async () => {
    localStorage.clear();
    seedTestContentCache();

    await TestBed.configureTestingModule({
      imports: [CardEditorDialogComponent],
      providers: [
        CardEditorStore,
        UserStore,
        CardsCatalogMockHandler,
        provideHttpClient(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    }).compileComponents();

    store = TestBed.inject(CardEditorStore);
    component = TestBed.createComponent(CardEditorDialogComponent).componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should inject CardEditorStore', () => {
    expect(component.store).toBeInstanceOf(CardEditorStore);
  });

  it('should inject MAT_DIALOG_DATA', () => {
    expect(component.data).toBe(dialogData);
  });

  it('should expose kindLabels', () => {
    expect(component.kindLabels).toBeDefined();
  });

  it('should expose languages', () => {
    expect(component.languages).toBeDefined();
    expect(Array.isArray(component.languages)).toBe(true);
  });

  it('should expose languageLabels', () => {
    expect(component.languageLabels).toBeDefined();
  });

  it('should have initial draft signal', () => {
    expect(component.draft).toBeDefined();
  });

  it('should have initial indexMeta signal', () => {
    expect(component.indexMeta).toBeDefined();
  });

  it('should have initial cardMeta signal as undefined', () => {
    expect(component.cardMeta()).toBeUndefined();
  });

  it('should have initial editorUxMode signal', () => {
    expect(component.editorUxMode).toBeDefined();
  });

  it('should have dirty computed', () => {
    expect(component.dirty).toBeDefined();
  });

  it('should have showWizard computed', () => {
    expect(component.showWizard).toBeDefined();
  });

  it('should have title computed', () => {
    expect(component.title).toBeDefined();
  });

  it('should have defaultAppearance computed', () => {
    expect(component.defaultAppearance).toBeDefined();
  });

  describe('setEditorUxMode', () => {
    it('should update editorUxMode signal', () => {
      component.setEditorUxMode('advanced');
      expect(component.editorUxMode()).toBe('advanced');
    });
  });

  describe('expandToFullEditor', () => {
    it('should be a no-op', () => {
      expect(() => component.expandToFullEditor()).not.toThrow();
    });
  });

  describe('updateDraft', () => {
    it('should update the draft signal', () => {
      const initialDraft = component.draft();
      component.updateDraft({ ...initialDraft, title: 'New Title' } as typeof initialDraft);
      expect(component.draft().title).toBe('New Title');
    });
  });

  describe('updateIndexMeta', () => {
    it('should update the indexMeta signal', () => {
      component.updateIndexMeta({ knownLanguage: 'en', learningLanguage: 'zh' });
      expect(component.indexMeta().knownLanguage).toBe('en');
      expect(component.indexMeta().learningLanguage).toBe('zh');
    });
  });

  describe('onKnownLanguageChange', () => {
    it('should update indexMeta and cardMeta with new known language', () => {
      component.onKnownLanguageChange('en');
      expect(component.indexMeta().knownLanguage).toBe('en');
      expect(component.cardMeta()?.knownLanguage).toBe('en');
    });
  });

  describe('onLearningLanguageChange', () => {
    it('should update indexMeta and cardMeta with new learning language', () => {
      component.onLearningLanguageChange('zh');
      expect(component.indexMeta().learningLanguage).toBe('zh');
      expect(component.cardMeta()?.learningLanguage).toBe('zh');
    });
  });

  describe('dirty computed', () => {
    it('should be a boolean', () => {
      const isDirty = component.dirty();
      expect(typeof isDirty).toBe('boolean');
    });
  });

  describe('title computed', () => {
    it('should return create title with kind label', () => {
      const title = component.title();
      expect(typeof title).toBe('string');
      expect(title).toContain('Новая карточка');
    });
  });

  describe('showWizard computed', () => {
    it('should be true in create mode with basic ux', () => {
      component.setEditorUxMode('basic');
      expect(component.showWizard()).toBe(true);
    });

    it('should be false in create mode with advanced ux', () => {
      component.setEditorUxMode('advanced');
      expect(component.showWizard()).toBe(false);
    });
  });
});
