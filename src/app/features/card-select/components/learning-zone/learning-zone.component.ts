import { Component, EventEmitter, Output, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CardHostComponent } from '../../../../entities/card/ui/card-host/card-host.component';
import type { Card } from '../../../../entities/card/model';
import type { CardDirection } from '../../../../entities/language-pair/model/language-pair.types';
import type { CardFeedback } from '../../../../entities/card/model/card-interaction.types';
import type { DrawAnswerPayload } from '../../../../entities/chinese/model/draw-answer.types';

/**
 * Zone component for displaying learning results.
 */
@Component({
  standalone: true,
  selector: 'app-learning-zone',
  imports: [
    CardHostComponent,
    FormsModule,
    MatButtonToggleModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './learning-zone.component.html',
  styleUrl: './learning-zone.component.scss',
})
export class LearningZoneComponent {
  // ─── Inputs ───────────────────────────────────────────────────────────────

  /** Selected scenario ID. */
  readonly selectedScenarioId = input.required<string>();

  /** Course title display. */
  readonly courseTitle = input.required<string>();

  /** Lesson title display. */
  readonly lessonTitle = input.required<string>();

  /** Scenario title display. */
  readonly scenarioTitle = input.required<string>();

  /** Label for the scenario source. */
  readonly scenarioSourceLabel = input.required<string>();

  /** Whether to show the direction toggle. */
  readonly showDirectionToggle = input.required<boolean>();

  /** Current session direction. */
  readonly sessionDirection = input.required<CardDirection>();

  /** Progress label text. */
  readonly progressLabel = input.required<string>();

  /** Card progress percentage (0–100). */
  readonly cardProgressPercent = input.required<number>();

  /** Warning text for missing cards, or null. */
  readonly missingCardsWarning = input<string | null>(null);

  /** Whether cards are currently loading. */
  readonly loading = input.required<boolean>();

  /** Error message, or null. */
  readonly error = input<string | null>(null);

  /** Whether the course/scenario is completed. */
  readonly completed = input.required<boolean>();

  /** Whether to show the course certificate chip. */
  readonly showCourseCertificate = input.required<boolean>();

  /** Whether there is a next lesson scenario. */
  readonly hasNextLessonScenario = input.required<boolean>();

  /** Font size: 'sm', 'md', or 'lg'. */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /** Currently displayed card data. */
  readonly currentCard = input.required<Card | null>();

  /** Whether the learning tab is currently active. */
  readonly isLearningTabActive = input.required<boolean>();

  // ─── Outputs ──────────────────────────────────────────────────────────────

  /** Event emitted when direction changes. */
  @Output() readonly directionChange = new EventEmitter<CardDirection>();

  /** Event emitted when navigating to scenarios tab. */
  @Output() readonly goToScenarios = new EventEmitter<void>();

  /** Event emitted when retrying card load. */
  @Output() readonly retry = new EventEmitter<void>();

  /** Event emitted when navigating to the next lesson scenario. */
  @Output() readonly goToNextLessonScenario = new EventEmitter<void>();

  /** Event emitted when restarting the session. */
  @Output() readonly restart = new EventEmitter<void>();

  /** Event emitted when an option is selected. */
  @Output() readonly optionSelected = new EventEmitter<number>();

  /** Event emitted when the answer text changes. */
  @Output() readonly answerTextChange = new EventEmitter<string>();

  /** Event emitted when memory completion state changes. */
  @Output() readonly memoryCompleteChange = new EventEmitter<boolean>();

  /** Event emitted when draw submission state changes. */
  @Output() readonly drawSubmittedChange = new EventEmitter<boolean>();

  /** Event emitted when the draw answer changes. */
  @Output() readonly drawAnswerChange = new EventEmitter<DrawAnswerPayload | null>();

  /** Event emitted when the timer expires. */
  @Output() readonly timeExpired = new EventEmitter<void>();

  /** Event emitted when the user checks their answer. */
  @Output() readonly checkAnswer = new EventEmitter<void>();

  /** Event emitted when moving to the next card. */
  @Output() readonly nextCard = new EventEmitter<void>();

  // ─── Internal state ───────────────────────────────────────────────────────

  /** Index of the currently selected option. */
  readonly selectedIndex = signal(0);

  /** Current answer text. */
  readonly answerText = signal('');

  /** Whether memory board is complete. */
  readonly memoryComplete = signal(false);

  /** Nonce for the memory board. */
  readonly memoryBoardNonce = signal(0);

  /** Whether the user has submitted a draw answer. */
  readonly drawSubmitted = signal(false);

  /** Draw answer payload. */
  readonly drawAnswer = signal<DrawAnswerPayload | null>(null);

  /** Current feedback message. */
  readonly feedback = signal<CardFeedback>(null);

  // ─── Computed ─────────────────────────────────────────────────────────────

  /** Whether the current card has a valid ID. */
  readonly hasCurrentCard = computed(() => this.currentCard() !== null);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  /** Handles direction toggle changes. */
  onDirectionChange(direction: CardDirection): void {
    this.directionChange.emit(direction);
  }

  /** Handles retry button click. */
  onRetry(): void {
    this.retry.emit();
  }

  /** Handles "go to next lesson scenario" button click. */
  onGoToNextLessonScenario(): void {
    this.goToNextLessonScenario.emit();
  }

  /** Handles restart button click. */
  onRestart(): void {
    this.restart.emit();
  }

  /** Handles scenario navigation button click. */
  onGoToScenarios(): void {
    this.goToScenarios.emit();
  }

  /** Handles option selection. */
  onOptionSelected(index: number): void {
    this.optionSelected.emit(index);
  }

  /** Handles answer text changes. */
  onAnswerTextChange(text: string): void {
    this.answerTextChange.emit(text);
  }

  /** Handles memory completion state changes. */
  onMemoryCompleteChange(complete: boolean): void {
    this.memoryCompleteChange.emit(complete);
  }

  /** Handles draw submission state changes. */
  onDrawSubmittedChange(submitted: boolean): void {
    this.drawSubmittedChange.emit(submitted);
  }

  /** Handles draw answer changes. */
  onDrawAnswerChange(answer: DrawAnswerPayload | null): void {
    this.drawAnswerChange.emit(answer);
  }

  /** Handles time expiration. */
  onTimeExpired(): void {
    this.timeExpired.emit();
  }

  /** Handles answer check. */
  onCheckAnswer(): void {
    this.checkAnswer.emit();
  }

  /** Handles next card navigation. */
  onNextCard(): void {
    this.nextCard.emit();
  }
}
