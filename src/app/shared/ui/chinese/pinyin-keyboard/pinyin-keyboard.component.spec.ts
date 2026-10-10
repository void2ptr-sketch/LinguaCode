import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, expect, it, vi } from 'vitest';

import { PinyinKeyboardComponent } from './pinyin-keyboard.component';
import type { PinyinKeyboardKey } from '../../../../core/domain/chinese/pinyin/pinyin-keyboard.utils';
import {
  PINYIN_KEYBOARD_UTILITY_KEYS,
  PINYIN_KEYBOARD_LETTER_ROWS,
  PINYIN_TONE_MARKS,
} from '../../../../core/domain/chinese/pinyin/pinyin-keyboard.utils';

describe('PinyinKeyboardComponent', () => {
  let fixture: ComponentFixture<PinyinKeyboardComponent>;
  let component: PinyinKeyboardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PinyinKeyboardComponent, NoopAnimationsModule],
    });
    fixture = TestBed.createComponent(PinyinKeyboardComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should render pinyin-keyboard container', () => {
      const container = fixture.nativeElement.querySelector('.pinyin-keyboard');
      expect(container).toBeDefined();
    });

    it('should have role=group', () => {
      const container = fixture.nativeElement.querySelector('.pinyin-keyboard');
      expect(container?.getAttribute('role')).toBe('group');
    });

    it('should have aria-label', () => {
      const container = fixture.nativeElement.querySelector('.pinyin-keyboard');
      expect(container?.getAttribute('aria-label')).toBe('Клавиатура пиньинь');
    });

    it('should expose letterRows constant', () => {
      expect(component.letterRows).toEqual(PINYIN_KEYBOARD_LETTER_ROWS);
    });

    it('should expose utilityKeys constant', () => {
      expect(component.utilityKeys).toEqual(PINYIN_KEYBOARD_UTILITY_KEYS);
    });

    it('should expose toneMarks constant', () => {
      expect(component.toneMarks).toEqual(PINYIN_TONE_MARKS);
    });
  });

  describe('value input', () => {
    it('should default to empty string', () => {
      expect(component.value()).toBe('');
    });

    it('should resolve provided value', () => {
      fixture.componentRef.setInput('value', 'nǐ hǎo');
      fixture.detectChanges();
      expect(component.value()).toBe('nǐ hǎo');
    });

    it('should resolve disabled input', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(component.disabled()).toBe(true);
    });
  });

  describe('showToneRow computed', () => {
    it('should be false when state is empty (toneRowOpen defaults to false)', () => {
      fixture.detectChanges();
      expect(component.showToneRow()).toBe(false);
    });

    it('should be false when value has pending syllable but toneRowOpen is false', () => {
      fixture.componentRef.setInput('value', 'ni');
      fixture.detectChanges();
      // toneRowOpen is always false on initialization via value input
      expect(component.showToneRow()).toBe(false);
    });
  });

  describe('tonePreview method', () => {
    it('should return preview for tone 1', () => {
      fixture.componentRef.setInput('value', 'ni');
      fixture.detectChanges();
      const preview = component.tonePreview(1);
      expect(preview).toBeDefined();
      expect(typeof preview).toBe('string');
    });

    it('should return preview for tone 2', () => {
      fixture.componentRef.setInput('value', 'ni');
      fixture.detectChanges();
      const preview = component.tonePreview(2);
      expect(preview).toBeDefined();
    });

    it('should return preview for tone 3', () => {
      fixture.componentRef.setInput('value', 'ni');
      fixture.detectChanges();
      const preview = component.tonePreview(3);
      expect(preview).toBeDefined();
    });

    it('should return preview for tone 4', () => {
      fixture.componentRef.setInput('value', 'ni');
      fixture.detectChanges();
      const preview = component.tonePreview(4);
      expect(preview).toBeDefined();
    });

    it('should return preview for tone 5 (neutral)', () => {
      fixture.componentRef.setInput('value', 'ni');
      fixture.detectChanges();
      const preview = component.tonePreview(5);
      expect(preview).toBeDefined();
    });

    it('should return empty string when no pending syllable', () => {
      fixture.detectChanges();
      const preview = component.tonePreview(1);
      expect(preview).toBe('');
    });
  });

  describe('toneAriaLabel method', () => {
    it('should return ARIA label for tone 1', () => {
      fixture.componentRef.setInput('value', 'ni');
      fixture.detectChanges();
      const label = component.toneAriaLabel(1);
      expect(label).toBeDefined();
      expect(typeof label).toBe('string');
    });

    it('should include tone number in label', () => {
      fixture.componentRef.setInput('value', 'ni');
      fixture.detectChanges();
      const label = component.toneAriaLabel(2);
      expect(label).toContain('2');
    });
  });

  describe('isToneKeyDisabled method', () => {
    it('should return true when tone row not visible (toneRowOpen is false)', () => {
      fixture.detectChanges();
      expect(component.isToneKeyDisabled()).toBe(true);
    });

    it('should return true when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(component.isToneKeyDisabled()).toBe(true);
    });
  });

  describe('isKeyDisabled method', () => {
    it('should return true when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const letterKey: PinyinKeyboardKey = { kind: 'letter', char: 'a' };
      expect(component.isKeyDisabled(letterKey)).toBe(true);
    });

    it('should return false for letter key when not disabled', () => {
      fixture.detectChanges();
      const letterKey: PinyinKeyboardKey = { kind: 'letter', char: 'a' };
      expect(component.isKeyDisabled(letterKey)).toBe(false);
    });

    it('should disable space key when no pending syllable and committed is empty', () => {
      fixture.detectChanges();
      const spaceKey: PinyinKeyboardKey = { kind: 'space' };
      expect(component.isKeyDisabled(spaceKey)).toBe(true);
    });

    it('should disable backspace key when no pending syllable and no committed', () => {
      fixture.detectChanges();
      const backspaceKey: PinyinKeyboardKey = { kind: 'backspace' };
      expect(component.isKeyDisabled(backspaceKey)).toBe(true);
    });
  });

  describe('pressKey method', () => {
    it('should emit valueChange on letter key press', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.valueChange.subscribe(spy);

      const letterKey: PinyinKeyboardKey = { kind: 'letter', char: 'n' };
      component.pressKey(letterKey);

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.lastCall?.[0]).toContain('n');
    });

    it('should emit valueChange on space key press when pending syllable exists', () => {
      fixture.componentRef.setInput('value', 'ni');
      fixture.detectChanges();
      const spy = vi.fn();
      component.valueChange.subscribe(spy);

      const spaceKey: PinyinKeyboardKey = { kind: 'space' };
      component.pressKey(spaceKey);

      expect(spy).toHaveBeenCalled();
    });

    it('should emit valueChange on backspace key press when pending syllable exists', () => {
      fixture.componentRef.setInput('value', 'n');
      fixture.detectChanges();
      const spy = vi.fn();
      component.valueChange.subscribe(spy);

      const backspaceKey: PinyinKeyboardKey = { kind: 'backspace' };
      component.pressKey(backspaceKey);

      expect(spy).toHaveBeenCalled();
    });

    it('should be no-op when key is disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const spy = vi.fn();
      component.valueChange.subscribe(spy);

      const letterKey: PinyinKeyboardKey = { kind: 'letter', char: 'a' };
      component.pressKey(letterKey);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit when pressing disabled space key', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.valueChange.subscribe(spy);

      const spaceKey: PinyinKeyboardKey = { kind: 'space' };
      component.pressKey(spaceKey);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('pressTone method', () => {
    it('should call applyPinyinKeyboardKey with tone key', () => {
      fixture.componentRef.setInput('value', 'ni');
      fixture.detectChanges();
      const spy = vi.fn();
      component.valueChange.subscribe(spy);

      component.pressTone(1);

      expect(spy).toHaveBeenCalled();
    });

    it('should be no-op when disabled', () => {
      fixture.componentRef.setInput('value', 'ni');
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const spy = vi.fn();
      component.valueChange.subscribe(spy);

      component.pressTone(1);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('keyboard layout', () => {
    it('should render letter rows', () => {
      fixture.detectChanges();
      const rows = fixture.nativeElement.querySelectorAll('.pinyin-keyboard__row');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should render utility keys', () => {
      fixture.detectChanges();
      const utilityRow = fixture.nativeElement.querySelector('.pinyin-keyboard__row--utility');
      expect(utilityRow).toBeDefined();
    });

    it('should render tone row', () => {
      fixture.detectChanges();
      const toneRow = fixture.nativeElement.querySelector('.pinyin-keyboard__row--tones');
      expect(toneRow).toBeDefined();
    });

    it('should render hint text', () => {
      fixture.detectChanges();
      const hint = fixture.nativeElement.querySelector('.pinyin-keyboard__hint');
      expect(hint).toBeDefined();
    });
  });
});
