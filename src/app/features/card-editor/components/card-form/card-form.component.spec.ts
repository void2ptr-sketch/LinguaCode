import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CardFormComponent } from './card-form.component';
import { CardFormTabsComponent } from '../card-form-tabs/card-form-tabs.component';
import { CardFormQuestionTabComponent } from '../card-form-question-tab/card-form-question-tab.component';
import { CardCatalogHierarchyService } from '../../../../entities/card/lib/card-catalog-hierarchy/card-catalog-hierarchy.service';
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
      imports: [
        CardFormComponent,
        CardFormTabsComponent,
        CardFormQuestionTabComponent,
      ],
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
      expect(config.title).toBe('Варианты (новый)');
      expect(config.optionLabelPrefix).toBe('Ответ');
    });

    it('should return config for timed kind', () => {
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

  describe('allAvailableTabs', () => {
    it('should return tabs array with required tabs', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      const tabs = component.allAvailableTabs;
      expect(Array.isArray(tabs)).toBe(true);
      expect(tabs.length).toBeGreaterThan(0);
      expect(tabs.map((t) => t.label)).toContain('Вопрос');
      expect(tabs.map((t) => t.label)).toContain('Ответы');
      expect(tabs.map((t) => t.label)).toContain('Метаинфо');
      expect(tabs.map((t) => t.label)).toContain('Настройки');
    });

    it('should include Content tab for choice cards', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      const tabs = component.allAvailableTabs;
      expect(tabs.map((t) => t.label)).toContain('Контент');
    });

    it('should exclude Phonetics tab for code-select cards', () => {
      fixture.componentRef.setInput('draft', { kind: 'code-select' } as CardDraft);
      const tabs = component.allAvailableTabs;
      expect(tabs.map((t) => t.label)).not.toContain('Фонетика');
    });

    it('should include Phonetics tab for non-code-select cards', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      const tabs = component.allAvailableTabs;
      expect(tabs.map((t) => t.label)).toContain('Фонетика');
    });
  });

  describe('activeTabLabel', () => {
    it('should return first tab as default', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      expect(component.activeTabLabel()).toBe('Вопрос');
    });

    it('should return selected tab label', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      component.onTabChange('Ответы');
      expect(component.activeTabLabel()).toBe('Ответы');
    });
  });

  describe('onTabChange', () => {
    it('should update selectedTabLabel', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      component.onTabChange('Контент');
      expect(component.activeTabLabel()).toBe('Контент');
    });
  });

  describe('metaChange output', () => {
    it('should emit metaChange', () => {
      const spy = vi.spyOn(component.metaChange, 'emit');
      component.metaChange.emit({ knownLanguage: 'ru', learningLanguage: 'en' });
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
