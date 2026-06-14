import { Component, computed, input, output, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DrawCard } from '../../../../core/models';
import { DrawCanvasComponent } from '../../draw-canvas/draw-canvas.component';
import { LexemeDisplayComponent } from '../../lexeme-display/lexeme-display.component';
import { CardFeedback } from '../../../types';

const PRACTICE_MODE_LABELS: Record<NonNullable<DrawCard['practiceMode']>, string> = {
  freehand: 'Свободное рисование',
  'stroke-order': 'Порядок черт',
  radicals: 'Радикалы',
};

@Component({
  selector: 'app-draw-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    DrawCanvasComponent,
    LexemeDisplayComponent,
  ],
  templateUrl: './draw-card.component.html',
  styleUrl: './draw-card.component.scss',
})
export class DrawCardComponent {
  readonly card = input.required<DrawCard>();
  readonly drawSubmitted = input(false);
  readonly feedback = input<CardFeedback>(null);
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  readonly drawSubmittedChange = output<boolean>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();

  readonly canvasRef = viewChild(DrawCanvasComponent);

  readonly hasStrokes = signal(false);

  readonly practiceMode = computed(() => this.card().practiceMode ?? 'freehand');

  readonly practiceLabel = computed(() => PRACTICE_MODE_LABELS[this.practiceMode()]);

  readonly ghostCharacter = computed(() => {
    const card = this.card();
    return card.targetCharacter?.trim() || card.promptLexeme?.primary.trim() || null;
  });

  readonly strokeGuides = computed(() => {
    if (this.practiceMode() !== 'stroke-order') {
      return [];
    }

    return this.card().strokeGuides ?? [];
  });

  readonly radicalHint = computed(() => {
    if (this.practiceMode() !== 'radicals') {
      return null;
    }

    return this.card().radicalHint?.trim() || null;
  });

  onStrokesChange(hasStrokes: boolean): void {
    this.hasStrokes.set(hasStrokes);
    if (!hasStrokes && this.drawSubmitted()) {
      this.drawSubmittedChange.emit(false);
    }
  }

  submitDrawing(): void {
    if (this.feedback() !== null || !this.hasStrokes()) {
      return;
    }

    this.drawSubmittedChange.emit(true);
  }

  tryAgain(): void {
    this.canvasRef()?.clear();
    this.hasStrokes.set(false);
    this.drawSubmittedChange.emit(false);
  }
}
