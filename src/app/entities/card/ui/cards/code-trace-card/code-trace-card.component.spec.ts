import { describe, expect, it, vi } from 'vitest';

import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { CodeTraceCard } from '../../../model';
import { CodeTraceCardComponent } from './code-trace-card.component';

describe('CodeTraceCardComponent', () => {
  const card: CodeTraceCard = {
    id: 'trace-1',
    kind: 'code-trace',
    title: 'C++: что выведет код?',
    question: 'Что выведет программа?',
    code: { language: 'cpp', code: 'int main() { return 0; }' },
    outputOptions: ['0', '1'],
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
  };

  let fixture: ComponentFixture<CodeTraceCardComponent>;
  let component: CodeTraceCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeTraceCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeTraceCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have card input', () => {
    expect(component.card()).toEqual(card);
  });

  it('should render question headline from question field', () => {
    expect(component.questionHeadline()).toBe('Что выведет программа?');
  });

  it('should fall back to caption for headline', () => {
    fixture.componentRef.setInput('card', {
      ...card,
      question: undefined,
      caption: 'std::atomic',
    });
    fixture.detectChanges();

    expect(component.questionHeadline()).toBe('std::atomic');
  });

  it('should fall back to title for headline', () => {
    fixture.componentRef.setInput('card', { ...card, question: undefined, caption: undefined });
    fixture.detectChanges();

    expect(component.questionHeadline()).toBe('C++: что выведет код?');
  });

  it('should emit optionSelected without feedback', () => {
    const spy = vi.fn();
    component.optionSelected.subscribe(spy);

    component.selectOption(1);
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('should not emit optionSelected when feedback is shown', () => {
    fixture.componentRef.setInput('feedback', 'incorrect');
    fixture.detectChanges();

    const spy = vi.fn();
    component.optionSelected.subscribe(spy);

    component.selectOption(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should build option classes with correct index', () => {
    fixture.componentRef.setInput('selectedIndex', 0);
    fixture.detectChanges();

    expect(component.optionClass(0)).toContain('selected');
    expect(component.optionClass(1)).not.toContain('selected');
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('mat-card')).toBeTruthy();
  });
});
