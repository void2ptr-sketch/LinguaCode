import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { describe, expect, it, vi } from 'vitest';

import { CardFormPhoneticsPanelComponent } from './card-form-phonetics-panel.component';
import type { LexemeDraftFields } from '../../../../core/domain/chinese/phonetics/lexeme-draft.utils';
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

  const createToneDraft = (overrides: Partial<CardDraft> = {}): CardDraft =>
    ({
      kind: 'tone',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      ...overrides,
    }) as unknown as CardDraft;

  const createSoundDraft = (overrides: Partial<CardDraft> = {}): CardDraft =>
    ({
      kind: 'sound',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      promptLexeme: {
        primary: '',
        pinyin: '',
        palladius: '',
        ipa: '',
        zhuyin: '',
        script: 'latn',
        audioUrl: '',
        acceptedReadings: '',
      },
      audioUrl: 'http://example.com',
      audioLabelLexeme: {
        primary: 'hello',
        pinyin: '',
        palladius: '',
        ipa: '',
        zhuyin: '',
        script: 'latn',
        audioUrl: '',
        acceptedReadings: '',
      },
      ...overrides,
    }) as unknown as CardDraft;

  const createMemoryDraft = (overrides: Partial<CardDraft> = {}): CardDraft =>
    ({
      kind: 'memory',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      promptLexeme: {
        primary: 'hello',
        pinyin: '',
        palladius: '',
        ipa: '',
        zhuyin: '',
        script: 'latn',
        audioUrl: '',
        acceptedReadings: '',
      },
      pairs: [
        {
          known: 'hello',
          learning: 'привет',
          learningLexeme: {
            primary: 'привет',
            pinyin: '',
            palladius: '',
            ipa: '',
            zhuyin: '',
            script: 'latn',
            audioUrl: '',
            acceptedReadings: '',
          },
        },
      ],
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

    it('should be false for tone cards', () => {
      fixture.componentRef.setInput('draft', createToneDraft());
      fixture.detectChanges();
      expect(component.showPromptLexeme()).toBe(false);
    });

    it('should be false for code-select cards', () => {
      fixture.componentRef.setInput('draft', createCodeSelectDraft());
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

  describe('soundDraft computed', () => {
    it('should return draft when kind is sound', () => {
      fixture.componentRef.setInput('draft', createSoundDraft());
      fixture.detectChanges();
      expect(component.soundDraft()).toBeDefined();
    });

    it('should return null when kind is not sound', () => {
      fixture.componentRef.setInput('draft', createSelectDraft());
      fixture.detectChanges();
      expect(component.soundDraft()).toBeNull();
    });
  });

  describe('memoryDraft computed', () => {
    it('should return draft when kind is memory', () => {
      fixture.componentRef.setInput('draft', createMemoryDraft());
      fixture.detectChanges();
      expect(component.memoryDraft()).toBeDefined();
    });

    it('should return null when kind is not memory', () => {
      fixture.componentRef.setInput('draft', createSelectDraft());
      fixture.detectChanges();
      expect(component.memoryDraft()).toBeNull();
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

  describe('updateAudioLabelLexeme', () => {
    it('should update audioLabelLexeme for sound cards', () => {
      fixture.componentRef.setInput('draft', createSoundDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      const fields: LexemeDraftFields = {
        primary: 'hello-en',
        pinyin: '',
        palladius: '',
        ipa: '',
        zhuyin: '',
        script: 'latn',
        audioUrl: '',
        acceptedReadings: '',
      };
      component.updateAudioLabelLexeme(fields);

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as unknown as Record<string, unknown>;
      const audioLabelLexeme = emitted['audioLabelLexeme'] as Record<string, unknown>;
      expect(audioLabelLexeme['primary']).toBe('hello-en');
    });

    it('should not update for non-sound cards', () => {
      fixture.componentRef.setInput('draft', createSelectDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      const fields: LexemeDraftFields = {
        primary: 'hello',
        pinyin: '',
        palladius: '',
        ipa: '',
        zhuyin: '',
        script: 'latn',
        audioUrl: '',
        acceptedReadings: '',
      };
      component.updateAudioLabelLexeme(fields);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('updatePairLexeme', () => {
    it('should update learning lexeme for memory cards', () => {
      fixture.componentRef.setInput('draft', createMemoryDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      const fields: LexemeDraftFields = {
        primary: 'привет-new',
        pinyin: '',
        palladius: '',
        ipa: '',
        zhuyin: '',
        script: 'latn',
        audioUrl: '',
        acceptedReadings: '',
      };
      component.updatePairLexeme(0, fields);

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as unknown as Record<string, unknown>;
      const pairs = emitted['pairs'] as unknown[];
      expect((pairs[0] as Record<string, unknown>)['learning']).toBe('привет-new');
    });

    it('should not update for non-memory cards', () => {
      fixture.componentRef.setInput('draft', createSelectDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      const fields: LexemeDraftFields = {
        primary: 'hello',
        pinyin: '',
        palladius: '',
        ipa: '',
        zhuyin: '',
        script: 'latn',
        audioUrl: '',
        acceptedReadings: '',
      };
      component.updatePairLexeme(0, fields);

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
