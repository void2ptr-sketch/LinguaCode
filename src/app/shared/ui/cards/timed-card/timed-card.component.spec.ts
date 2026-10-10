import { vi } from 'vitest';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import type { TimedCard } from '../../../../core/models';
import { TimedCardComponent } from './timed-card.component';

describe('TimedCardComponent', () => {
  const card: TimedCard = {
    id: 'timed-1',
    kind: 'timed',
    title: 'Быстрый ответ',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    direction: 'known-to-learning',
    promptKnown: 'Выбери правильный перевод',
    optionsLearning: ['Привет', 'Пока', 'Спасибо'],
    correctIndex: 0,
    timeLimitSec: 10,
  };

  let fixture: ComponentFixture<TimedCardComponent>;
  let component: TimedCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimedCardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(TimedCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize secondsLeft from card timeLimitSec', () => {
    expect(component.secondsLeft()).toBe(10);
  });

  it('should resolve promptLexeme from resolved card when card.promptLexeme is set', () => {
    const cardWithLexeme: TimedCard = {
      ...card,
      promptLexeme: { primary: '选择', script: 'hani' },
    };
    fixture.componentRef.setInput('card', cardWithLexeme);
    fixture.detectChanges();

    expect(component.promptLexeme()).toEqual({ primary: '选择', script: 'hani' });
  });

  it('should return undefined promptLexeme when card.promptLexeme is not set', () => {
    expect(component.promptLexeme()).toBeUndefined();
  });

  it('should return option lexeme at a given index', () => {
    expect(component.optionLexeme(0)).toBeUndefined();
  });

  it('should return correct option class for selected index', () => {
    fixture.componentRef.setInput('selectedIndex', 0);
    fixture.detectChanges();

    const cls = component.optionClass(0);
    expect(cls).toContain('selected');
  });

  it('should not emit optionSelected when feedback is set', () => {
    const selectSpy = vi.fn();
    component.optionSelected.subscribe(selectSpy);

    fixture.componentRef.setInput('feedback', 'correct');
    fixture.detectChanges();

    component.selectOption(1);
    expect(selectSpy).not.toHaveBeenCalled();
  });

  it('should not emit optionSelected when time has expired', () => {
    const selectSpy = vi.fn();
    component.optionSelected.subscribe(selectSpy);

    component.secondsLeft.set(0);
    component.selectOption(1);
    expect(selectSpy).not.toHaveBeenCalled();
  });

  it('should emit optionSelected with correct index', () => {
    const selectSpy = vi.fn();
    component.optionSelected.subscribe(selectSpy);

    component.selectOption(2);
    expect(selectSpy).toHaveBeenCalledWith(2);
  });

  it('should show correct option when feedback is correct', () => {
    fixture.componentRef.setInput('selectedIndex', 0);
    fixture.componentRef.setInput('feedback', 'correct');
    fixture.detectChanges();

    expect(component.optionClass(0)).toContain('correct');
  });

  it('should show incorrect option when feedback is incorrect', () => {
    fixture.componentRef.setInput('selectedIndex', 2);
    fixture.componentRef.setInput('feedback', 'incorrect');
    fixture.detectChanges();

    expect(component.optionClass(2)).toContain('incorrect');
  });

  it('should initialize secondsLeft from card timeLimitSec', () => {
    expect(component.secondsLeft()).toBe(10);
  });

  it('should resolve card with reversed direction', () => {
    const reversedCard: TimedCard = {
      id: 'timed-reversed',
      kind: 'timed',
      title: 'Быстрый ответ',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      direction: 'learning-to-known',
      promptKnown: 'Choose the correct translation',
      optionsLearning: ['Hello', 'Bye', 'Thanks'],
      optionsKnown: ['Привет', 'Пока', 'Спасибо'],
      correctIndex: 0,
      timeLimitSec: 10,
    };

    fixture.componentRef.setInput('card', reversedCard);
    fixture.detectChanges();

    // In learning-to-known direction, resolved prompt comes from optionsLearning[correctIndex]
    expect(component.resolved().prompt).toBeDefined();
    expect(component.resolved().options).toEqual(['Hello', 'Bye', 'Thanks']);
  });
});
