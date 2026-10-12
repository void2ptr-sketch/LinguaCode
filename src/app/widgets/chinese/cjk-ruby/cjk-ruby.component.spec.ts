import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CjkRubyComponent } from './cjk-ruby.component';

describe('CjkRubyComponent', () => {
  let fixture: ComponentFixture<CjkRubyComponent>;
  let component: CjkRubyComponent;

  describe('initialization', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [CjkRubyComponent],
      });
      fixture = TestBed.createComponent(CjkRubyComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('base', '你');
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should render cjk-ruby element', () => {
      const el = fixture.nativeElement.querySelector('.cjk-ruby, .cjk-ruby__base');
      expect(el).toBeDefined();
    });
  });

  describe('hasReading computed', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [CjkRubyComponent],
      });
      fixture = TestBed.createComponent(CjkRubyComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('base', '你');
    });

    it('should return true when reading is non-empty', () => {
      fixture.componentRef.setInput('reading', 'nǐ');
      fixture.detectChanges();
      expect(component.hasReading()).toBe(true);
    });

    it('should return false when reading is null', () => {
      fixture.componentRef.setInput('reading', null);
      fixture.detectChanges();
      expect(component.hasReading()).toBe(false);
    });

    it('should return false when reading is empty string', () => {
      fixture.componentRef.setInput('reading', '');
      fixture.detectChanges();
      expect(component.hasReading()).toBe(false);
    });

    it('should return false when reading is whitespace only', () => {
      fixture.componentRef.setInput('reading', '   ');
      fixture.detectChanges();
      expect(component.hasReading()).toBe(false);
    });
  });

  describe('rendering with reading', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [CjkRubyComponent],
      });
      fixture = TestBed.createComponent(CjkRubyComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('base', '你');
      fixture.componentRef.setInput('reading', 'nǐ');
      fixture.detectChanges();
    });

    it('should render ruby element', () => {
      const ruby = fixture.nativeElement.querySelector('ruby.cjk-ruby');
      expect(ruby).toBeDefined();
    });

    it('should render base text in span', () => {
      const base = fixture.nativeElement.querySelector('.cjk-ruby__base');
      expect(base?.textContent).toBe('你');
    });

    it('should render reading in rt element', () => {
      const reading = fixture.nativeElement.querySelector('.cjk-ruby__reading');
      expect(reading?.textContent).toBe('nǐ');
    });

    it('should apply romanization modifier class', () => {
      const reading = fixture.nativeElement.querySelector('.cjk-ruby__reading--pinyin');
      expect(reading).toBeDefined();
    });

    it('should set lang attribute to zh-Hans', () => {
      const ruby = fixture.nativeElement.querySelector('ruby.cjk-ruby');
      expect(ruby?.getAttribute('lang')).toBe('zh-Hans');
    });
  });

  describe('rendering without reading', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [CjkRubyComponent],
      });
      fixture = TestBed.createComponent(CjkRubyComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('base', '你好');
      fixture.componentRef.setInput('reading', null);
      fixture.detectChanges();
    });

    it('should not render ruby element', () => {
      const ruby = fixture.nativeElement.querySelector('ruby');
      expect(ruby).toBeNull();
    });

    it('should render base text in span only', () => {
      const base = fixture.nativeElement.querySelector('.cjk-ruby__base');
      expect(base?.textContent).toBe('你好');
    });

    it('should set lang attribute to zh-Hans on span', () => {
      const base = fixture.nativeElement.querySelector('.cjk-ruby__base');
      expect(base?.getAttribute('lang')).toBe('zh-Hans');
    });
  });

  describe('romanization input', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [CjkRubyComponent],
      });
      fixture = TestBed.createComponent(CjkRubyComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('base', '你');
    });

    it('should default to pinyin romanization class', () => {
      fixture.componentRef.setInput('reading', 'nǐ');
      fixture.detectChanges();
      const reading = fixture.nativeElement.querySelector('.cjk-ruby__reading--pinyin');
      expect(reading).toBeDefined();
    });

    it('should apply zhuyin romanization class when set', () => {
      fixture.componentRef.setInput('reading', 'ㄋㄧˇ');
      fixture.componentRef.setInput('romanization', 'zhuyin');
      fixture.detectChanges();
      const reading = fixture.nativeElement.querySelector('.cjk-ruby__reading--zhuyin');
      expect(reading).toBeDefined();
    });

    it('should apply palladius romanization class when set', () => {
      fixture.componentRef.setInput('reading', 'ни');
      fixture.componentRef.setInput('romanization', 'palladius');
      fixture.detectChanges();
      const reading = fixture.nativeElement.querySelector('.cjk-ruby__reading--palladius');
      expect(reading).toBeDefined();
    });
  });
});
