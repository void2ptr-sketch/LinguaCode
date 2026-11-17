import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Subject } from 'rxjs';
import { CardEditorDialogComponent } from './card-editor-dialog.component';
import { CardEditorStore } from '../../services/card-editor.store';
import { UserStore } from '../../../../entities/user/model/user.store';
import { CardsCatalogMockHandler } from '../../../../entities/card/api/mock/cards-catalog.mock.handler';
import { seedTestContentCache } from '../../../../entities/content-seed/content-seed.test-utils';
import { provideHttpClient } from '@angular/common/http';
import { CatalogService } from '../../../../entities/card/api/catalog.service';
import type { CardEditorDialogData } from './card-editor-dialog.types';
import type { CardDraft } from '../../types';
import { EDITOR_UX_MODE_STORAGE_KEY } from '../../utils/ux/card-editor-ux.utils';

describe('CardEditorDialogComponent', () => {
  let component: CardEditorDialogComponent;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockMatDialog: { open: ReturnType<typeof vi.fn> };
  let afterClosedSubject: Subject<boolean | undefined>;

  const createMockDialogRef = () => ({
    close: vi.fn(),
  });

  const createMockMatDialog = () => {
    afterClosedSubject = new Subject<boolean | undefined>();
    return {
      open: vi.fn().mockReturnValue({
        afterClosed: () => afterClosedSubject.asObservable(),
      }),
    };
  };

  const createCreateData = (): CardEditorDialogData => ({
    mode: 'create',
    kind: 'select',
  });

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    seedTestContentCache();

    mockDialogRef = createMockDialogRef();
    mockMatDialog = createMockMatDialog();

    await TestBed.configureTestingModule({
      imports: [CardEditorDialogComponent],
      providers: [
        CardEditorStore,
        UserStore,
        CardsCatalogMockHandler,
        provideHttpClient(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: MAT_DIALOG_DATA, useValue: createCreateData() },
        {
          provide: CatalogService,
          useValue: {
            loaded: vi.fn(() => true),
            ensureLoaded: vi.fn(() => Promise.resolve()),
            cardKinds: vi.fn(() => [
              { code: 'select', label: 'Выбор' },
              { code: 'memory', label: 'Запоминание' },
            ]),
            difficulties: vi.fn(() => []),
            contentLanguageCodes: vi.fn(() => ['ru', 'en', 'zh']),
            isValid: vi.fn(() => true),
            isContentLanguage: vi.fn(() => true),
          },
        },
      ],
    }).compileComponents();

    component = TestBed.createComponent(CardEditorDialogComponent).componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    afterClosedSubject?.complete();
  });

  // ── Basic tests ──

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should inject CardEditorStore', () => {
    expect(component.store).toBeInstanceOf(CardEditorStore);
  });

  it('should inject MAT_DIALOG_DATA', () => {
    expect(component.data).toBeDefined();
  });

  it('should expose kindLabels', () => {
    expect(component.kindLabels).toBeDefined();
  });

  it('should expose languages', () => {
    expect(component.languages).toBeDefined();
    expect(Array.isArray(component.languages())).toBe(true);
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

  // ── ngOnInit ──

  describe('ngOnInit', () => {
    it('should ensure catalog is loaded for the publishing tab', async () => {
      const catalog = TestBed.inject(CatalogService);

      await component.ngOnInit();

      expect(catalog.ensureLoaded).toHaveBeenCalled();
    });

    it('should default the difficulty of a new card to beginner', async () => {
      await component.ngOnInit();

      expect(component.cardMeta()?.difficulty).toBe('beginner');
    });
  });

  // ── setEditorUxMode ──

  describe('setEditorUxMode', () => {
    it('should update editorUxMode signal', () => {
      component.setEditorUxMode('advanced');
      expect(component.editorUxMode()).toBe('advanced');
    });

    it('should support basic mode', () => {
      component.setEditorUxMode('basic');
      expect(component.editorUxMode()).toBe('basic');
    });

    it('should persist the selected mode', () => {
      component.setEditorUxMode('advanced');
      expect(sessionStorage.getItem(EDITOR_UX_MODE_STORAGE_KEY)).toBe('advanced');

      component.setEditorUxMode('basic');
      expect(sessionStorage.getItem(EDITOR_UX_MODE_STORAGE_KEY)).toBe('basic');
    });
  });

  describe('onAdvancedModeToggle', () => {
    it('should switch to advanced mode when checked', () => {
      component.onAdvancedModeToggle(true);
      expect(component.editorUxMode()).toBe('advanced');
      expect(sessionStorage.getItem(EDITOR_UX_MODE_STORAGE_KEY)).toBe('advanced');
    });

    it('should switch to basic mode when unchecked', () => {
      component.onAdvancedModeToggle(false);
      expect(component.editorUxMode()).toBe('basic');
      expect(sessionStorage.getItem(EDITOR_UX_MODE_STORAGE_KEY)).toBe('basic');
    });
  });

  // ── expandToFullEditor ──

  describe('expandToFullEditor', () => {
    it('should be a no-op', () => {
      expect(() => component.expandToFullEditor()).not.toThrow();
    });
  });

  // ── updateDraft ──

  describe('updateDraft', () => {
    it('should update the draft signal', () => {
      const initialDraft = component.draft();
      const newDraft = { ...initialDraft, title: 'New Title' } as CardDraft;
      component.updateDraft(newDraft);
      expect(component.draft().title).toBe('New Title');
    });
  });

  // ── updateIndexMeta ──

  describe('updateIndexMeta', () => {
    it('should update the indexMeta signal', () => {
      component.updateIndexMeta({ knownLanguage: 'en', learningLanguage: 'zh' });
      expect(component.indexMeta().knownLanguage).toBe('en');
      expect(component.indexMeta().learningLanguage).toBe('zh');
    });
  });

  // ── onKnownLanguageChange ──

  describe('onKnownLanguageChange', () => {
    it('should update indexMeta and cardMeta with new known language', () => {
      component.onKnownLanguageChange('en');
      expect(component.indexMeta().knownLanguage).toBe('en');
      expect(component.cardMeta()?.knownLanguage).toBe('en');
    });

    it('should preserve existing cardMeta fields', () => {
      component.cardMeta.set({ knownLanguage: 'ru', tags: ['test'] });
      component.onKnownLanguageChange('en');
      expect(component.cardMeta()?.knownLanguage).toBe('en');
      expect(component.cardMeta()?.tags).toEqual(['test']);
    });
  });

  // ── onLearningLanguageChange ──

  describe('onLearningLanguageChange', () => {
    it('should update indexMeta and cardMeta with new learning language', () => {
      component.onLearningLanguageChange('zh');
      expect(component.indexMeta().learningLanguage).toBe('zh');
      expect(component.cardMeta()?.learningLanguage).toBe('zh');
    });

    it('should preserve existing cardMeta fields', () => {
      component.cardMeta.set({ learningLanguage: 'en', tags: ['hsk1'] });
      component.onLearningLanguageChange('zh');
      expect(component.cardMeta()?.learningLanguage).toBe('zh');
      expect(component.cardMeta()?.tags).toEqual(['hsk1']);
    });
  });

  // ── title computed ──

  describe('title computed', () => {
    it('should return create title with kind label', () => {
      const title = component.title();
      expect(typeof title).toBe('string');
      expect(title).toContain('Новая карточка');
    });

    it('should include card kind label in title', () => {
      const title = component.title();
      expect(title).toContain('Выбор');
    });
  });

  // ── showWizard computed ──

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

  // ── dirty computed ──

  describe('dirty computed', () => {
    it('should be a boolean', () => {
      const isDirty = component.dirty();
      expect(typeof isDirty).toBe('boolean');
    });
  });

  // ── Default appearance ──

  describe('defaultAppearance', () => {
    it('should return theme and fontSize from user preferences', () => {
      const appearance = component.defaultAppearance();
      expect(appearance).toBeDefined();
      expect(appearance.theme).toBeDefined();
      expect(appearance.fontSize).toBeDefined();
    });
  });

  // ── Language labels ──

  describe('languageLabels', () => {
    it('should be defined', () => {
      expect(component.languageLabels).toBeDefined();
    });
  });

  // ── Header summary ──

  describe('languagePairSummary', () => {
    it('should show known → learning', () => {
      component.updateIndexMeta({ knownLanguage: 'ru', learningLanguage: 'en' });
      expect(component.languagePairSummary()).toContain('→');
    });
  });

  describe('tierLabel', () => {
    it('should return an empty label without card meta', () => {
      expect(component.tierLabel()).toBe('');
    });

    it('should map the required tier to a label', () => {
      component.cardMeta.set({ requiredTier: 'PREMIUM' });
      expect(component.tierLabel()).toBe('Премиум');
    });
  });

  describe('publicationLabel', () => {
    it('should return an empty label when publication is unknown', () => {
      expect(component.publicationLabel()).toBe('');
    });

    it('should return "Опубликована" for published cards', () => {
      component.cardMeta.set({ published: true });
      expect(component.publicationLabel()).toBe('Опубликована');
    });

    it('should return "Черновик" for unpublished cards', () => {
      component.cardMeta.set({ published: false });
      expect(component.publicationLabel()).toBe('Черновик');
    });
  });
});
