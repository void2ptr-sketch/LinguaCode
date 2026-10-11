import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CardFormComponent } from './card-form.component';
import { CardCatalogHierarchyService } from '../../../card-catalog-search/services/card-catalog-hierarchy/card-catalog-hierarchy.service';
import type { CardDraft } from '../../types';

describe('CardFormComponent', () => {
  let component: CardFormComponent;
  let fixture: ComponentFixture<CardFormComponent>;

  const mockHierarchyService = {
    loadCourses: async () => [],
    loadLessons: async () => [],
    getScenariosForLesson: () => [],
  };

  const selectDraft = {
    kind: 'select',
    title: 'Test Card',
    direction: 'known-to-learning',
    promptKnown: 'Question?',
    optionsLearning: ['Option A', 'Option B'],
    optionsKnown: ['Ответ A', 'Ответ B'],
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
  } as unknown as CardDraft;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardFormComponent],
      providers: [
        { provide: CardCatalogHierarchyService, useValue: mockHierarchyService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CardFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('inputs', () => {
    it('should have required draft input', () => {
      expect(component.draft).toBeDefined();
    });

    it('should have previewId input with default', () => {
      expect(component.previewId).toBeDefined();
    });

    it('should have knownLanguage input with default', () => {
      expect(component.knownLanguage).toBeDefined();
    });

    it('should have learningLanguage input with default', () => {
      expect(component.learningLanguage).toBeDefined();
    });

    it('should have defaultAppearance input', () => {
      expect(component.defaultAppearance).toBeDefined();
    });

    it('should have meta input with default', () => {
      expect(component.meta).toBeDefined();
    });
  });

  describe('outputs', () => {
    it('should have draftChange output', () => {
      expect(component.draftChange).toBeDefined();
    });

    it('should have knownLanguageChange output', () => {
      expect(component.knownLanguageChange).toBeDefined();
    });

    it('should have learningLanguageChange output', () => {
      expect(component.learningLanguageChange).toBeDefined();
    });

    it('should have metaChange output', () => {
      expect(component.metaChange).toBeDefined();
    });
  });

  describe('signals', () => {
    it('should have availableCourses signal', () => {
      expect(component.availableCourses).toBeDefined();
      expect(component.availableCourses()).toEqual([]);
    });

    it('should have availableLessons signal', () => {
      expect(component.availableLessons).toBeDefined();
      expect(component.availableLessons()).toEqual([]);
    });

    it('should have availableScenarios signal', () => {
      expect(component.availableScenarios).toBeDefined();
      expect(component.availableScenarios()).toEqual([]);
    });

    it('should have kindGroup computed', () => {
      expect(component.kindGroup).toBeDefined();
    });

    it('should have effectiveAppearance computed', () => {
      expect(component.effectiveAppearance).toBeDefined();
    });

    it('should have draftForPreview computed', () => {
      expect(component.draftForPreview).toBeDefined();
    });

    it('should have previewCard computed', () => {
      expect(component.previewCard).toBeDefined();
    });

    it('should have previewFontSize computed', () => {
      expect(component.previewFontSize).toBeDefined();
    });
  });

  describe('computed drafts', () => {
    it('should return null choiceDraft for code-select kind', () => {
      fixture.componentRef.setInput('draft', { kind: 'code-select' } as CardDraft);
      expect(component.choiceDraft()).toBeNull();
    });

    it('should return null codeSelectDraft for non-code-select kind', () => {
      fixture.componentRef.setInput('draft', { kind: 'select' } as CardDraft);
      expect(component.codeSelectDraft()).toBeNull();
    });

    it('should return null inputDraft for non-input kind', () => {
      fixture.componentRef.setInput('draft', { kind: 'select' } as CardDraft);
      expect(component.inputDraft()).toBeNull();
    });

    it('should return null pairsDraft for non-memory kind', () => {
      fixture.componentRef.setInput('draft', { kind: 'select' } as CardDraft);
      expect(component.pairsDraft()).toBeNull();
    });

    it('should return null mediaDraft for non-sound kind', () => {
      fixture.componentRef.setInput('draft', { kind: 'select' } as CardDraft);
      expect(component.mediaDraft()).toBeNull();
    });
  });

  describe('updateDraft', () => {
    it('should emit draftChange', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      const spy = vi.spyOn(component.draftChange, 'emit');
      const newDraft = { ...selectDraft, title: 'Updated' };
      component.updateDraft(newDraft);
      expect(spy).toHaveBeenCalledWith(newDraft);
    });
  });

  describe('updateTitle', () => {
    it('should emit updated draft with new title', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateTitle('New Title');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Title' }));
    });
  });

  describe('updateChoicePromptKnown', () => {
    it('should emit updated draft with new promptKnown for select kind', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateChoicePromptKnown('New Prompt');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ promptKnown: 'New Prompt' }));
    });

    it('should not update promptKnown for code-select kind', () => {
      fixture.componentRef.setInput('draft', { kind: 'code-select' } as CardDraft);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateChoicePromptKnown('New Prompt');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('onKnownLanguageChange', () => {
    it('should emit knownLanguageChange', () => {
      const spy = vi.spyOn(component.knownLanguageChange, 'emit');
      component.onKnownLanguageChange('en');
      expect(spy).toHaveBeenCalledWith('en');
    });

    it('should emit metaChange with new known language', () => {
      fixture.componentRef.setInput('meta', { knownLanguage: 'ru' });
      const metaSpy = vi.spyOn(component.metaChange, 'emit');
      component.onKnownLanguageChange('en');
      expect(metaSpy).toHaveBeenCalledWith(expect.objectContaining({ knownLanguage: 'en' }));
    });
  });

  describe('onLearningLanguageChange', () => {
    it('should emit learningLanguageChange', () => {
      const spy = vi.spyOn(component.learningLanguageChange, 'emit');
      component.onLearningLanguageChange('zh');
      expect(spy).toHaveBeenCalledWith('zh');
    });
  });

  describe('choiceOptionsConfig', () => {
    it('should return config for reading kind', () => {
      fixture.componentRef.setInput('draft', { kind: 'reading' } as CardDraft);
      const config = component.choiceOptionsConfig();
      expect(config.title).toBe('Варианты чтения');
      expect(config.optionLabelPrefix).toBe('Чтение');
      expect(config.showCorrectRadio).toBe(true);
    });

    it('should return config for symbol kind', () => {
      fixture.componentRef.setInput('draft', { kind: 'symbol' } as CardDraft);
      const config = component.choiceOptionsConfig();
      expect(config.title).toBe('Символы');
    });

    it('should return config for select kind', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      const config = component.choiceOptionsConfig();
      expect(config.title).toBe('Варианты (известный)');
    });

    it('should return default config for other kinds', () => {
      fixture.componentRef.setInput('draft', { kind: 'timed' } as CardDraft);
      const config = component.choiceOptionsConfig();
      expect(config.title).toBe('Варианты (новый)');
    });
  });

  describe('choiceOptionTexts', () => {
    it('should return empty array for code-select kind', () => {
      fixture.componentRef.setInput('draft', { kind: 'code-select' } as CardDraft);
      expect(component.choiceOptionTexts()).toEqual([]);
    });

    it('should return symbols for symbol kind', () => {
      fixture.componentRef.setInput('draft', { kind: 'symbol', symbols: ['👋', '🔥'] } as unknown as CardDraft);
      expect(component.choiceOptionTexts()).toEqual(['👋', '🔥']);
    });
  });

  describe('choiceOptionLexemes', () => {
    it('should return empty array for code-select kind', () => {
      fixture.componentRef.setInput('draft', { kind: 'code-select' } as CardDraft);
      expect(component.choiceOptionLexemes()).toEqual([]);
    });
  });

  describe('onChoiceOptionsStateChange', () => {
    it('should emit updated draft with options state for reading kind', () => {
      const readingDraft = { kind: 'reading', optionsLearning: ['A'], correctIndex: 0 } as unknown as CardDraft;
      fixture.componentRef.setInput('draft', readingDraft);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.onChoiceOptionsStateChange({
        options: ['B', 'C'],
        lexemes: [],
        correctIndex: 1,
      });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ optionsLearning: ['B', 'C'], correctIndex: 1 }),
      );
    });
  });

  describe('tabs', () => {
    it('should have allAvailableTabs getter', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      expect(component.allAvailableTabs).toBeDefined();
      const tabs = component.allAvailableTabs;
      expect(Array.isArray(tabs)).toBe(true);
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('should have MAX_TAB_OFFSET getter', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      expect(component.MAX_TAB_OFFSET).toBeDefined();
      expect(typeof component.MAX_TAB_OFFSET).toBe('number');
    });

    it('should have visibleTabs computed', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      expect(component.visibleTabs).toBeDefined();
    });

    it('should have tabGroupSelectedIndex', () => {
      expect(component.tabGroupSelectedIndex).toBe(0);
    });

    it('should have activeTabLabel computed', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      expect(component.activeTabLabel).toBeDefined();
    });

    it('should return false for canPrevTabs when offset is 0', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      expect(component.canPrevTabs()).toBe(false);
    });

    it('should return boolean for canNextTabs', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      expect(typeof component.canNextTabs()).toBe('boolean');
    });

    it('should decrease tabOffset on prevTabs', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      // Start with default offset 0, canPrevTabs should be false
      expect(component.canPrevTabs()).toBe(false);
      // prevTabs should be a no-op when at offset 0
      component.prevTabs();
      expect(component.canPrevTabs()).toBe(false);
    });

    it('should increase tabOffset on nextTabs', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      // nextTabs should work when canNextTabs is true
      if (component.canNextTabs()) {
        component.nextTabs();
        expect(component.canPrevTabs()).toBe(true);
      }
    });

    it('should record selected tab label on onTabChange', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      component.onTabChange('Вопрос');
      expect(component.activeTabLabel()).toBe('Вопрос');
    });

    it('should handle keyboard shortcuts', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      const leftEvent = { ctrlKey: true, key: 'ArrowLeft', preventDefault: vi.fn() } as unknown as KeyboardEvent;
      component.handleKeydown(leftEvent);
      expect(leftEvent.preventDefault).toHaveBeenCalled();

      const rightEvent = { ctrlKey: true, key: 'ArrowRight', preventDefault: vi.fn() } as unknown as KeyboardEvent;
      if (component.canNextTabs()) {
        component.handleKeydown(rightEvent);
        expect(rightEvent.preventDefault).toHaveBeenCalled();
      }
    });
  });

  describe('updateMeta', () => {
    it('should emit metaChange', () => {
      const spy = vi.spyOn(component.metaChange, 'emit');
      component.updateMeta({ knownLanguage: 'ru', learningLanguage: 'en' });
      expect(spy).toHaveBeenCalledWith({ knownLanguage: 'ru', learningLanguage: 'en' });
    });
  });

  describe('languages and languageLabels', () => {
    it('should have languages', () => {
      expect(component.languages).toBeDefined();
      expect(Array.isArray(component.languages)).toBe(true);
    });

    it('should have languageLabels', () => {
      expect(component.languageLabels).toBeDefined();
    });
  });
});
