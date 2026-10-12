import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { describe, expect, it } from 'vitest';

import { CodeSelectCardComponent } from './code-select-card.component';
import { CodeHighlightComponent } from '../../code-highlight/code-highlight.component';
import type { CodeSelectCard } from '../../../entities/card/model';

describe('CodeSelectCardComponent', () => {
  let fixture: ComponentFixture<CodeSelectCardComponent>;
  let component: CodeSelectCardComponent;

  const mockCard: CodeSelectCard = {
    id: 'code-1',
    kind: 'code-select',
    title: 'Code Select Card',
    caption: 'Select the correct code',
    prompt: { code: 'print("Hello");', language: 'python' },
    options: [
      { code: 'console.log("Hello");', language: 'javascript' },
      { code: 'print("Hello");', language: 'python' },
    ],
    correctIndex: 1,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CodeSelectCardComponent,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        CodeHighlightComponent,
      ],
    });

    fixture = TestBed.createComponent(CodeSelectCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('card', mockCard);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have card input', () => {
    expect(component.card()).toEqual(mockCard);
  });

  it('should have selectedIndex input', () => {
    expect(component.selectedIndex()).toBeNull();
  });

  it('should have feedback input', () => {
    expect(component.feedback()).toBeNull();
  });

  it('should have fontSize input', () => {
    expect(component.fontSize()).toBe('md');
  });

  it('should have optionSelected output', () => {
    expect(component.optionSelected).toBeDefined();
  });

  it('should have checkAnswer output', () => {
    expect(component.checkAnswer).toBeDefined();
  });

  it('should have nextCard output', () => {
    expect(component.nextCard).toBeDefined();
  });

  it('should have questionHeadline computed', () => {
    expect(component.questionHeadline()).toBe('Select the correct code');
  });

  it('should have optionClass method', () => {
    expect(component.optionClass).toBeDefined();
    expect(typeof component.optionClass).toBe('function');
  });

  it('should have selectOption method', () => {
    expect(component.selectOption).toBeDefined();
    expect(typeof component.selectOption).toBe('function');
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('mat-card')).toBeTruthy();
  });
});
