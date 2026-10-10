import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { SelectCardComponent } from './select-card.component';
import type { SelectCard, CardFeedback, CardDirection } from '../../../../core/models';

describe('SelectCardComponent', () => {
  let fixture: ComponentFixture<SelectCardComponent>;
  let component: SelectCardComponent;

  const mockCard: SelectCard = {
    id: 'select-1',
    kind: 'select',
    title: 'Выберите перевод',
    prompt: 'Что означает "hello"?',
    promptLexeme: { primary: 'hello', script: 'latn' as const },
    options: ['Привет', 'Пока', 'Спасибо'],
    optionLexemes: [
      { primary: 'Привет', script: 'hani' as const },
      { primary: 'Пока', script: 'hani' as const },
      { primary: 'Спасибо', script: 'hani' as const },
    ],
    correctIndex: 0,
    direction: 'known-to-learning',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SelectCardComponent, NoopAnimationsModule],
    });

    fixture = TestBed.createComponent(SelectCardComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component).toBeDefined();
    });
  });

  describe('inputs', () => {
    it('should accept required card input', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component.card()).toEqual(mockCard);
    });

    it('should accept direction input', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.componentRef.setInput('direction', 'learning-to-known' as CardDirection);
      fixture.detectChanges();
      expect(component.direction()).toBe('learning-to-known');
    });

    it('should default direction to known-to-learning', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component.direction()).toBe('known-to-learning');
    });

    it('should accept selectedIndex input', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.componentRef.setInput('selectedIndex', 2);
      fixture.detectChanges();
      expect(component.selectedIndex()).toBe(2);
    });

    it('should accept feedback input', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.componentRef.setInput('feedback', 'incorrect' as CardFeedback);
      fixture.detectChanges();
      expect(component.feedback()).toBe('incorrect');
    });

    it('should accept fontSize input', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.componentRef.setInput('fontSize', 'lg');
      fixture.detectChanges();
      expect(component.fontSize()).toBe('lg');
    });
  });

  describe('outputs', () => {
    it('should have optionSelected output', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component.optionSelected).toBeDefined();
    });

    it('should have checkAnswer output', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component.checkAnswer).toBeDefined();
    });

    it('should have nextCard output', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component.nextCard).toBeDefined();
    });
  });

  describe('computed signals', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
    });

    it('should compute resolved card with direction applied', () => {
      const resolved = component.resolved();
      expect(resolved).toBeDefined();
      expect(resolved.correctIndex).toBe(0);
    });
  });

  describe('methods', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
    });

    it('should return prompt lexeme', () => {
      const lexeme = component.promptLexeme();
      expect(lexeme).toBeDefined();
    });

    it('should return option lexeme by index', () => {
      const lexeme = component.optionLexeme(0);
      expect(lexeme).toBeDefined();
    });

    it('should return undefined for option lexeme at out-of-bounds index', () => {
      const lexeme = component.optionLexeme(99);
      expect(lexeme).toBeUndefined();
    });

    it('should return option class', () => {
      const cssClass = component.optionClass(0);
      expect(typeof cssClass).toBe('string');
    });

    it('should emit optionSelected when feedback is null', () => {
      const spy = vi.fn();
      component.optionSelected.subscribe(spy);
      component.selectOption(1);
      expect(spy).toHaveBeenCalledWith(1);
    });

    it('should not emit optionSelected when feedback is set', () => {
      fixture.componentRef.setInput('feedback', 'correct' as CardFeedback);
      fixture.detectChanges();
      const spy = vi.fn();
      component.optionSelected.subscribe(spy);
      component.selectOption(1);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
