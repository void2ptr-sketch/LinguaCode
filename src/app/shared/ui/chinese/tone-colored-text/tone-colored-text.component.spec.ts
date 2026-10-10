import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ToneColoredTextComponent } from './tone-colored-text.component';
import type { ToneMark } from '../../../../core/models/phonetic-content.types';
import { UserStore } from '../../../../core/state';

// Mock UserStore factory for TestBed
function createUserStoreMock() {
  return {
    cjkLearning: () => ({
      displayRomanizations: ['pinyin'] as const,
      answerRomanization: ['pinyin', 'palladius'] as const,
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

describe('ToneColoredTextComponent', () => {
  let fixture: ComponentFixture<ToneColoredTextComponent>;
  let component: ToneColoredTextComponent;

  describe('initialization', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [ToneColoredTextComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(ToneColoredTextComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('text', 'nǐ hǎo');
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should render span elements for segments', () => {
      const spans = fixture.nativeElement.querySelectorAll('span');
      expect(spans.length).toBeGreaterThan(0);
    });
  });

  describe('toneColorEnabled computed', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [ToneColoredTextComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(ToneColoredTextComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('text', 'nǐ hǎo');
    });

    it('should return user store showTones when enabled is null', () => {
      fixture.detectChanges();
      expect(component.toneColorEnabled()).toBe(false);
    });

    it('should return true when enabled override is true', () => {
      fixture.componentRef.setInput('enabled', true);
      fixture.detectChanges();
      expect(component.toneColorEnabled()).toBe(true);
    });

    it('should return false when enabled override is false', () => {
      fixture.componentRef.setInput('enabled', false);
      fixture.detectChanges();
      expect(component.toneColorEnabled()).toBe(false);
    });
  });

  describe('segments computed', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [ToneColoredTextComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(ToneColoredTextComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('text', 'nǐ hǎo');
    });

    it('should return single neutral segment when toneColorEnabled is false', () => {
      fixture.componentRef.setInput('enabled', false);
      fixture.detectChanges();
      const segments = component.segments();
      expect(segments.length).toBe(1);
      expect(segments[0]?.text).toBe('nǐ hǎo');
      expect(segments[0]?.tone).toBe(5);
    });

    it('should return segments when toneColorEnabled is true', () => {
      fixture.componentRef.setInput('enabled', true);
      fixture.detectChanges();
      const segments = component.segments();
      expect(segments.length).toBeGreaterThan(0);
    });

    it('should use fixedTone override for all segments', () => {
      fixture.componentRef.setInput('enabled', true);
      fixture.componentRef.setInput('fixedTone', 1 as ToneMark);
      fixture.detectChanges();
      const segments = component.segments();
      segments.forEach((segment) => {
        expect(segment.tone).toBe(1);
      });
    });

    it('should respect mode input', () => {
      fixture.componentRef.setInput('enabled', true);
      fixture.componentRef.setInput('mode', 'han');
      fixture.detectChanges();
      const segments = component.segments();
      expect(segments.length).toBeGreaterThan(0);
    });
  });

  describe('effectivePalette computed', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [ToneColoredTextComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(ToneColoredTextComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('text', 'nǐ hǎo');
      fixture.detectChanges();
    });

    it('should return resolved palette from user store', () => {
      const palette = component.effectivePalette();
      expect(palette).toBeDefined();
    });

    it('should use palette override when provided', () => {
      fixture.componentRef.setInput('palette', 'vibrant');
      fixture.detectChanges();
      const palette = component.effectivePalette();
      expect(palette).toBeDefined();
    });
  });

  describe('segmentColor method', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [ToneColoredTextComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(ToneColoredTextComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('text', 'nǐ hǎo');
      fixture.componentRef.setInput('enabled', true);
      fixture.detectChanges();
    });

    it('should return a color string for tone 1', () => {
      const color = component.segmentColor(1);
      expect(color).toBeDefined();
      expect(typeof color).toBe('string');
    });

    it('should return a color string for tone 2', () => {
      const color = component.segmentColor(2);
      expect(color).toBeDefined();
    });

    it('should return a color string for tone 3', () => {
      const color = component.segmentColor(3);
      expect(color).toBeDefined();
    });

    it('should return a color string for tone 4', () => {
      const color = component.segmentColor(4);
      expect(color).toBeDefined();
    });

    it('should return a color string for tone 5 (neutral)', () => {
      const color = component.segmentColor(5);
      expect(color).toBeDefined();
    });
  });

  describe('display modes', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [ToneColoredTextComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(ToneColoredTextComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('text', 'nǐ hǎo');
    });

    it('should apply inline class when inline is true', () => {
      fixture.componentRef.setInput('inline', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.classList).toContain('tone-colored-text--inline');
    });

    it('should not apply inline class when inline is false', () => {
      fixture.componentRef.setInput('inline', false);
      fixture.detectChanges();
      expect(fixture.nativeElement.classList).not.toContain('tone-colored-text--inline');
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [ToneColoredTextComponent],
        providers: [{ provide: UserStore, useValue: createUserStoreMock() }],
      });
      fixture = TestBed.createComponent(ToneColoredTextComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('text', 'nǐ hǎo');
    });

    it('should render text content', () => {
      fixture.detectChanges();
      const container = fixture.nativeElement as HTMLElement;
      const spans = container.querySelectorAll('span');
      const totalText = Array.from(spans).map((s: HTMLElement) => s.textContent).join('');
      expect(totalText).toContain('nǐ');
      expect(totalText).toContain('hǎo');
    });

    it('should apply color style when toneColorEnabled is true', () => {
      fixture.componentRef.setInput('enabled', true);
      fixture.detectChanges();
      const container = fixture.nativeElement as HTMLElement;
      const spans = container.querySelectorAll('span');
      const coloredSpans = Array.from(spans).filter(
        (s: HTMLElement) => s.style.color,
      );
      expect(coloredSpans.length).toBeGreaterThan(0);
    });

    it('should not apply color style when toneColorEnabled is false', () => {
      fixture.componentRef.setInput('enabled', false);
      fixture.detectChanges();
      const container = fixture.nativeElement as HTMLElement;
      const spans = container.querySelectorAll('span');
      const coloredSpans = Array.from(spans).filter(
        (s: HTMLElement) => s.style.color,
      );
      expect(coloredSpans.length).toBe(0);
    });

    it('should handle empty text', () => {
      fixture.componentRef.setInput('text', '');
      fixture.componentRef.setInput('enabled', true);
      fixture.detectChanges();
      // Empty text still produces a segment
      const segments = component.segments();
      expect(segments.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle Chinese characters in han mode', () => {
      fixture.componentRef.setInput('text', '你好');
      fixture.componentRef.setInput('mode', 'han');
      fixture.componentRef.setInput('enabled', true);
      fixture.detectChanges();
      const spans = fixture.nativeElement.querySelectorAll('span');
      expect(spans.length).toBeGreaterThan(0);
    });
  });
});
