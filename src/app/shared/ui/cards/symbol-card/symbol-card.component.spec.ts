import { vi } from 'vitest';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import type { SymbolCard } from '../../../../core/models';
import { SymbolCardComponent } from './symbol-card.component';

describe('SymbolCardComponent', () => {
  const card: SymbolCard = {
    id: 'symbol-1',
    kind: 'symbol',
    title: 'Узнай иероглиф',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    direction: 'known-to-learning',
    promptKnown: 'Что означает этот символ?',
    symbols: ['你好', '世界', '人'],
    optionsKnown: ['Привет', 'Мир', 'Человек'],
    correctIndex: 0,
  };

  let fixture: ComponentFixture<SymbolCardComponent>;
  let component: SymbolCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SymbolCardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(SymbolCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve promptLexeme from resolved card when card.promptLexeme is set', () => {
    const cardWithLexeme: SymbolCard = {
      ...card,
      promptLexeme: { primary: '你好', script: 'hani' },
    };
    fixture.componentRef.setInput('card', cardWithLexeme);
    fixture.detectChanges();

    expect(component.promptLexeme()).toEqual({ primary: '你好', script: 'hani' });
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
    fixture.componentRef.setInput('selectedIndex', 1);
    fixture.componentRef.setInput('feedback', 'incorrect');
    fixture.detectChanges();

    expect(component.optionClass(1)).toContain('incorrect');
  });

  it('should resolve card with reversed direction', () => {
    const reversedCard: SymbolCard = {
      id: 'symbol-reversed',
      kind: 'symbol',
      title: 'Узнай иероглиф',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      direction: 'learning-to-known',
      promptKnown: 'What does this symbol mean?',
      symbols: ['你好', '世界', '人'],
      optionsKnown: ['Hello', 'World', 'Person'],
      correctIndex: 0,
    };

    fixture.componentRef.setInput('card', reversedCard);
    fixture.detectChanges();

    // In learning-to-known direction, resolved prompt comes from symbols[correctIndex]
    expect(component.resolved().prompt).toBeDefined();
    expect(component.resolved().options.length).toBe(3);
  });
});
