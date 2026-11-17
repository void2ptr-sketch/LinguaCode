import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { describe, expect, it, vi } from 'vitest';

import { CardFormPhoneticsPanelComponent } from './card-form-phonetics-panel.component';
import type { LexemeDraftFields } from '../../../../entities/chinese/lib/phonetics/lexeme-draft.utils';
import type { CardDraft, LexemeCardDraft } from '../../types';

describe('CardFormPhoneticsPanelComponent', () => {
  let fixture: ComponentFixture<CardFormPhoneticsPanelComponent>;
  let component: CardFormPhoneticsPanelComponent;

  const createSelectDraft = (overrides: Partial<CardDraft> = {}): CardDraft =>
    ({
      kind: 'select',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      promptLexeme: {
        primary: '你好',
        pinyin: 'nǐ hǎo',
        palladius: '',
        ipa: '',
        zhuyin: '',
        script: 'hani',
        audioUrl: '',
        acceptedReadings: '',
      },
      audioUrl: '',
      ...overrides,
    }) as unknown as CardDraft;

  const createCodeSelectDraft = (overrides: Partial<CardDraft> = {}): CardDraft =>
    ({
      kind: 'code-select',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      ...overrides,
    }) as unknown as CardDraft;

  const createCodeTraceDraft = (overrides: Partial<CardDraft> = {}): CardDraft =>
    ({
      kind: 'code-trace',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      caption: '',
      question: '',
      code: { code: '', language: 'plain' },
      outputOptions: [],
      correctIndex: 0,
      ...overrides,
    }) as unknown as CardDraft;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CardFormPhoneticsPanelComponent, FormsModule, MatFormFieldModule, MatInputModule],
    });
    fixture = TestBed.createComponent(CardFormPhoneticsPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('draft', createSelectDraft());
    fixture.detectChanges();
    expect(component).toBeDefined();
  });

  it('should have default knownLanguage', () => {
    fixture.componentRef.setInput('draft', createSelectDraft());
    fixture.detectChanges();
    expect(component.knownLanguage()).toBe('ru');
  });

  it('should have default learningLanguage', () => {
    fixture.componentRef.setInput('draft', createSelectDraft());
    fixture.detectChanges();
    expect(component.learningLanguage()).toBe('en');
  });

  describe('showPromptLexeme computed', () => {
    it('should be true for select cards', () => {
      fixture.componentRef.setInput('draft', createSelectDraft());
      fixture.detectChanges();
      expect(component.showPromptLexeme()).toBe(true);
    });

    it('should be false for code-select cards', () => {
      fixture.componentRef.setInput('draft', createCodeSelectDraft());
      fixture.detectChanges();
      expect(component.showPromptLexeme()).toBe(false);
    });

    it('should be false for code-trace cards without prompt lexemes', () => {
      fixture.componentRef.setInput('draft', createCodeTraceDraft());
      fixture.detectChanges();
      expect(component.showPromptLexeme()).toBe(false);
    });
  });

  describe('promptLexemeDraft computed', () => {
    it('should return draft for select cards', () => {
      fixture.componentRef.setInput('draft', createSelectDraft());
      fixture.detectChanges();
      expect(component.promptLexemeDraft()).toBeDefined();
    });

    it('should return null for code-select cards', () => {
      fixture.componentRef.setInput('draft', createCodeSelectDraft());
      fixture.detectChanges();
      expect(component.promptLexemeDraft()).toBeNull();
    });
  });

  describe('updateDraft', () => {
    it('should emit updated draft', () => {
      fixture.componentRef.setInput('draft', createSelectDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      const nextDraft = createSelectDraft({ audioUrl: 'http://new.com' });
      component.updateDraft(nextDraft);

      expect(spy).toHaveBeenCalledWith(nextDraft);
    });
  });

  describe('updatePromptLexeme', () => {
    it('should update promptLexeme for select cards', () => {
      fixture.componentRef.setInput('draft', createSelectDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      const fields: LexemeDraftFields = {
        primary: '世界',
        pinyin: 'shìjiè',
        palladius: '',
        ipa: '',
        zhuyin: '',
        script: 'hani',
        audioUrl: '',
        acceptedReadings: '',
      };
      component.updatePromptLexeme(fields);

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as CardDraft;
      expect((emitted as LexemeCardDraft).promptLexeme.primary).toBe('世界');
    });

    it('should not update for code-select cards', () => {
      fixture.componentRef.setInput('draft', createCodeSelectDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      const fields: LexemeDraftFields = {
        primary: '世界',
        pinyin: '',
        palladius: '',
        ipa: '',
        zhuyin: '',
        script: 'hani',
        audioUrl: '',
        acceptedReadings: '',
      };
      component.updatePromptLexeme(fields);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('updateAudioUrl', () => {
    it('should update audioUrl for select cards', () => {
      fixture.componentRef.setInput('draft', createSelectDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.updateAudioUrl('http://new-audio.com');

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as unknown as Record<string, unknown>;
      expect(emitted['audioUrl']).toBe('http://new-audio.com');
    });

    it('should not update for code-select cards', () => {
      fixture.componentRef.setInput('draft', createCodeSelectDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.updateAudioUrl('http://new-audio.com');

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
