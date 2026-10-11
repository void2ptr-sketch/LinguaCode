import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InputCardFormComponent } from './input-card-form.component';
import type { KeyboardCardDraft, DrawCardDraft } from '../../../../types';
import { emptyLexemeCardDraft } from '../../../../types';

describe('InputCardFormComponent', () => {
  let component: InputCardFormComponent;
  let fixture: ComponentFixture<InputCardFormComponent>;

  const keyboardDraft: KeyboardCardDraft = {
    kind: 'keyboard',
    title: 'Test',
    promptKnown: 'Question?',
    acceptedAnswersKnown: ['answer1', 'answer2'],
    direction: 'known-to-learning',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  };

  const drawDraft: DrawCardDraft = {
    kind: 'draw',
    title: 'Draw Test',
    promptKnown: 'Draw this',
    referenceHintKnown: 'Hint',
    targetCharacter: '永',
    practiceMode: 'freehand',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  } as DrawCardDraft;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputCardFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputCardFormComponent);
    component = fixture.componentInstance;
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

    it('should have knownLanguage input with default', () => {
      expect(component.knownLanguage).toBeDefined();
    });

    it('should have learningLanguage input with default', () => {
      expect(component.learningLanguage).toBeDefined();
    });
  });

  describe('outputs', () => {
    it('should have draftChange output', () => {
      expect(component.draftChange).toBeDefined();
    });
  });

  describe('computed drafts', () => {
    it('should return keyboard draft for keyboard kind', () => {
      fixture.componentRef.setInput('draft', keyboardDraft);
      expect(component.keyboardDraft()).toEqual(keyboardDraft);
    });

    it('should return null keyboard draft for draw kind', () => {
      fixture.componentRef.setInput('draft', drawDraft);
      expect(component.keyboardDraft()).toBeNull();
    });

    it('should return draw draft for draw kind', () => {
      fixture.componentRef.setInput('draft', drawDraft);
      expect(component.drawDraft()).toEqual(drawDraft);
    });

    it('should return null draw draft for keyboard kind', () => {
      fixture.componentRef.setInput('draft', keyboardDraft);
      expect(component.drawDraft()).toBeNull();
    });
  });

  describe('updateDraft', () => {
    it('should emit draftChange', () => {
      fixture.componentRef.setInput('draft', keyboardDraft);
      const spy = vi.spyOn(component.draftChange, 'emit');
      const newDraft = { ...keyboardDraft, title: 'Updated' };
      component.updateDraft(newDraft);
      expect(spy).toHaveBeenCalledWith(newDraft);
    });
  });

  describe('updatePromptKnown', () => {
    it('should emit updated draft with new promptKnown for keyboard', () => {
      fixture.componentRef.setInput('draft', keyboardDraft);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updatePromptKnown('New question?');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ promptKnown: 'New question?' }));
    });

    it('should emit updated draft with new promptKnown for draw', () => {
      fixture.componentRef.setInput('draft', drawDraft);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updatePromptKnown('New question?');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ promptKnown: 'New question?' }));
    });
  });

  describe('updateAcceptedAnswers', () => {
    it('should emit updated draft with new accepted answer for keyboard draft', () => {
      fixture.componentRef.setInput('draft', keyboardDraft);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateKeyboardAnswer(0, 'new1');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ acceptedAnswersKnown: ['new1', 'answer2'] }),
      );
    });
  });

  describe('updateReferenceHintKnown', () => {
    it('should emit updated draft with new reference hint for draw draft', () => {
      fixture.componentRef.setInput('draft', drawDraft);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateReferenceHintKnown('New hint');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ referenceHintKnown: 'New hint' }));
    });
  });

  describe('updateDrawPrimary', () => {
    it('should emit updated draft with new targetCharacter for draw draft', () => {
      fixture.componentRef.setInput('draft', drawDraft);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateDrawPrimary('新');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ targetCharacter: '新' }));
    });
  });
});
