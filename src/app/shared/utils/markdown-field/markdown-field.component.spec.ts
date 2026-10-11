import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DomSanitizer } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { MarkdownFieldComponent } from './markdown-field.component';

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
      providers: [DomSanitizer],
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

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('mat-form-field')).toBeTruthy();
  });
});
