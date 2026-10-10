import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { CodeSelectCardComponent } from './code-select-card.component';
import type { CodeSelectCard, CardFeedback } from '../../../../core/models';

describe('CodeSelectCardComponent', () => {
  let fixture: ComponentFixture<CodeSelectCardComponent>;
  let component: CodeSelectCardComponent;

  const mockCard: CodeSelectCard = {
    id: 'code-1',
    kind: 'code-select',
    title: 'Выберите правильный код',
    caption: 'Подсказка',
    correctIndex: 1,
    options: [
      { display: 'Опция 1', lexeme: undefined },
      { display: 'Опция 2', lexeme: undefined },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CodeSelectCardComponent, NoopAnimationsModule],
    });

    fixture = TestBed.createComponent(CodeSelectCardComponent);
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

    it('should accept selectedIndex input', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.componentRef.setInput('selectedIndex', 0);
      fixture.detectChanges();
      expect(component.selectedIndex()).toBe(0);
    });

    it('should accept feedback input', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.componentRef.setInput('feedback', 'correct' as CardFeedback);
      fixture.detectChanges();
      expect(component.feedback()).toBe('correct');
    });

    it('should accept fontSize input', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.componentRef.setInput('fontSize', 'sm');
      fixture.detectChanges();
      expect(component.fontSize()).toBe('sm');
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
    it('should compute questionHeadline from caption', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component.questionHeadline()).toBe('Подсказка');
    });

    it('should fall back to title when caption is empty', () => {
      const cardWithoutCaption: CodeSelectCard = {
        ...mockCard,
        caption: '',
      };
      fixture.componentRef.setInput('card', cardWithoutCaption);
      fixture.detectChanges();
      expect(component.questionHeadline()).toBe(mockCard.title);
    });
  });

  describe('methods', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
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
