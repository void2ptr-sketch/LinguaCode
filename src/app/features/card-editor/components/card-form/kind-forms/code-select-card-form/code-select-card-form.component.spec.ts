import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CodeSelectCardFormComponent } from './code-select-card-form.component';
import { CODE_HIGHLIGHT_LANGUAGES, CODE_HIGHLIGHT_LANGUAGE_LABELS } from '../../../../../../core/domain/code-highlight/code-highlight.utils';
import type { CodeSelectCardDraft, CodeBlockDraft } from '../../../../types';
import { emptyLexemeCardDraft } from '../../../../types';

describe('CodeSelectCardFormComponent', () => {
  let component: CodeSelectCardFormComponent;
  let fixture: ComponentFixture<CodeSelectCardFormComponent>;

  const baseDraft: CodeSelectCardDraft = {
    kind: 'code-select',
    title: 'Test',
    caption: '',
    prompt: { code: 'print("hello");', language: 'javascript' },
    options: [
      { code: 'option 1', language: 'javascript' },
      { code: 'option 2', language: 'javascript' },
    ],
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeSelectCardFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeSelectCardFormComponent);
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
  });

  describe('outputs', () => {
    it('should have draftChange output', () => {
      expect(component.draftChange).toBeDefined();
    });
  });

  describe('constants', () => {
    it('should expose languages', () => {
      expect(component.languages).toBe(CODE_HIGHLIGHT_LANGUAGES);
    });

    it('should expose languageLabels', () => {
      expect(component.languageLabels).toBe(CODE_HIGHLIGHT_LANGUAGE_LABELS);
    });
  });

  describe('updateDraft', () => {
    it('should emit draftChange', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      const newDraft = { ...baseDraft, title: 'Updated' };
      component.updateDraft(newDraft);
      expect(spy).toHaveBeenCalledWith(newDraft);
    });
  });

  describe('updateCaption', () => {
    it('should emit updated draft with new caption', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateCaption('New caption');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ caption: 'New caption' }));
    });
  });

  describe('updatePromptCode', () => {
    it('should emit updated draft with new prompt code', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updatePromptCode('new code');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: { code: 'new code', language: 'javascript' } }),
      );
    });
  });

  describe('updatePromptLanguage', () => {
    it('should emit updated draft with new prompt language', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updatePromptLanguage('typescript');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: { code: 'print("hello");', language: 'typescript' } }),
      );
    });
  });

  describe('updateOptionCode', () => {
    it('should emit updated draft with new code at specified index', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateOptionCode(0, 'updated code');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          options: [
            { code: 'updated code', language: 'javascript' },
            { code: 'option 2', language: 'javascript' },
          ],
        }),
      );
    });
  });

  describe('updateOptionLanguage', () => {
    it('should emit updated draft with new language at specified index', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateOptionLanguage(1, 'python');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          options: [
            { code: 'option 1', language: 'javascript' },
            { code: 'option 2', language: 'python' },
          ],
        }),
      );
    });
  });

  describe('updateCorrectIndex', () => {
    it('should emit updated draft with new correctIndex', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateCorrectIndex(1);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ correctIndex: 1 }));
    });
  });

  describe('addOption', () => {
    it('should emit updated draft with new option', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.addOption();
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ options: expect.arrayContaining([...baseDraft.options, expect.objectContaining({ code: '', language: 'javascript' })]) }));
    });

    it('should respect maximum of 8 options', () => {
      const eightOptions: CodeSelectCardDraft = {
        ...baseDraft,
        options: Array(8).fill({ code: '', language: 'javascript' } as CodeBlockDraft),
      };
      fixture.componentRef.setInput('draft', eightOptions);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.addOption();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('removeOption', () => {
    it('should emit updated draft with option removed', () => {
      const threeOptions: CodeSelectCardDraft = {
        ...baseDraft,
        options: [
          { code: 'a', language: 'javascript' },
          { code: 'b', language: 'javascript' },
          { code: 'c', language: 'javascript' },
        ],
      };
      fixture.componentRef.setInput('draft', threeOptions);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.removeOption(0);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ options: [{ code: 'b', language: 'javascript' }, { code: 'c', language: 'javascript' }] }),
      );
    });

    it('should respect minimum of 2 options', () => {
      const twoOptions: CodeSelectCardDraft = {
        ...baseDraft,
        options: [
          { code: 'a', language: 'javascript' },
          { code: 'b', language: 'javascript' },
        ],
      };
      fixture.componentRef.setInput('draft', twoOptions);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.removeOption(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should adjust correctIndex when removing option before it', () => {
      const threeOptions: CodeSelectCardDraft = {
        ...baseDraft,
        options: [
          { code: 'a', language: 'javascript' },
          { code: 'b', language: 'javascript' },
          { code: 'c', language: 'javascript' },
        ],
        correctIndex: 2,
      };
      fixture.componentRef.setInput('draft', threeOptions);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.removeOption(0);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ correctIndex: 1 }));
    });

    it('should clamp correctIndex when removing last option', () => {
      const threeOptions: CodeSelectCardDraft = {
        ...baseDraft,
        options: [
          { code: 'a', language: 'javascript' },
          { code: 'b', language: 'javascript' },
          { code: 'c', language: 'javascript' },
        ],
        correctIndex: 2,
      };
      fixture.componentRef.setInput('draft', threeOptions);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.removeOption(1);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ correctIndex: 1 }));
    });
  });
});
