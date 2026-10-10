import { vi } from 'vitest';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import type { ReadingCard } from '../../../../core/models';
import { ReadingCardComponent } from './reading-card.component';

describe('ReadingCardComponent', () => {
  const card: ReadingCard = {
    id: 'reading-1',
    kind: 'reading',
    title: 'Прочитай',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    direction: 'known-to-learning',
    promptKnown: 'Что означает этот текст?',
    optionsLearning: ['Привет', 'Пока', 'До свидания'],
    correctIndex: 0,
  };

  let fixture: ComponentFixture<ReadingCardComponent>;
  let component: ReadingCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReadingCardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ReadingCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve promptLexeme from resolved card when card.promptLexeme is set', () => {
    const cardWithLexeme: ReadingCard = {
      ...card,
      promptLexeme: { primary: '阅读', script: 'hani' },
    };
    fixture.componentRef.setInput('card', cardWithLexeme);
    fixture.detectChanges();

    expect(component.promptLexeme()).toEqual({ primary: '阅读', script: 'hani' });
  });

  it('should return undefined promptLexeme when card.promptLexeme is not set', () => {
    expect(component.promptLexeme()).toBeUndefined();
  });

  it('should return option lexeme at a given index', () => {
    expect(component.optionLexeme(0)).toBeUndefined();
    expect(component.optionLexeme(1)).toBeUndefined();
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

    component.selectOption(0);
    expect(selectSpy).not.toHaveBeenCalled();
  });

  it('should emit optionSelected with correct index', () => {
    const selectSpy = vi.fn();
    component.optionSelected.subscribe(selectSpy);

    component.selectOption(1);
    expect(selectSpy).toHaveBeenCalledWith(1);
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

  it('should resolve card with reversed direction', () => {
    const reversedCard: ReadingCard = {
      id: 'reading-reversed',
      kind: 'reading',
      title: 'Прочитай',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      direction: 'learning-to-known',
      promptKnown: 'What does this mean?',
      optionsLearning: ['Hello', 'Bye', 'Thanks'],
      optionsKnown: ['Привет', 'Пока', 'До свидания'],
      correctIndex: 0,
    };

    fixture.componentRef.setInput('card', reversedCard);
    fixture.detectChanges();

    // In learning-to-known direction, resolved prompt comes from optionsLearning[correctIndex]
    expect(component.resolved().prompt).toBeDefined();
    expect(component.resolved().options).toEqual(['Hello', 'Bye', 'Thanks']);
  });
});
