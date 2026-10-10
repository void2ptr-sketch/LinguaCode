import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { describe, expect, it, vi } from 'vitest';

import { CardFormSettingsPanelComponent } from './card-form-settings-panel.component';
import { HanziDataService } from '../../../hanzi-practice/hanzi-data.service';
import type { CardDraft } from '../../types';

describe('CardFormSettingsPanelComponent', () => {
  let fixture: ComponentFixture<CardFormSettingsPanelComponent>;
  let component: CardFormSettingsPanelComponent;

  const createTimedDraft = (overrides: Partial<CardDraft> = {}): CardDraft =>
    ({
      kind: 'timed',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      timeLimitSec: 30,
      ...overrides,
    }) as unknown as CardDraft;

  const createKeyboardDraft = (overrides: Partial<CardDraft> = {}): CardDraft =>
    ({
      kind: 'keyboard',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      answerMode: 'auto',
      ...overrides,
    }) as unknown as CardDraft;

  const createDrawDraft = (overrides: Partial<CardDraft> = {}): CardDraft =>
    ({
      kind: 'draw',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      targetCharacter: '你',
      practiceMode: 'freehand',
      radicalHint: '',
      promptLexeme: { primary: '', pinyin: '', palladius: '', ipa: '', zhuyin: '', script: 'hani', audioUrl: '' },
      referenceHintKnown: '',
      strokeGuides: [],
      ...overrides,
    }) as unknown as CardDraft;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardFormSettingsPanelComponent,
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
      ],
      providers: [
        {
          provide: HanziDataService,
          useValue: {
            loadCharacter: vi.fn().mockResolvedValue({ strokes: [{ points: [] }] }),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(CardFormSettingsPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should expose drawPracticeModeOptions', () => {
    expect(component.drawPracticeModeOptions).toBeDefined();
    expect(component.drawPracticeModeOptions).toHaveLength(6);
  });

  it('should expose keyboardAnswerModeOptions', () => {
    expect(component.keyboardAnswerModeOptions).toBeDefined();
    expect(component.keyboardAnswerModeOptions).toHaveLength(4);
  });

  it('should have drawHanziStrokeCount signal', () => {
    expect(component.drawHanziStrokeCount()).toBeNull();
  });

  describe('timedDraft computed', () => {
    it('should return draft when kind is timed', () => {
      fixture.componentRef.setInput('draft', createTimedDraft());
      fixture.detectChanges();
      expect(component.timedDraft()).toBeDefined();
    });

    it('should return null when kind is not timed', () => {
      fixture.componentRef.setInput('draft', createKeyboardDraft());
      fixture.detectChanges();
      expect(component.timedDraft()).toBeNull();
    });
  });

  describe('keyboardDraft computed', () => {
    it('should return draft when kind is keyboard', () => {
      fixture.componentRef.setInput('draft', createKeyboardDraft());
      fixture.detectChanges();
      expect(component.keyboardDraft()).toBeDefined();
    });

    it('should return null when kind is not keyboard', () => {
      fixture.componentRef.setInput('draft', createTimedDraft());
      fixture.detectChanges();
      expect(component.keyboardDraft()).toBeNull();
    });
  });

  describe('drawDraft computed', () => {
    it('should return draft when kind is draw', () => {
      fixture.componentRef.setInput('draft', createDrawDraft());
      fixture.detectChanges();
      expect(component.drawDraft()).toBeDefined();
    });

    it('should return null when kind is not draw', () => {
      fixture.componentRef.setInput('draft', createTimedDraft());
      fixture.detectChanges();
      expect(component.drawDraft()).toBeNull();
    });
  });

  describe('updateDraft', () => {
    it('should emit updated draft', () => {
      fixture.componentRef.setInput('draft', createTimedDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      const nextDraft = createTimedDraft({ timeLimitSec: 60 });
      component.updateDraft(nextDraft);

      expect(spy).toHaveBeenCalledWith(nextDraft);
    });
  });

  describe('updateAppearance', () => {
    it('should update appearance and emit', () => {
      fixture.componentRef.setInput('draft', createTimedDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.updateAppearance({ theme: 'dark', fontSize: 'lg' });

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as CardDraft;
      expect(emitted.appearance).toEqual({ theme: 'dark', fontSize: 'lg' });
    });
  });

  describe('updateTimeLimitSec', () => {
    it('should update timeLimitSec for timed cards', () => {
      fixture.componentRef.setInput('draft', createTimedDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.updateTimeLimitSec(60);

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as unknown as Record<string, unknown>;
      expect(emitted['timeLimitSec']).toBe(60);
    });

    it('should not update for non-timed cards', () => {
      fixture.componentRef.setInput('draft', createKeyboardDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.updateTimeLimitSec(60);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('updateKeyboardAnswerMode', () => {
    it('should update answerMode for keyboard cards', () => {
      fixture.componentRef.setInput('draft', createKeyboardDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.updateKeyboardAnswerMode('text');

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as unknown as Record<string, unknown>;
      expect(emitted['answerMode']).toBe('text');
    });

    it('should not update for non-keyboard cards', () => {
      fixture.componentRef.setInput('draft', createTimedDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.updateKeyboardAnswerMode('text');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('updateDrawPracticeMode', () => {
    it('should update practiceMode for draw cards', () => {
      fixture.componentRef.setInput('draft', createDrawDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.updateDrawPracticeMode('stroke-order');

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as unknown as Record<string, unknown>;
      expect(emitted['practiceMode']).toBe('stroke-order');
    });

    it('should not update for non-draw cards', () => {
      fixture.componentRef.setInput('draft', createTimedDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.updateDrawPracticeMode('stroke-order');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('updateDrawTargetCharacter', () => {
    it('should update targetCharacter for draw cards', () => {
      fixture.componentRef.setInput('draft', createDrawDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.updateDrawTargetCharacter('测试');

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as unknown as Record<string, unknown>;
      expect((emitted as Record<string, unknown>)['targetCharacter']).toBe('测试');
    });

    it('should not update for non-draw cards', () => {
      fixture.componentRef.setInput('draft', createTimedDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.updateDrawTargetCharacter('测试');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('updateDrawRadicalHint', () => {
    it('should update radicalHint for draw cards', () => {
      fixture.componentRef.setInput('draft', createDrawDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.updateDrawRadicalHint('女 + 子');

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as unknown as Record<string, unknown>;
      expect((emitted as Record<string, unknown>)['radicalHint']).toBe('女 + 子');
    });

    it('should not update for non-draw cards', () => {
      fixture.componentRef.setInput('draft', createTimedDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.updateDrawRadicalHint('女 + 子');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('autofillDrawHints', () => {
    it('should not update for non-draw cards', () => {
      fixture.componentRef.setInput('draft', createTimedDraft());
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.autofillDrawHints();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should update targetCharacter and radicalHint for draw cards', () => {
      fixture.componentRef.setInput('draft', createDrawDraft({ targetCharacter: '你' }));
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.autofillDrawHints();

      expect(spy).toHaveBeenCalled();
    });

    it('should not update when no hanzi character found', () => {
      fixture.componentRef.setInput('draft', createDrawDraft({ targetCharacter: '' }));
      fixture.detectChanges();
      const spy = vi.fn();
      component.draftChange.subscribe(spy);

      component.autofillDrawHints();

      // Should not call since no hanzi character
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
