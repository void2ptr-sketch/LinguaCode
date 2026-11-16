import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CardFormAnswersTabComponent } from './card-form-answers-tab.component';
import type {
  SelectCardDraft,
  CodeSelectCardDraft,
  KeyboardCardDraft,
  MemoryCardDraft,
  SoundCardDraft,
  TimedCardDraft,
  DrawCardDraft,
  ClozeCardDraft,
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

  const timedDraft: TimedCardDraft = {
    kind: 'timed',
    title: 'Test Timed',
    promptKnown: 'Quick!',
    optionsLearning: ['A', 'B'],
    optionsLexemes: emptyOptionLexemes(2),
    correctIndex: 0,
    timeLimitSec: 30,
    direction: 'known-to-learning',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  };

  const drawDraft: DrawCardDraft = {
    kind: 'draw',
    title: 'Test Draw',
    promptKnown: 'Draw this',
    referenceHintKnown: 'hint',
    targetCharacter: '永',
    practiceMode: 'freehand',
    radicalHint: '',
    strokeGuides: [],
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  };

  const memoryDraft: MemoryCardDraft = {
    kind: 'memory',
    title: 'Test Memory',
    promptKnown: 'Match these',
    pairs: [
      {
        known: 'A',
        learning: 'B',
        learningLexeme: {
          primary: 'B',
          script: 'latn',
          pinyin: '',
          zhuyin: '',
          palladius: '',
          ipa: '',
          audioUrl: '',
          acceptedReadings: '',
        },
      },
    ],
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  };

  const soundDraft: SoundCardDraft = {
    kind: 'sound',
    title: 'Test Sound',
    promptKnown: 'Listen',
    direction: 'known-to-learning',
    audioLabelLearning: 'Audio',
    audioLabelLexeme: {
      primary: 'Audio',
      script: 'latn',
      pinyin: '',
      zhuyin: '',
      palladius: '',
      ipa: '',
      audioUrl: '',
      acceptedReadings: '',
    },
    optionsKnown: ['Option A', 'Option B'],
    optionsLexemes: emptyOptionLexemes(2),
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  };

  const clozeDraft = {
    kind: 'cloze',
    title: 'Test Cloze',
    promptKnown: 'Fill in',
    options: ['A', 'B'],
    acceptedAnswers: ['A'],
    correctAnswer: 'A',
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexemeCardDraft(),
  } as unknown as ClozeCardDraft;

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

    it('should return draft for timed', () => {
      fixture.componentRef.setInput('draft', timedDraft);
      fixture.detectChanges();
      expect(component.choiceDraft()).toBe(timedDraft);
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

    it('should return null for cloze to avoid unsafe casts', () => {
      fixture.componentRef.setInput('draft', clozeDraft);
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

    it('should return draft for draw', () => {
      fixture.componentRef.setInput('draft', drawDraft);
      fixture.detectChanges();
      expect(component.inputDraft()).toBe(drawDraft);
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

  describe('inline behavior', () => {
    it('should update timeLimitSec for timed cards', () => {
      fixture.componentRef.setInput('draft', timedDraft);
      fixture.detectChanges();
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateTimeLimitSec(60);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ timeLimitSec: 60 }));
    });

    it('should not update timeLimitSec for non-timed cards', () => {
      fixture.componentRef.setInput('draft', keyboardDraft);
      fixture.detectChanges();
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateTimeLimitSec(60);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should update answerMode for keyboard cards', () => {
      fixture.componentRef.setInput('draft', keyboardDraft);
      fixture.detectChanges();
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateKeyboardAnswerMode('text');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ answerMode: 'text' }));
    });

    it('should update practiceMode for draw cards', () => {
      fixture.componentRef.setInput('draft', drawDraft);
      fixture.detectChanges();
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateDrawPracticeMode('stroke-order');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ practiceMode: 'stroke-order' }));
    });

    it('should update radicalHint for draw cards', () => {
      fixture.componentRef.setInput('draft', drawDraft);
      fixture.detectChanges();
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateDrawRadicalHint('女 + 子');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ radicalHint: '女 + 子' }));
    });
  });

  describe('unsupported answer kinds', () => {
    it('should flag cloze as unsupported', () => {
      fixture.componentRef.setInput('draft', clozeDraft);
      fixture.detectChanges();
      expect(component.isUnsupportedAnswerKind()).toBe(true);
    });

    it('should not flag select as unsupported', () => {
      fixture.componentRef.setInput('draft', selectDraft);
      fixture.detectChanges();
      expect(component.isUnsupportedAnswerKind()).toBe(false);
    });
  });
});
