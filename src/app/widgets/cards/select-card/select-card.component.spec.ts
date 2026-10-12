import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { describe, expect, it } from 'vitest';

import { SelectCardComponent } from './select-card.component';
import { LexemeDisplayComponent } from '../../chinese/lexeme-display/lexeme-display.component';
import { QuizCardQuestionHeaderComponent } from '../quiz-card-question-header/quiz-card-question-header.component';
import type { SelectCard } from '../../../entities/card/model';

@Component({
  standalone: true,
  imports: [SelectCardComponent],
  template: `<app-select-card
    [card]="card"
    [direction]="direction"
    [selectedIndex]="selectedIndex"
    [feedback]="feedback"
    [fontSize]="fontSize"
    (checkAnswer)="onCheck()"
    (nextCard)="onNext()"
  />`,
})
class TestHostComponent {
  card: SelectCard = {
    id: 'select-1',
    kind: 'select',
    title: 'Select Card',
    direction: 'known-to-learning',
    promptKnown: 'Test prompt',
    optionsKnown: ['A', 'B'],
    optionsLearning: ['А', 'Б'],
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
  };
  direction: 'known-to-learning' | 'learning-to-known' = 'known-to-learning';
  selectedIndex: number | null = null;
  feedback: 'correct' | 'incorrect' | null = null;
  fontSize: 'sm' | 'md' | 'lg' = 'md';

  onSelect(): void {
    /* placeholder */
  }
  onCheck(): void {
    /* placeholder */
  }
  onNext(): void {
    /* placeholder */
  }
}

describe('SelectCardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TestHostComponent,
        SelectCardComponent,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        LexemeDisplayComponent,
        QuizCardQuestionHeaderComponent,
      ],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have card', () => {
    expect(component.card).toBeDefined();
  });

  it('should have direction input', () => {
    expect(component.direction).toBeDefined();
  });

  it('should have selectedIndex input', () => {
    expect(component.selectedIndex).toBeDefined();
  });

  it('should have feedback input', () => {
    expect(component.feedback).toBeDefined();
  });

  it('should have fontSize input', () => {
    expect(component.fontSize).toBeDefined();
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('app-select-card')).toBeTruthy();
  });
});
