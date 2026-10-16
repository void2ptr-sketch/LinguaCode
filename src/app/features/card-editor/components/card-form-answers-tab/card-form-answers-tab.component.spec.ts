import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CardFormAnswersTabComponent } from './card-form-answers-tab.component';
import type {
  SelectCardDraft,
  CodeSelectCardDraft,
  KeyboardCardDraft,
  MemoryCardDraft,
  SoundCardDraft,
} from '../../types';
import { emptyLexemeCardDraft, emptyOptionLexemes } from '../../types';

describe('CardFormAnswersTabComponent', () => {
  let component: CardFormAnswersTabComponent;
  let fixture: ComponentFixture<CardFormAnswersTabComponent>;

  const selectDraft: SelectCardDraft = {
    kind: 'select',
    title: 'Test Select',
    promptKnown: 'What is this?',
    optionsKnown: ['A', 'B'],
    optionsLearning: ['Option A', 'Option B'],
    optionsLexemes: emptyOptionLexemes(2),
    correctIndex: 0,
    direction: 'known-to-learning',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  };

  const codeSelectDraft: CodeSelectCardDraft = {
    kind: 'code-select',
    title: 'Test Code Select',
    caption: 'Select the correct code',
    prompt: { code: 'console.log()', language: 'javascript' },
    options: [
      { code: 'console.log()', language: 'javascript' },
      { code: 'print()', language: 'python' },
    ],
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  };

  const keyboardDraft: KeyboardCardDraft = {
    kind: 'keyboard',
    title: 'Test Keyboard',
    promptKnown: 'Type this',
    acceptedAnswersKnown: ['answer', 'Answer'],
    direction: 'known-to-learning',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  };

  const memoryDraft: MemoryCardDraft = {
    kind: 'memory',
    title: 'Test Memory',
    promptKnown: 'Match these',
    pairs: [{ known: 'A', learning: 'B', learningLexeme: { primary: 'B', script: 'latn', pinyin: '', zhuyin: '', palladius: '', ipa: '', audioUrl: '', acceptedReadings: '' } }],
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  };

  const soundDraft: SoundCardDraft = {
    kind: 'sound',
    title: 'Test Sound',
    promptKnown: 'Listen',
    direction: 'known-to-learning',
    audioLabelLearning: 'Audio',
    audioLabelLexeme: { primary: 'Audio', script: 'latn', pinyin: '', zhuyin: '', palladius: '', ipa: '', audioUrl: '', acceptedReadings: '' },
    optionsKnown: ['Option A', 'Option B'],
    optionsLexemes: emptyOptionLexemes(2),
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardFormAnswersTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardFormAnswersTabComponent);
    component = fixture.componentInstance;
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
  });

  describe('outputs', () => {
    it('should have draftChange output', () => {
      expect(component.draftChange).toBeDefined();
    });
  });

  describe('kindGroup computed', () => {
    it('should return "choice" for select draft', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      fixture.detectChanges();
      expect(component.kindGroup()).toBe('choice');
    });

    it('should return "choice" for code-select draft', () => {
      fixture.componentRef.setInput('draft', codeSelectDraft);
      fixture.detectChanges();
      expect(component.kindGroup()).toBe('choice');
    });

    it('should return "input" for keyboard draft', () => {
      fixture.componentRef.setInput('draft', keyboardDraft);
      fixture.detectChanges();
      expect(component.kindGroup()).toBe('input');
    });

    it('should return "pairs" for memory draft', () => {
      fixture.componentRef.setInput('draft', memoryDraft);
      fixture.detectChanges();
      expect(component.kindGroup()).toBe('pairs');
    });

    it('should return "media" for sound draft', () => {
      fixture.componentRef.setInput('draft', soundDraft);
      fixture.detectChanges();
      expect(component.kindGroup()).toBe('media');
    });
  });

  describe('choiceDraft computed', () => {
    it('should return draft for select', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      fixture.detectChanges();
      expect(component.choiceDraft()).toBe(selectDraft);
    });

    it('should return null for code-select', () => {
      fixture.componentRef.setInput('draft', codeSelectDraft);
      fixture.detectChanges();
      expect(component.choiceDraft()).toBeNull();
    });

    it('should return null for keyboard', () => {
      fixture.componentRef.setInput('draft', keyboardDraft);
      fixture.detectChanges();
      expect(component.choiceDraft()).toBeNull();
    });
  });

  describe('codeSelectDraft computed', () => {
    it('should return draft for code-select', () => {
      fixture.componentRef.setInput('draft', codeSelectDraft);
      fixture.detectChanges();
      expect(component.codeSelectDraft()).toBe(codeSelectDraft);
    });

    it('should return null for select', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      fixture.detectChanges();
      expect(component.codeSelectDraft()).toBeNull();
    });
  });

  describe('inputDraft computed', () => {
    it('should return draft for keyboard', () => {
      fixture.componentRef.setInput('draft', keyboardDraft);
      fixture.detectChanges();
      expect(component.inputDraft()).toBe(keyboardDraft);
    });

    it('should return null for select', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      fixture.detectChanges();
      expect(component.inputDraft()).toBeNull();
    });
  });

  describe('pairsDraft computed', () => {
    it('should return draft for memory', () => {
      fixture.componentRef.setInput('draft', memoryDraft);
      fixture.detectChanges();
      expect(component.pairsDraft()).toBe(memoryDraft);
    });

    it('should return null for select', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      fixture.detectChanges();
      expect(component.pairsDraft()).toBeNull();
    });
  });

  describe('mediaDraft computed', () => {
    it('should return draft for sound', () => {
      fixture.componentRef.setInput('draft', soundDraft);
      fixture.detectChanges();
      expect(component.mediaDraft()).toBe(soundDraft);
    });

    it('should return null for select', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      fixture.detectChanges();
      expect(component.mediaDraft()).toBeNull();
    });
  });
});
