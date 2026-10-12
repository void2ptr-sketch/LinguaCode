import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';

import { MarkdownFieldComponent } from './markdown-field.component';

function createMockSanitizer(): DomSanitizer {
  return {
    sanitize: vi.fn((ctx: SecurityContext, str: string | null) => {
      if (!str) return null;
      // Simulate Angular's sanitization: strip dangerous content but keep safe HTML
      return str
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, 'unsafe:javascript:');
    }),
    bypassSecurityTrustHtml: vi.fn((html: string) => html),
    bypassSecurityTrustStyle: vi.fn((style: string) => style),
    bypassSecurityTrustScript: vi.fn((script: string) => script),
    bypassSecurityTrustUrl: vi.fn((url: string) => url),
    bypassSecurityTrustResourceUrl: vi.fn((url: string) => url),
  } as unknown as DomSanitizer;
}

describe('MarkdownFieldComponent', () => {
  let fixture: ComponentFixture<MarkdownFieldComponent>;
  let component: MarkdownFieldComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MarkdownFieldComponent,
        FormsModule,
        MatButtonToggleModule,
        MatFormFieldModule,
        MatInputModule,
      ],
      providers: [{ provide: DomSanitizer, useFactory: createMockSanitizer }],
    });

    fixture = TestBed.createComponent(MarkdownFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('value', 'Test markdown');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have value input', () => {
    expect(component.value()).toBe('Test markdown');
  });

  it('should have readOnly input', () => {
    expect(component.readOnly()).toBe(false);
  });

  it('should have label input', () => {
    expect(component.label()).toBe('Markdown');
  });

  it('should have rows input', () => {
    expect(component.rows()).toBe(14);
  });

  it('should have hint input', () => {
    expect(component.hint()).toBeUndefined();
  });

  it('should have valueChange output', () => {
    expect(component.valueChange).toBeDefined();
  });

  it('should have mode signal', () => {
    expect(component.mode()).toBe('edit');
  });

  it('should have previewHtml computed', () => {
    expect(component.previewHtml).toBeDefined();
  });

  it('should have effectiveMode computed', () => {
    expect(component.effectiveMode).toBeDefined();
  });

  it('should have hasPreviewContent computed', () => {
    expect(component.hasPreviewContent).toBeDefined();
  });

  it('should have setMode method', () => {
    expect(component.setMode).toBeDefined();
    expect(typeof component.setMode).toBe('function');
  });

  it('should have onValueChange method', () => {
    expect(component.onValueChange).toBeDefined();
    expect(typeof component.onValueChange).toBe('function');
  });

  describe('effectiveMode', () => {
    it('should return "edit" when mode is edit and not readOnly', () => {
      expect(component.effectiveMode()).toBe('edit');
    });

    it('should return "preview" when readOnly is true regardless of mode', () => {
      fixture.componentRef.setInput('readOnly', true);
      fixture.detectChanges();
      expect(component.effectiveMode()).toBe('preview');
    });
  });

  describe('hasPreviewContent', () => {
    it('should be false when value is empty', () => {
      fixture.componentRef.setInput('value', '');
      fixture.detectChanges();
      expect(component.hasPreviewContent()).toBe(false);
    });

    it('should be false when value is whitespace-only', () => {
      fixture.componentRef.setInput('value', '   ');
      fixture.detectChanges();
      expect(component.hasPreviewContent()).toBe(false);
    });

    it('should be true when value contains valid markdown', () => {
      fixture.componentRef.setInput('value', '**bold**');
      fixture.detectChanges();
      expect(component.hasPreviewContent()).toBe(true);
    });
  });

  describe('setMode', () => {
    it('should set mode to "edit"', () => {
      component.setMode('edit');
      expect(component.mode()).toBe('edit');
    });

    it('should set mode to "preview"', () => {
      component.setMode('preview');
      expect(component.mode()).toBe('preview');
    });

    it('should not change mode when passed null', () => {
      component.setMode(null as unknown as 'edit');
      expect(component.mode()).toBe('edit');
    });

    it('should not change mode when passed undefined', () => {
      component.setMode(undefined);
      expect(component.mode()).toBe('edit');
    });

    it('should not change mode when passed invalid value', () => {
      component.setMode('invalid' as unknown as 'edit');
      expect(component.mode()).toBe('edit');
    });
  });

  describe('onValueChange', () => {
    it('should emit new value on change', () => {
      const spy = vi.spyOn(component.valueChange, 'emit');
      component.onValueChange('new value');
      expect(spy).toHaveBeenCalledWith('new value');
    });
  });

  describe('template rendering', () => {
    it('should render mat-form-field', () => {
      const root = fixture.nativeElement;
      expect(root.querySelector('mat-form-field')).toBeTruthy();
    });

    it('should render textarea in edit mode', () => {
      const root = fixture.nativeElement;
      expect(root.querySelector('textarea')).toBeTruthy();
    });

    it('should render preview section when in preview mode', () => {
      component.setMode('preview');
      fixture.detectChanges();
      const root = fixture.nativeElement;
      expect(root.querySelector('.markdown-field__preview')).toBeTruthy();
    });

    it('should render empty message when no preview content', () => {
      fixture.componentRef.setInput('value', '');
      fixture.detectChanges();
      component.setMode('preview');
      fixture.detectChanges();
      const root = fixture.nativeElement;
      expect(root.querySelector('.markdown-field__empty')).toBeTruthy();
    });

    it('should not render toggle group when readOnly is true', () => {
      fixture.componentRef.setInput('readOnly', true);
      fixture.detectChanges();
      const root = fixture.nativeElement;
      expect(root.querySelector('.markdown-field__mode')).toBeFalsy();
    });

    it('should render toggle group when not readOnly', () => {
      const root = fixture.nativeElement;
      expect(root.querySelector('.markdown-field__mode')).toBeTruthy();
    });

    it('should render hint when provided', () => {
      fixture.componentRef.setInput('hint', 'Some hint text');
      fixture.detectChanges();
      const root = fixture.nativeElement;
      expect(root.querySelector('mat-hint')).toBeTruthy();
      expect(root.textContent).toContain('Some hint text');
    });

    it('should not render hint when not provided', () => {
      const root = fixture.nativeElement;
      expect(root.querySelector('mat-hint')).toBeFalsy();
    });

    it('should render label text', () => {
      fixture.componentRef.setInput('label', 'Custom Label');
      fixture.detectChanges();
      const root = fixture.nativeElement;
      expect(root.textContent).toContain('Custom Label');
    });

    it('should set textarea rows based on rows input', () => {
      fixture.componentRef.setInput('rows', 20);
      fixture.detectChanges();
      const root = fixture.nativeElement;
      const textarea = root.querySelector('textarea');
      expect(textarea?.getAttribute('rows')).toBe('20');
    });
  });

  describe('preview mode behavior', () => {
    it('should show preview and hide editor when mode is preview', () => {
      component.setMode('preview');
      fixture.detectChanges();
      const root = fixture.nativeElement;
      expect(root.querySelector('.markdown-field__preview')).toBeTruthy();
      expect(root.querySelector('textarea')).toBeFalsy();
    });

    it('should show editor and hide preview when mode is edit', () => {
      component.setMode('edit');
      fixture.detectChanges();
      const root = fixture.nativeElement;
      expect(root.querySelector('textarea')).toBeTruthy();
      expect(root.querySelector('.markdown-field__preview')).toBeFalsy();
    });
  });

  describe('readOnly mode behavior', () => {
    it('should force effectiveMode to preview when readOnly is true', () => {
      fixture.componentRef.setInput('readOnly', true);
      fixture.detectChanges();
      expect(component.effectiveMode()).toBe('preview');
    });

    it('should not render toggle group in readOnly mode', () => {
      fixture.componentRef.setInput('readOnly', true);
      fixture.detectChanges();
      const root = fixture.nativeElement;
      expect(root.querySelector('.markdown-field__mode')).toBeFalsy();
    });
  });

  describe('input value updates', () => {
    it('should update previewHtml when value changes', () => {
      fixture.componentRef.setInput('value', '');
      fixture.detectChanges();
      expect(component.hasPreviewContent()).toBe(false);
      fixture.componentRef.setInput('value', '# Title');
      fixture.detectChanges();
      expect(component.hasPreviewContent()).toBe(true);
    });
  });
});
