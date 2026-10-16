import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect } from 'vitest';
import { ScenarioEditorFormComponent } from './scenario-editor-form.component';
import { ScenarioBuilderStore } from '../../services/scenario-builder.store';
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

  const mockStore = {
    buildSnapshotFromCriteria: async () => null,
    cardTitle: async () => 'Card Title',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioEditorFormComponent],
      providers: [{ provide: ScenarioBuilderStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioEditorFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('draft', baseDraft);
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

  describe('signals', () => {
    it('should have cardTitles signal', () => {
      expect(component.cardTitles).toBeDefined();
      expect(component.cardTitles()).toEqual({});
    });
  });

  describe('constants', () => {
    it('should have languages', () => {
      expect(component.languages).toBeDefined();
      expect(Array.isArray(component.languages)).toBe(true);
    });

    it('should have languageLabels', () => {
      expect(component.languageLabels).toBeDefined();
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

  describe('onFixedCardIdsChange', () => {
    it('should update fixedCardIds in draft', async () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      fixture.componentRef.setInput('draft', baseDraft);
      await component.onFixedCardIdsChange(['card-3']);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          fixedCardIds: ['card-3'],
        }),
      );
    });
  });

  describe('onSourceModeChange', () => {
    it('should update sourceMode in draft', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      fixture.componentRef.setInput('draft', baseDraft);
      component.onSourceModeChange('criteria');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceMode: 'criteria',
        }),
      );
    });
  });

  describe('moveCard', () => {
    it('should swap card positions forward', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      fixture.componentRef.setInput('draft', baseDraft);
      component.moveCard('card-1', 1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          fixedCardIds: ['card-2', 'card-1'],
        }),
      );
    });

    it('should swap card positions backward', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      fixture.componentRef.setInput('draft', baseDraft);
      component.moveCard('card-2', -1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          fixedCardIds: ['card-2', 'card-1'],
        }),
      );
    });

    it('should not move when index is not found', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      fixture.componentRef.setInput('draft', baseDraft);
      component.moveCard('missing-card', 1);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not move when target index is out of bounds', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      fixture.componentRef.setInput('draft', baseDraft);
      component.moveCard('card-2', 1);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('createSnapshotFromCriteria', () => {
    it('should be defined', () => {
      expect(component.createSnapshotFromCriteria).toBeDefined();
    });
  });

  describe('cardTitle', () => {
    it('should return title from cardTitles signal', () => {
      component.cardTitles.set({ 'card-1': 'My Card Title' });
      expect(component.cardTitle('card-1')).toBe('My Card Title');
    });

    it('should fall back to cardId when not found', () => {
      component.cardTitles.set({});
      expect(component.cardTitle('card-1')).toBe('card-1');
    });
  });

  describe('onCriteriaSortChange', () => {
    it('should update criteriaSort in draft', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      fixture.componentRef.setInput('draft', baseDraft);
      component.onCriteriaSortChange('random');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          criteriaSort: 'random',
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
});
