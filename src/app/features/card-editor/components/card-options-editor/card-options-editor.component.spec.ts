import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { describe, expect, it, vi } from 'vitest';

import { CardOptionsEditorComponent, CardOptionsEditorConfig } from './card-options-editor.component';
import type { LexemeDraftFields } from '../../../../core/repositories/chinese/lexeme-draft.utils';
import type { CardOptionsEditorState } from '../../utils/card-options-editor.utils';

describe('CardOptionsEditorComponent', () => {
  let fixture: ComponentFixture<CardOptionsEditorComponent>;
  let component: CardOptionsEditorComponent;

  const defaultConfig: CardOptionsEditorConfig = {
    title: 'Варианты',
    optionLabelPrefix: 'Вариант',
    showCorrectRadio: true,
  };

  const defaultLexemes: LexemeDraftFields[] = [
    { primary: '你好', pinyin: 'nǐ hǎo', palladius: '', ipa: '', zhuyin: '', script: 'hani', audioUrl: '', acceptedReadings: '' },
    { primary: 'hello', pinyin: '', palladius: '', ipa: '', zhuyin: '', script: 'latn', audioUrl: '', acceptedReadings: '' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardOptionsEditorComponent,
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatRadioModule,
        MatTooltipModule,
      ],
    });
    fixture = TestBed.createComponent(CardOptionsEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('config', defaultConfig);
    fixture.componentRef.setInput('options', ['你好', 'hello']);
    fixture.componentRef.setInput('lexemes', defaultLexemes);
    fixture.detectChanges();
    expect(component).toBeDefined();
  });

  it('should expose minOptions', () => {
    expect(component.minOptions).toBe(2);
  });

  it('should expose maxOptions', () => {
    expect(component.maxOptions).toBe(8);
  });

  it('should have default correctIndex 0', () => {
    fixture.componentRef.setInput('config', defaultConfig);
    fixture.componentRef.setInput('options', ['a', 'b']);
    fixture.componentRef.setInput('lexemes', defaultLexemes);
    fixture.detectChanges();
    expect(component.correctIndex()).toBe(0);
  });

  it('should resolve custom correctIndex', () => {
    fixture.componentRef.setInput('config', defaultConfig);
    fixture.componentRef.setInput('options', ['a', 'b']);
    fixture.componentRef.setInput('lexemes', defaultLexemes);
    fixture.componentRef.setInput('correctIndex', 1);
    fixture.detectChanges();
    expect(component.correctIndex()).toBe(1);
  });

  it('should have default showLexemes false', () => {
    fixture.componentRef.setInput('config', defaultConfig);
    fixture.componentRef.setInput('options', ['a', 'b']);
    fixture.componentRef.setInput('lexemes', defaultLexemes);
    fixture.detectChanges();
    expect(component.showLexemes()).toBe(false);
  });

  it('should resolve custom showLexemes', () => {
    fixture.componentRef.setInput('config', defaultConfig);
    fixture.componentRef.setInput('options', ['a', 'b']);
    fixture.componentRef.setInput('lexemes', defaultLexemes);
    fixture.componentRef.setInput('showLexemes', true);
    fixture.detectChanges();
    expect(component.showLexemes()).toBe(true);
  });

  it('should have default knownLanguage', () => {
    fixture.componentRef.setInput('config', defaultConfig);
    fixture.componentRef.setInput('options', ['a', 'b']);
    fixture.componentRef.setInput('lexemes', defaultLexemes);
    fixture.detectChanges();
    expect(component.knownLanguage()).toBe('ru');
  });

  it('should have default learningLanguage', () => {
    fixture.componentRef.setInput('config', defaultConfig);
    fixture.componentRef.setInput('options', ['a', 'b']);
    fixture.componentRef.setInput('lexemes', defaultLexemes);
    fixture.detectChanges();
    expect(component.learningLanguage()).toBe('en');
  });

  describe('editorState computed', () => {
    it('should return current state', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.componentRef.setInput('correctIndex', 0);
      fixture.detectChanges();

      const state = component.editorState();
      expect(state.options).toEqual(['a', 'b']);
      expect(state.lexemes).toEqual(defaultLexemes);
      expect(state.correctIndex).toBe(0);
    });

    it('should reflect updated correctIndex', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.componentRef.setInput('correctIndex', 1);
      fixture.detectChanges();

      const state = component.editorState();
      expect(state.correctIndex).toBe(1);
    });
  });

  describe('isOptionReadonly', () => {
    it('should return false when showLexemes is false', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.componentRef.setInput('showLexemes', false);
      fixture.detectChanges();

      expect(component.isOptionReadonly(defaultLexemes[0])).toBe(false);
    });

    it('should return true when showLexemes is true and lexeme has primary', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.componentRef.setInput('showLexemes', true);
      fixture.detectChanges();

      expect(component.isOptionReadonly(defaultLexemes[0])).toBe(true);
    });
  });

  describe('onOptionTextChange', () => {
    it('should emit updated option text', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.detectChanges();
      const spy = vi.fn();
      component.stateChange.subscribe(spy);

      component.onOptionTextChange(0, 'updated');

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as CardOptionsEditorState;
      expect(emitted.options[0]).toBe('updated');
    });
  });

  describe('onOptionLexemeChange', () => {
    it('should emit updated lexeme', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.detectChanges();
      const spy = vi.fn();
      component.stateChange.subscribe(spy);

      const newLexeme: LexemeDraftFields = { primary: '世界', pinyin: 'shìjiè', palladius: '', ipa: '', zhuyin: '', script: 'hani', audioUrl: '', acceptedReadings: '' };
      component.onOptionLexemeChange(0, newLexeme);

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as CardOptionsEditorState;
      expect(emitted.lexemes[0].primary).toBe('世界');
    });
  });

  describe('onCorrectIndexChange', () => {
    it('should emit updated correctIndex', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.componentRef.setInput('correctIndex', 0);
      fixture.detectChanges();
      const spy = vi.fn();
      component.stateChange.subscribe(spy);

      component.onCorrectIndexChange(1);

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as CardOptionsEditorState;
      expect(emitted.correctIndex).toBe(1);
    });
  });

  describe('onAddOption', () => {
    it('should add option when below max', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a']);
      fixture.componentRef.setInput('lexemes', [defaultLexemes[0]]);
      fixture.detectChanges();
      const spy = vi.fn();
      component.stateChange.subscribe(spy);

      component.onAddOption();

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as CardOptionsEditorState;
      expect(emitted.options.length).toBe(2);
    });

    it('should not add option when at max', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.detectChanges();
      const spy = vi.fn();
      component.stateChange.subscribe(spy);

      component.onAddOption();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('onRemoveOption', () => {
    it('should remove option when above min', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b', 'c']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.detectChanges();
      const spy = vi.fn();
      component.stateChange.subscribe(spy);

      component.onRemoveOption(1);

      expect(spy).toHaveBeenCalled();
      const emitted = spy.mock.lastCall?.[0] as CardOptionsEditorState;
      expect(emitted.options.length).toBe(2);
    });

    it('should not remove option when at min', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.detectChanges();
      const spy = vi.fn();
      component.stateChange.subscribe(spy);

      component.onRemoveOption(0);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should prevent default and stop propagation on event', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b', 'c']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.detectChanges();

      const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent;
      component.onRemoveOption(1, event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('optionTrack', () => {
    it('should return track string', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b', 'c']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.detectChanges();

      expect(component.optionTrack(0)).toBe('3-0');
      expect(component.optionTrack(1)).toBe('3-1');
      expect(component.optionTrack(2)).toBe('3-2');
    });
  });

  describe('removeTooltip', () => {
    it('should return min message when at min options', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.detectChanges();

      expect(component.removeTooltip()).toBe('Нужно минимум 2 варианта');
    });

    it('should return delete message when above min options', () => {
      fixture.componentRef.setInput('config', defaultConfig);
      fixture.componentRef.setInput('options', ['a', 'b', 'c']);
      fixture.componentRef.setInput('lexemes', defaultLexemes);
      fixture.detectChanges();

      expect(component.removeTooltip()).toBe('Удалить вариант');
    });
  });
});
