import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { describe, expect, it, vi } from 'vitest';

import { QuizCardQuestionHeaderComponent } from './quiz-card-question-header.component';
import { LexemeDisplayComponent } from '../../chinese/lexeme-display/lexeme-display.component';

describe('QuizCardQuestionHeaderComponent', () => {
  let fixture: ComponentFixture<QuizCardQuestionHeaderComponent>;
  let component: QuizCardQuestionHeaderComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuizCardQuestionHeaderComponent, MatCardModule, LexemeDisplayComponent],
    });

    fixture = TestBed.createComponent(QuizCardQuestionHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.componentRef.setInput('prompt', 'Test Prompt');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have title input', () => {
    expect(component.title()).toBe('Test Title');
  });

  it('should have prompt input', () => {
    expect(component.prompt()).toBe('Test Prompt');
  });

  it('should have promptLexeme input', () => {
    expect(component.promptLexeme).toBeDefined();
  });

  it('should have plainText input', () => {
    expect(component.plainText()).toBe(false);
  });

  it('should have mode computed', () => {
    expect(component.mode).toBeDefined();
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('mat-card-title')).toBeTruthy();
  });
});
