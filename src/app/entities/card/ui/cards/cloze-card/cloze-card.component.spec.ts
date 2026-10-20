import { describe, expect, it, vi } from 'vitest';

import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { ClozeCard } from '../../../model';
import { ClozeCardComponent, splitClozePrompt } from './cloze-card.component';

describe('ClozeCardComponent', () => {
  const selectCard: ClozeCard = {
    id: 'cloze-select-1',
    kind: 'cloze',
    title: 'Пропуск (выбор)',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    promptKnown: 'I ___ coffee every morning.',
    options: ['drinks', 'drink', 'drinking'],
    correctIndex: 1,
    correctAnswer: 'drink',
  };

  const inputCard: ClozeCard = {
    id: 'cloze-input-1',
    kind: 'cloze',
    title: 'Пропуск (ввод)',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    promptKnown: 'Five + five = ___',
    correctAnswer: 'ten',
    acceptedAnswers: ['10'],
  };

  let fixture: ComponentFixture<ClozeCardComponent>;
  let component: ClozeCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClozeCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClozeCardComponent);
    component = fixture.componentInstance;
  });

  it('should create in select mode', () => {
    fixture.componentRef.setInput('card', selectCard);
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.hasOptions()).toBe(true);
  });

  it('should create in input mode', () => {
    fixture.componentRef.setInput('card', inputCard);
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.hasOptions()).toBe(false);
  });

  it('should emit optionSelected without feedback', () => {
    fixture.componentRef.setInput('card', selectCard);
    fixture.detectChanges();

    const spy = vi.fn();
    component.optionSelected.subscribe(spy);

    component.selectOption(1);
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('should not emit optionSelected when feedback is shown', () => {
    fixture.componentRef.setInput('card', selectCard);
    fixture.componentRef.setInput('feedback', 'correct');
    fixture.detectChanges();

    const spy = vi.fn();
    component.optionSelected.subscribe(spy);

    component.selectOption(1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit answerTextChange for input mode', () => {
    fixture.componentRef.setInput('card', inputCard);
    fixture.detectChanges();

    const spy = vi.fn();
    component.answerTextChange.subscribe(spy);

    component.onTextChange('ten');
    expect(spy).toHaveBeenCalledWith('ten');
  });

  it('should build option classes with correct index', () => {
    fixture.componentRef.setInput('card', selectCard);
    fixture.componentRef.setInput('selectedIndex', 1);
    fixture.detectChanges();

    expect(component.optionClass(1)).toContain('selected');
    expect(component.optionClass(0)).not.toContain('selected');
  });

  it('should render the component', () => {
    fixture.componentRef.setInput('card', selectCard);
    fixture.detectChanges();

    const root = fixture.nativeElement;
    expect(root.querySelector('mat-card')).toBeTruthy();
  });
});

describe('splitClozePrompt', () => {
  it('should split text around the blank placeholder', () => {
    expect(splitClozePrompt('I ___ coffee.')).toEqual([
      { text: 'I ', blank: false },
      { text: '___', blank: true },
      { text: ' coffee.', blank: false },
    ]);
  });

  it('should handle multiple blanks', () => {
    const segments = splitClozePrompt('a ___ b ___ c');
    expect(segments.filter((segment) => segment.blank)).toHaveLength(2);
    expect(segments).toHaveLength(5);
  });

  it('should handle underscores of any length', () => {
    const segments = splitClozePrompt('x ____ y');
    expect(segments[1]).toEqual({ text: '____', blank: true });
  });

  it('should return a single text segment when there is no blank', () => {
    expect(splitClozePrompt('no blank here')).toEqual([{ text: 'no blank here', blank: false }]);
  });

  it('should handle blank at the start of the string', () => {
    const segments = splitClozePrompt('___ starts here');
    expect(segments[0]).toEqual({ text: '___', blank: true });
  });

  it('should handle empty string', () => {
    expect(splitClozePrompt('')).toEqual([{ text: '', blank: false }]);
  });
});
