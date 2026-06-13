import { Component, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TimedCard } from '../../../../core/models';
import { CardFeedback } from '../../../types';
import { buildOptionClass } from '../option-card.utils';

@Component({
  selector: 'app-timed-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './timed-card.component.html',
  styleUrl: './timed-card.component.scss',
})
export class TimedCardComponent implements OnInit, OnDestroy {
  readonly card = input.required<TimedCard>();
  readonly selectedIndex = input<number | null>(null);
  readonly feedback = input<CardFeedback>(null);
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  readonly optionSelected = output<number>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();
  readonly timeExpired = output<void>();

  readonly secondsLeft = signal(0);
  private timerId: number | null = null;

  ngOnInit(): void {
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  optionClass(index: number): string {
    return buildOptionClass(index, this.selectedIndex(), this.feedback(), this.card().correctIndex);
  }

  selectOption(index: number): void {
    if (this.feedback() !== null || this.secondsLeft() <= 0) {
      return;
    }

    this.optionSelected.emit(index);
  }

  private startTimer(): void {
    this.clearTimer();
    this.secondsLeft.set(this.card().timeLimitSec);
    this.timerId = window.setInterval(() => {
      const next = this.secondsLeft() - 1;
      this.secondsLeft.set(next);

      if (next <= 0) {
        this.clearTimer();
        if (this.feedback() === null) {
          this.timeExpired.emit();
        }
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
