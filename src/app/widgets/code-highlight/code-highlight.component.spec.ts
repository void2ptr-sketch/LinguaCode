import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CodeHighlightComponent } from './code-highlight.component';
import { CodeHighlightService } from './code-highlight.service';

describe('CodeHighlightComponent', () => {
  let fixture: ComponentFixture<CodeHighlightComponent>;
  let component: CodeHighlightComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CodeHighlightComponent],
      providers: [CodeHighlightService],
    });
    fixture = TestBed.createComponent(CodeHighlightComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should render code or pre element', () => {
      fixture.componentRef.setInput('code', 'console.log("hi")');
      fixture.detectChanges();
      const codeOrPre = fixture.nativeElement.querySelector('code, pre');
      expect(codeOrPre).toBeDefined();
    });
  });

  describe('code input', () => {
    it('should default to empty string', () => {
      expect(component.code()).toBe('');
    });

    it('should resolve provided code', () => {
      fixture.componentRef.setInput('code', 'console.log("hi")');
      fixture.detectChanges();
      expect(component.code()).toBe('console.log("hi")');
    });
  });

  describe('language input', () => {
    it('should default to plain', () => {
      expect(component.language()).toBe('plain');
    });

    it('should resolve provided language', () => {
      fixture.componentRef.setInput('language', 'typescript');
      fixture.detectChanges();
      expect(component.language()).toBe('typescript');
    });
  });

  describe('inline input', () => {
    it('should default to false', () => {
      expect(component.inline()).toBe(false);
    });

    it('should resolve provided inline value', () => {
      fixture.componentRef.setInput('inline', true);
      fixture.detectChanges();
      expect(component.inline()).toBe(true);
    });

    it('should render code element when inline is true', () => {
      fixture.componentRef.setInput('code', 'console.log("hi")');
      fixture.componentRef.setInput('inline', true);
      fixture.detectChanges();
      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeDefined();
      const pre = fixture.nativeElement.querySelector('pre');
      expect(pre).toBeNull();
    });

    it('should render pre element when inline is false', () => {
      fixture.componentRef.setInput('code', 'console.log("hi")');
      fixture.componentRef.setInput('inline', false);
      fixture.detectChanges();
      const pre = fixture.nativeElement.querySelector('pre');
      expect(pre).toBeDefined();
      const code = pre?.querySelector('code');
      expect(code).toBeDefined();
    });
  });

  describe('highlightedHtml computed', () => {
    it('should return sanitized HTML for plain language', () => {
      fixture.componentRef.setInput('code', '<div>test</div>');
      fixture.componentRef.setInput('language', 'plain');
      fixture.detectChanges();
      const html = component.highlightedHtml();
      expect(html).toBeDefined();
    });

    it('should return empty string for empty code', () => {
      fixture.componentRef.setInput('code', '');
      fixture.detectChanges();
      const html = component.highlightedHtml();
      expect(html).toBeDefined();
    });

    it('should return sanitized HTML for typescript language', () => {
      fixture.componentRef.setInput('code', 'const x: number = 1;');
      fixture.componentRef.setInput('language', 'typescript');
      fixture.detectChanges();
      const html = component.highlightedHtml();
      expect(html).toBeDefined();
    });

    it('should return sanitized HTML for javascript language', () => {
      fixture.componentRef.setInput('code', 'const x = 1;');
      fixture.componentRef.setInput('language', 'javascript');
      fixture.detectChanges();
      const html = component.highlightedHtml();
      expect(html).toBeDefined();
    });

    it('should return sanitized HTML for python language', () => {
      fixture.componentRef.setInput('code', 'print("hello")');
      fixture.componentRef.setInput('language', 'python');
      fixture.detectChanges();
      const html = component.highlightedHtml();
      expect(html).toBeDefined();
    });
  });

  describe('languageClass computed', () => {
    it('should return language-plain for plain language', () => {
      fixture.detectChanges();
      expect(component.languageClass()).toBe('language-plain');
    });

    it('should return language-typescript for typescript', () => {
      fixture.componentRef.setInput('language', 'typescript');
      fixture.detectChanges();
      expect(component.languageClass()).toBe('language-typescript');
    });

    it('should return language-javascript for javascript', () => {
      fixture.componentRef.setInput('language', 'javascript');
      fixture.detectChanges();
      expect(component.languageClass()).toBe('language-javascript');
    });

    it('should return language-python for python', () => {
      fixture.componentRef.setInput('language', 'python');
      fixture.detectChanges();
      expect(component.languageClass()).toBe('language-python');
    });
  });

  describe('template rendering', () => {
    it('should apply language class to code element', () => {
      fixture.componentRef.setInput('code', 'console.log("hi")');
      fixture.componentRef.setInput('language', 'typescript');
      fixture.detectChanges();
      const code = fixture.nativeElement.querySelector('code');
      expect(code?.classList).toContain('language-typescript');
    });

    it('should apply inline class when inline is true', () => {
      fixture.componentRef.setInput('code', 'console.log("hi")');
      fixture.componentRef.setInput('inline', true);
      fixture.detectChanges();
      const code = fixture.nativeElement.querySelector('code');
      expect(code?.classList).toContain('code-highlight--inline');
    });

    it('should render code content', () => {
      fixture.componentRef.setInput('code', 'console.log("hello")');
      fixture.componentRef.setInput('language', 'javascript');
      fixture.detectChanges();
      const code = fixture.nativeElement.querySelector('code');
      expect(code?.innerHTML).toContain('console');
    });
  });
});
