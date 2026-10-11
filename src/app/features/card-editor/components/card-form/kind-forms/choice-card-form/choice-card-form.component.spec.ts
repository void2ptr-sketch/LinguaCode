import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChoiceCardFormComponent } from './choice-card-form.component';
import type { SelectCardDraft } from '../../../../types';
import { emptyLexemeCardDraft, emptyOptionLexemes } from '../../../../types';

describe('ChoiceCardFormComponent', () => {
  let component: ChoiceCardFormComponent;
  let fixture: ComponentFixture<ChoiceCardFormComponent>;

  const selectDraft: SelectCardDraft = {
    kind: 'select',
    title: 'Test',
    promptKnown: 'What is this?',
    optionsKnown: ['A', 'B'],
    optionsLearning: ['Option A', 'Option B'],
    optionsLexemes: emptyOptionLexemes(2),
    correctIndex: 0,
    direction: 'known-to-learning',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChoiceCardFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChoiceCardFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('draft', selectDraft);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('inputs', () => {
    it('should have required draft input', () => {
      expect(component.draft).toBeDefined();
    });

    it('should have hidePrompt input with default false', () => {
      expect(component.hidePrompt).toBeDefined();
    });
  });

  describe('outputs', () => {
    it('should have draftChange output', () => {
      expect(component.draftChange).toBeDefined();
    });
  });

  describe('updateDraft', () => {
    it('should emit draftChange', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      const newDraft = { ...selectDraft, title: 'Updated' };
      component.updateDraft(newDraft);
      expect(spy).toHaveBeenCalledWith(newDraft);
    });
  });

  describe('updatePromptKnown', () => {
    it('should emit updated draft with new promptKnown', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updatePromptKnown('New question?');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ promptKnown: 'New question?' }));
    });
  });

  describe('onOptionsStateChange', () => {
    it('should emit updated draft with new options for select draft', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.onOptionsStateChange({
        options: ['New A', 'New B'],
        lexemes: emptyOptionLexemes(2),
        correctIndex: 1,
      });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          optionsLearning: ['New A', 'New B'],
          correctIndex: 1,
        }),
      );
    });
  });

  describe('optionsConfig', () => {
    it('should return config for select kind', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      const config = component.optionsConfig();
      expect(config.title).toBe('Варианты (новый)');
      expect(config.optionLabelPrefix).toBe('Ответ');
      expect(config.showCorrectRadio).toBe(true);
    });
  });

  describe('optionTexts', () => {
    it('should return optionsLearning for select kind', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      expect(component.optionTexts()).toEqual(['Option A', 'Option B']);
    });
  });

  describe('optionLexemes', () => {
    it('should return optionsLexemes for select kind', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      expect(component.optionLexemes()).toEqual(selectDraft.optionsLexemes);
    });
  });
});
