import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, expect, it, beforeEach } from 'vitest';

import { QuizCardQuestionHeaderComponent } from './quiz-card-question-header.component';
import type { PhoneticLexeme } from '../../../../core/models';

describe('QuizCardQuestionHeaderComponent', () => {
  let fixture: ComponentFixture<QuizCardQuestionHeaderComponent>;
  let component: QuizCardQuestionHeaderComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuizCardQuestionHeaderComponent, NoopAnimationsModule],
    });

    fixture = TestBed.createComponent(QuizCardQuestionHeaderComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      fixture.componentRef.setInput('title', 'Тест');
      fixture.componentRef.setInput('prompt', 'Что такое?');
      fixture.detectChanges();
      expect(component).toBeDefined();
    });
  });

  describe('inputs', () => {
    it('should accept required title input', () => {
      fixture.componentRef.setInput('title', 'Заголовок');
      fixture.detectChanges();
      expect(component.title()).toBe('Заголовок');
    });

    it('should accept required prompt input', () => {
      fixture.componentRef.setInput('prompt', 'Текст вопроса');
      fixture.detectChanges();
      expect(component.prompt()).toBe('Текст вопроса');
    });

    it('should accept optional promptLexeme input', () => {
      const lexeme: PhoneticLexeme = { primary: '你好', script: 'hani', pinyin: 'nǐ hǎo' };
      fixture.componentRef.setInput('promptLexeme', lexeme);
      fixture.detectChanges();
      expect(component.promptLexeme()).toEqual(lexeme);
    });

    it('should default promptLexeme to undefined', () => {
      fixture.detectChanges();
      expect(component.promptLexeme()).toBeUndefined();
    });

    it('should accept plainText input', () => {
      fixture.componentRef.setInput('plainText', true);
      fixture.detectChanges();
      expect(component.plainText()).toBe(true);
    });

    it('should default plainText to false', () => {
      fixture.detectChanges();
      expect(component.plainText()).toBe(false);
    });
  });

  describe('computed signals', () => {
    it('should compute mode as prompt-only when prompt is non-empty', () => {
      fixture.componentRef.setInput('title', 'Заголовок');
      fixture.componentRef.setInput('prompt', 'Вопрос');
      fixture.detectChanges();
      expect(component.mode()).toBe('prompt-only');
    });

    it('should compute mode as title-only when prompt is empty', () => {
      fixture.componentRef.setInput('title', 'Заголовок');
      fixture.componentRef.setInput('prompt', '');
      fixture.detectChanges();
      expect(component.mode()).toBe('title-only');
    });
  });
});
