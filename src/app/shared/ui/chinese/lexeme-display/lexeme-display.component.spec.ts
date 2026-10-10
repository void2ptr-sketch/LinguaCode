import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { LexemeDisplayComponent } from './lexeme-display.component';
import type { PhoneticLexeme, RomanizationSystem } from '../../../../core/models/phonetic-content.types';
import { UserStore } from '../../../../core/state';

// Mock UserStore factory for TestBed
function createUserStoreMock() {
  return {
    cjkLearning: () => ({
      displayRomanizations: ['pinyin'] as readonly RomanizationSystem[],
      answerRomanization: ['pinyin', 'palladius'] as readonly RomanizationSystem[],
      showTones: false,
      toneColorScheme: 'classic',
      tracingStrokeDurationSec: 1,
    }),
    phonetic: () => ({
      showIpa: false,
      ipaVariantLabel: undefined,
      answerModes: ['orthography'] as const,
    }),
  };
}

describe('LexemeDisplayComponent', () => {
  let fixture: ComponentFixture<LexemeDisplayComponent>;
  let component: LexemeDisplayComponent;

  describe('initialization', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [LexemeDisplayComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(LexemeDisplayComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should render lexeme-display host element', () => {
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('.lexeme-display-host');
      expect(host).toBeDefined();
    });
  });

  describe('lexeme input', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [LexemeDisplayComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(LexemeDisplayComponent);
      component = fixture.componentInstance;
    });

    it('should display primary text when lexeme has hani script', () => {
      fixture.componentRef.setInput('lexeme', { primary: '你好', script: 'hani' });
      fixture.detectChanges();
      const primary = fixture.nativeElement.querySelector('.lexeme-display__primary');
      expect(primary?.textContent).toContain('你好');
    });

    it('should display primary text when lexeme has latin script', () => {
      fixture.componentRef.setInput('lexeme', { primary: 'hello', script: 'latn' });
      fixture.detectChanges();
      const primary = fixture.nativeElement.querySelector('.lexeme-display__primary');
      expect(primary?.textContent).toContain('hello');
    });

    it('should display fallback text when lexeme is null', () => {
      fixture.componentRef.setInput('lexeme', null);
      fixture.componentRef.setInput('fallbackText', 'Fallback');
      fixture.detectChanges();
      const primary = fixture.nativeElement.querySelector('.lexeme-display__primary');
      expect(primary?.textContent).toContain('Fallback');
    });

    it('should display fallback text when lexeme has empty primary and no phonetic layers', () => {
      fixture.componentRef.setInput('lexeme', { primary: '', script: 'latn' });
      fixture.componentRef.setInput('fallbackText', 'Fallback text');
      fixture.detectChanges();
      const primary = fixture.nativeElement.querySelector('.lexeme-display__primary');
      expect(primary?.textContent).toContain('Fallback text');
    });

    it('should not render anything when lexeme is null and fallbackText is empty', () => {
      fixture.componentRef.setInput('lexeme', null);
      fixture.componentRef.setInput('fallbackText', '');
      fixture.detectChanges();
      // When both lexeme and fallbackText are empty, nothing should be rendered
      const queryResult = fixture.nativeElement.querySelector('.lexeme-display__primary');
      expect(queryResult).toBeNull();
    });

    it('should display lexeme when it has phonetic layers even with empty primary', () => {
      fixture.componentRef.setInput('lexeme', {
        primary: '',
        script: 'latn',
        pinyin: 'nǐ hǎo',
      });
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('.lexeme-display-host');
      expect(host).toBeDefined();
    });
  });

  describe('romanizations', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [LexemeDisplayComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(LexemeDisplayComponent);
      component = fixture.componentInstance;
    });

    it('should show romanization readings when lexeme has pinyin data', () => {
      fixture.componentRef.setInput('lexeme', {
        primary: '你好',
        script: 'hani',
        pinyin: 'nǐ hǎo',
      });
      fixture.detectChanges();
      const readings = fixture.nativeElement.querySelectorAll('.lexeme-display__reading');
      expect(readings.length).toBeGreaterThan(0);
    });

    it('should use romanizations override when provided', () => {
      fixture.componentRef.setInput('lexeme', {
        primary: '你好',
        script: 'hani',
        pinyin: 'nǐ hǎo',
        zhuyin: 'ㄋㄧˇ ㄏㄠˇ',
      });
      fixture.componentRef.setInput('romanizations', ['zhuyin']);
      fixture.detectChanges();
      const readings = fixture.nativeElement.querySelectorAll('.lexeme-display__reading');
      expect(readings.length).toBe(1);
    });

    it('should show no romanizations when enabled systems array is empty', () => {
      fixture.componentRef.setInput('lexeme', {
        primary: '你好',
        script: 'hani',
        pinyin: 'nǐ hǎo',
      });
      fixture.componentRef.setInput('romanizations', []);
      fixture.detectChanges();
      const readings = fixture.nativeElement.querySelectorAll('.lexeme-display__reading');
      expect(readings.length).toBe(0);
    });

    it('should display romanization label', () => {
      fixture.componentRef.setInput('lexeme', {
        primary: '你好',
        script: 'hani',
        pinyin: 'nǐ hǎo',
      });
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector('.lexeme-display__reading-label');
      expect(label?.textContent).toContain('拼音');
    });

    it('should not display labels when labelsVisible is false', () => {
      fixture.componentRef.setInput('lexeme', {
        primary: '你好',
        script: 'hani',
        pinyin: 'nǐ hǎo',
      });
      fixture.componentRef.setInput('labelsVisible', false);
      fixture.detectChanges();
      const labels = fixture.nativeElement.querySelectorAll('.lexeme-display__reading-label');
      expect(labels.length).toBe(0);
    });

    it('should return correct label for pinyin system', () => {
      expect(component.romanizationLabel('pinyin')).toBe('拼音');
    });

    it('should return correct label for zhuyin system', () => {
      expect(component.romanizationLabel('zhuyin')).toBe('注音');
    });

    it('should return correct label for palladius system', () => {
      expect(component.romanizationLabel('palladius')).toBe('Pal.');
    });
  });

  describe('IPA display', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [LexemeDisplayComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(LexemeDisplayComponent);
      component = fixture.componentInstance;
    });

    it('should not show IPA when effectiveShowIpa is false', () => {
      fixture.componentRef.setInput('lexeme', {
        primary: '你好',
        script: 'hani',
        ipa: '/ni hao/',
      });
      fixture.detectChanges();
      const ipaElements = fixture.nativeElement.querySelectorAll('.lexeme-display__reading--ipa');
      expect(ipaElements.length).toBe(0);
    });

    it('should show IPA when showIpa override is true', () => {
      fixture.componentRef.setInput('lexeme', {
        primary: '你好',
        script: 'hani',
        ipa: '/ni hao/',
      });
      fixture.componentRef.setInput('showIpa', true);
      fixture.detectChanges();
      const ipaElements = fixture.nativeElement.querySelectorAll('.lexeme-display__reading--ipa');
      expect(ipaElements.length).toBe(1);
    });

    it('should not show IPA when lexeme has no IPA data', () => {
      fixture.componentRef.setInput('lexeme', {
        primary: '你好',
        script: 'hani',
      });
      fixture.componentRef.setInput('showIpa', true);
      fixture.detectChanges();
      const ipaElements = fixture.nativeElement.querySelectorAll('.lexeme-display__reading--ipa');
      expect(ipaElements.length).toBe(0);
    });
  });

  describe('display modes', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [LexemeDisplayComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(LexemeDisplayComponent);
      component = fixture.componentInstance;
    });

    it('should apply inline class when inline input is true', () => {
      fixture.componentRef.setInput('lexeme', { primary: '你好', script: 'hani' });
      fixture.componentRef.setInput('inline', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.classList).toContain('lexeme-display-host--inline');
    });

    it('should apply stacked readings class when stackedReadings input is true', () => {
      fixture.componentRef.setInput('lexeme', { primary: '你好', script: 'hani' });
      fixture.componentRef.setInput('stackedReadings', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.classList).toContain('lexeme-display-host--stacked-readings');
    });

    it('should hide primary text when primaryVisible is false', () => {
      fixture.componentRef.setInput('lexeme', {
        primary: '你好',
        script: 'hani',
        pinyin: 'nǐ hǎo',
      });
      fixture.componentRef.setInput('primaryVisible', false);
      fixture.detectChanges();
      const primary = fixture.nativeElement.querySelector('.lexeme-display__primary');
      expect(primary).toBeNull();
    });

    it('should apply reading size style when readingSize is set', () => {
      fixture.componentRef.setInput('lexeme', { primary: '你好', script: 'hani' });
      fixture.componentRef.setInput('readingSize', '1.5em');
      fixture.detectChanges();
      const display = fixture.nativeElement.querySelector('.lexeme-display');
      expect(display?.style.getPropertyValue('--lexeme-reading-size')).toBe('1.5em');
    });
  });

  describe('computed signals', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [LexemeDisplayComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(LexemeDisplayComponent);
      component = fixture.componentInstance;
    });

    it('should resolve effectiveRomanizations from user store when no override', () => {
      fixture.detectChanges();
      const romanizations = component.effectiveRomanizations();
      expect(romanizations).toContain('pinyin');
    });

    it('should use romanizations override when set', () => {
      fixture.componentRef.setInput('romanizations', ['pinyin', 'palladius']);
      fixture.detectChanges();
      const romanizations = component.effectiveRomanizations();
      expect(romanizations).toEqual(['pinyin', 'palladius']);
    });

    it('should resolve effectiveShowIpa from user store when no override', () => {
      fixture.detectChanges();
      const showIpa = component.effectiveShowIpa();
      expect(showIpa).toBe(false);
    });

    it('should use showIpa override when set', () => {
      fixture.componentRef.setInput('showIpa', true);
      fixture.detectChanges();
      const showIpa = component.effectiveShowIpa();
      expect(showIpa).toBe(true);
    });

    it('should return empty array for visibleRomanizations when lexeme is null', () => {
      fixture.componentRef.setInput('lexeme', null);
      fixture.detectChanges();
      const romanizations = component.visibleRomanizations();
      expect(romanizations).toEqual([]);
    });

    it('should resolve effectiveToneColorEnabled from user store when no override', () => {
      fixture.detectChanges();
      const toneColor = component.effectiveToneColorEnabled();
      expect(toneColor).toBe(false);
    });

    it('should use toneColorEnabled override when set', () => {
      fixture.componentRef.setInput('toneColorEnabled', true);
      fixture.detectChanges();
      const toneColor = component.effectiveToneColorEnabled();
      expect(toneColor).toBe(true);
    });
  });

  describe('helper methods', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [LexemeDisplayComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(LexemeDisplayComponent);
      component = fixture.componentInstance;
    });

    it('should create phonetic tone lexeme with correct structure', () => {
      const sourceLexeme: PhoneticLexeme = {
        primary: '你好',
        script: 'hani',
        pinyin: 'nǐ hǎo',
      };
      const result = component.phoneticToneLexeme(sourceLexeme, 'nǐ');
      expect(result).toEqual({
        ...sourceLexeme,
        primary: '',
        script: 'latn',
        pinyin: 'nǐ',
      });
    });
  });

  describe('surface input', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [LexemeDisplayComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(LexemeDisplayComponent);
      component = fixture.componentInstance;
    });

    it('should resolve romanizations differently for prompt vs answer surface', () => {
      fixture.componentRef.setInput('surface', 'prompt');
      fixture.detectChanges();
      const promptRomanizations = component.effectiveRomanizations();

      fixture.componentRef.setInput('surface', 'answer');
      fixture.detectChanges();
      const answerRomanizations = component.effectiveRomanizations();

      expect(promptRomanizations).not.toEqual(answerRomanizations);
    });
  });
});
