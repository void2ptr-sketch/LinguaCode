import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect } from 'vitest';
import { ScenarioEditorFormComponent } from './scenario-editor-form.component';
import type { ScenarioFormDraft } from '../../utils/scenario-form-draft.utils';

describe('ScenarioEditorFormComponent', () => {
  let component: ScenarioEditorFormComponent;
  let fixture: ComponentFixture<ScenarioEditorFormComponent>;

  const baseDraft: ScenarioFormDraft = {
    title: 'Test Scenario',
    description: 'Test description',
    published: false,
    languagePair: { known: 'ru', learning: 'en' },
    sourceMode: 'fixed',
    fixedCardIds: ['card-1', 'card-2'],
    criteria: {},
    criteriaLimit: 50,
    criteriaSort: 'updatedAt',
    criteriaSeed: '',
    snapshotFrozenAt: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioEditorFormComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioEditorFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('draft', baseDraft);
    fixture.componentRef.setInput('courses', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('inputs', () => {
    it('should have required draft input', () => {
      expect(component.draft).toBeDefined();
    });

    it('should have readOnly input with default false', () => {
      expect(component.readOnly).toBeDefined();
      expect(component.readOnly()).toBe(false);
    });
  });

  describe('outputs', () => {
    it('should have draftChange output', () => {
      expect(component.draftChange).toBeDefined();
    });
  });

  describe('updateDraft', () => {
    it('should emit draftChange with merged patch', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      fixture.componentRef.setInput('draft', baseDraft);
      component.updateDraft({ title: 'Updated Title' });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          description: 'Test description',
        }),
      );
    });
  });

  describe('onKnownLanguageChange', () => {
    it('should update known language in languagePair', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      fixture.componentRef.setInput('draft', baseDraft);
      component.onKnownLanguageChange('en');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          languagePair: { known: 'en', learning: 'en' },
        }),
      );
    });
  });

  describe('onLearningLanguageChange', () => {
    it('should update learning language in languagePair', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      fixture.componentRef.setInput('draft', baseDraft);
      component.onLearningLanguageChange('zh');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          languagePair: { known: 'ru', learning: 'zh' },
        }),
      );
    });
  });

  describe('languagePairInvalid', () => {
    it('should return false when languages differ', () => {
      fixture.componentRef.setInput('draft', {
        ...baseDraft,
        languagePair: { known: 'ru', learning: 'en' },
      });
      expect(component.languagePairInvalid()).toBe(false);
    });

    it('should return true when languages are equal', () => {
      fixture.componentRef.setInput('draft', {
        ...baseDraft,
        languagePair: { known: 'ru', learning: 'ru' },
      });
      expect(component.languagePairInvalid()).toBe(true);
    });
  });

  describe('updatePublished', () => {
    it('should emit draftChange with updated published flag', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      fixture.componentRef.setInput('draft', baseDraft);
      component.updatePublished(true);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          published: true,
          title: 'Test Scenario',
        }),
      );
    });

    it('should emit draftChange with published set to false', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      fixture.componentRef.setInput('draft', { ...baseDraft, published: true });
      component.updatePublished(false);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          published: false,
        }),
      );
    });
  });

  describe('tier labels', () => {
    it('should have Russian tier labels', () => {
      expect(component.tierLabels['FREE']).toBe('Бесплатный');
      expect(component.tierLabels['STARTER']).toBe('Стартовый');
      expect(component.tierLabels['GROWTH']).toBe('Рост');
      expect(component.tierLabels['PREMIUM']).toBe('Премиум');
    });
  });

  describe('tab structure', () => {
    it('should render mat-tab-group', () => {
      const tabGroups = fixture.nativeElement.querySelectorAll('mat-tab-group');
      expect(tabGroups.length).toBe(1);
    });

    it('should have tab labels', () => {
      const root = fixture.nativeElement;
      const text = root.textContent?.toLowerCase() || '';
      expect(text).toContain('сценарий');
      expect(text).toContain('связи');
      expect(text).toContain('публикация');
    });

    it('should render title and description fields', () => {
      const labels = fixture.nativeElement.querySelectorAll('mat-label');
      const labelTexts = Array.from(labels).map(
        (el: unknown) => (el as HTMLElement).textContent?.trim() ?? '',
      );
      expect(labelTexts).toContain('Название');
      expect(labelTexts).toContain('Описание');
    });
  });
});
