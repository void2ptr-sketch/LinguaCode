import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PairsCardFormComponent } from './pairs-card-form.component';
import type { MemoryCardDraft } from '../../../../types';
import { emptyMemoryPairDraft, emptyLexemeCardDraft } from '../../../../types';

describe('PairsCardFormComponent', () => {
  let component: PairsCardFormComponent;
  let fixture: ComponentFixture<PairsCardFormComponent>;

  const memoryDraft: MemoryCardDraft = {
    kind: 'memory',
    title: 'Pairs Test',
    promptKnown: 'Match these',
    pairs: [
      { ...emptyMemoryPairDraft(), known: 'Hello', learning: 'Привет' },
      { ...emptyMemoryPairDraft(), known: 'Goodbye', learning: 'Пока' },
    ],
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PairsCardFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PairsCardFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('draft', memoryDraft);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('inputs', () => {
    it('should have required draft input', () => {
      expect(component.draft).toBeDefined();
    });

    it('should have knownLanguage input with default', () => {
      expect(component.knownLanguage).toBeDefined();
    });

    it('should have learningLanguage input with default', () => {
      expect(component.learningLanguage).toBeDefined();
    });

    it('should have isAdvanced input with default false', () => {
      expect(component.isAdvanced).toBeDefined();
      expect(component.isAdvanced()).toBe(false);
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
      const newDraft = { ...memoryDraft, title: 'Updated' };
      component.updateDraft(newDraft);
      expect(spy).toHaveBeenCalledWith(newDraft);
    });
  });

  describe('updatePromptKnown', () => {
    it('should emit updated draft with new promptKnown', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updatePromptKnown('New Prompt');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ promptKnown: 'New Prompt' }));
    });
  });

  describe('updatePair', () => {
    it('should emit updated draft with new known side of a pair', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updatePair(0, 'known', 'Hi');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          pairs: [
            expect.objectContaining({ known: 'Hi' }),
            expect.objectContaining({ known: 'Goodbye' }),
          ],
        }),
      );
    });

    it('should emit updated draft with new learning side of a pair', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updatePair(0, 'learning', 'Здравствуй');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          pairs: [
            expect.objectContaining({ learning: 'Здравствуй' }),
            expect.objectContaining({ learning: 'Пока' }),
          ],
        }),
      );
    });

    it('should sync learningLexeme in basic mode', () => {
      fixture.componentRef.setInput('isAdvanced', false);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updatePair(0, 'learning', 'Здравствуй');
      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.calls[0][0] as MemoryCardDraft;
      expect(emitted.pairs[0].learningLexeme).toBeDefined();
    });

    it('should not sync learningLexeme in advanced mode', () => {
      fixture.componentRef.setInput('isAdvanced', true);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updatePair(0, 'learning', 'C');
      const callArg = spy.mock.calls[0][0] as MemoryCardDraft;
      expect(callArg.pairs[0].learning).toBe('C');
    });
  });

  describe('addPair', () => {
    it('should emit updated draft with a new pair', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.addPair();
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ pairs: expect.arrayContaining([...memoryDraft.pairs, expect.any(Object)]) }),
      );
    });

    it('should respect maximum of 12 pairs', () => {
      const twelvePairs: MemoryCardDraft = {
        ...memoryDraft,
        pairs: Array(12).fill({ ...emptyMemoryPairDraft() }),
      };
      fixture.componentRef.setInput('draft', twelvePairs);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.addPair();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('removePair', () => {
    it('should emit updated draft with pair removed', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.removePair(0);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ pairs: [expect.objectContaining({ known: 'Goodbye' })] }),
      );
    });

    it('should respect minimum of 1 pair', () => {
      const singlePair: MemoryCardDraft = {
        ...memoryDraft,
        pairs: [{ ...emptyMemoryPairDraft(), known: 'A', learning: 'B' }],
      };
      fixture.componentRef.setInput('draft', singlePair);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.removePair(0);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
